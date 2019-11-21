import * as assert from 'assert';
import { PluginError } from 'gulp-util';
import * as File from 'vinyl';
import { constants } from '../constants';
import { DefinitionCollection } from './definitionCollection';
import { IncludeResolver } from './includeResolver';
import { stripComments } from './stripComments';

const rInclude1 = /^\s*#\w+\s+"(?<name>[^s]+)"\s*$/;
const rInclude2 = /^\s*#\w+\s+<(?<name>[^s]+)>\s*$/;
const rCommandSingleParam = /^\s*#\w+\s+(?<name>[\w|_|$|\d]+)/;
const rCommand = /^\s*#(?<command>[^\s]+)/;

enum IfBlock {
    None,
    If,
    Else
}

interface ProcessContext {
    path: string;
    lines: string[];
    index: number;
    ifblock: IfBlock;
    ifmatch: boolean;
    command?: string;
}

const makeError = (msg: string, ctx: ProcessContext) =>
    new PluginError({
        plugin: constants.pluginName,
        message: msg,
        fileName: ctx.path,
        lineNumber: ctx.index
    });

export class PreprocessorCore {
    private readonly _includeResolver: IncludeResolver;
    private readonly _definitions = new DefinitionCollection();

    constructor(includeResolver: IncludeResolver) {
        assert(includeResolver, 'includeResolver');
        this._includeResolver = includeResolver;
    }

    async process(file: File): Promise<void> {
        const lines = this._splitLines(file.contents as Buffer);
        const ctx: ProcessContext = {
            lines,
            index: 0,
            path: file.path,
            ifblock: IfBlock.None,
            ifmatch: false
        };
        while (ctx.index < ctx.lines.length) {
            ctx.index += await this._processLine(ctx);
        }
        if (ctx.ifblock) {
            throw makeError('Non-closed #ifdef / #ifndef / #else block', ctx);
        }
        const txt = lines.join('\n');
        file.contents = Buffer.from(txt);
    }

    async _processLine(ctx: ProcessContext): Promise<number> {
        const m = ctx.lines[ctx.index].match(rCommand);
        if (m) {
            ctx.command = m.groups!.command;
            if (this._tryHandleIfdef(ctx)) {
                return 1;
            }
            if (this._tryHandleIfndef(ctx)) {
                return 1;
            }
            if (this._tryHandleElse(ctx)) {
                return 1;
            }
            if (this._tryHandleEndif(ctx)) {
                return 1;
            }
            if (this._tryHandleUndef(ctx)) {
                return 1;
            }
            if (await this._tryHandleIncludes(ctx)) {
                return 0;
            }
            throw makeError(`Unknown preprocessor directive: #${ctx.command}`, ctx);
        } else {
            ctx.command = undefined;
        }

        if (ctx.ifblock && !ctx.ifmatch) {
            ctx.lines[ctx.index] = '';
        }

        return 1;
    }

    _tryHandleIfdef(ctx: ProcessContext): boolean {
        if (ctx.command === 'ifdef') {
            if (ctx.ifblock) {
                throw makeError('Embedded #ifdef is not supported', ctx);
            }
            const m = ctx.lines[ctx.index].match(rCommandSingleParam);
            if (m) {
                ctx.ifblock = IfBlock.If;
                ctx.ifmatch = this._definitions.defined(m.groups!.name);
                ctx.lines[ctx.index] = '';
                return true;
            } else {
                throw makeError('Malformed #ifdef directive', ctx);
            }
        }
        return false;
    }

    _tryHandleIfndef(ctx: ProcessContext): boolean {
        if (ctx.command === 'ifndef') {
            if (ctx.ifblock) {
                throw makeError('Embedded #ifdef is not supported', ctx);
            }
            const m = ctx.lines[ctx.index].match(rCommandSingleParam);
            if (m) {
                ctx.ifblock = IfBlock.If;
                ctx.ifmatch = !this._definitions.defined(m.groups!.name);
                ctx.lines[ctx.index] = '';
                return true;
            } else {
                throw makeError('Malformed #ifndef directive', ctx);
            }
        }
        return false;
    }

    _tryHandleElse(ctx: ProcessContext): boolean {
        if (ctx.command === 'else') {
            if (ctx.ifblock === IfBlock.Else) {
                throw makeError('Misplaced #else directive', ctx);
            }
            if (!ctx.ifblock) {
                throw makeError('#else outside #ifdef / #ifndef block', ctx);
            }
            ctx.ifblock = IfBlock.Else;
            ctx.ifmatch = !ctx.ifmatch;
            ctx.lines[ctx.index] = '';
            return true;
        }
        return false;
    }

    _tryHandleEndif(ctx: ProcessContext): boolean {
        if (ctx.command === 'endif') {
            if (!ctx.ifblock) {
                throw makeError('#endif outside #ifdef / #ifndef block', ctx);
            }
            ctx.ifblock = IfBlock.None;
            ctx.ifmatch = false;
            ctx.lines[ctx.index] = '';
            return true;
        }
        return false;
    }

    _tryHandleUndef(ctx: ProcessContext): boolean {
        if (ctx.command === 'undef') {
            if (ctx.ifblock) {
                throw makeError('Embedded #undef is not supported', ctx);
            }
            const m = ctx.lines[ctx.index].match(rCommandSingleParam);
            if (m) {
                this._definitions.undef(m.groups!.name);
                ctx.lines[ctx.index] = '';
                return true;
            } else {
                throw makeError('Malformed #undef directive', ctx);
            }
        }
        return false;
    }

    async _tryHandleIncludes(ctx: ProcessContext): Promise<boolean> {
        if (ctx.command === 'include') {
            const str = ctx.lines[ctx.index];
            const inc = str.match(rInclude1) || str.match(rInclude2);
            if (inc) {
                if (!ctx.ifblock || ctx.ifmatch) {
                    const name = inc.groups!.name;
                    const included = await this._includeResolver.getContents(name, ctx.path);
                    const splitted = this._splitLines(included);
                    const right = ctx.lines.splice(ctx.index).splice(1);
                    ctx.lines.push(...splitted);
                    ctx.lines.push(...right);
                } else {
                    ctx.lines[ctx.index] = '';
                }
                return true;
            } else {
                throw makeError('Malformed #include directive', ctx);
            }
        }
        return false;
    }

    _splitLines(text: Buffer): string[] {
        const contents = stripComments(text)
            .toString()
            .split(/\r\n|\r|\n/);
        return contents;
    }
}
