import * as assert from 'assert';
import * as File from 'vinyl';
import { IncludeResolver } from './includeResolver';
import { MacroEvaluator } from './macroEvaluator';
import { parseDefinition } from './parseDefinition';
import { IfBlock, ProcessContext } from './processContext';
import { stripComments } from './stripComments';
import { makeError } from './util';

const rInclude1 = /^\s*#\w+\s+"(?<name>[^s]+)"\s*$/;
const rInclude2 = /^\s*#\w+\s+<(?<name>[^s]+)>\s*$/;
const rCommandSingleParam = /^\s*#\w+\s+(?<name>[\w_$\d]+)/;
const rCommand = /^\s*#(?<command>[^\s]+)/;

export class PreprocessorCore {
    private readonly _includeResolver: IncludeResolver;
    private readonly _evaluator = new MacroEvaluator();

    constructor(includeResolver: IncludeResolver) {
        assert(includeResolver, 'includeResolver');
        this._includeResolver = includeResolver;
    }

    async process(file: File): Promise<void> {
        const lines = this._splitLines(file.contents as Buffer);
        const ctx = new ProcessContext(file.path, lines);
        while (!ctx.eof) {
            await this._processLine(ctx);
        }
        if (ctx.ifblock) {
            throw makeError('Non-closed #ifdef / #ifndef / #else block', ctx);
        }
        const txt = lines.join('\n');
        file.contents = Buffer.from(txt);
    }

    async _processLine(ctx: ProcessContext): Promise<void> {
        const m = ctx.current.match(rCommand);
        if (m) {
            ctx.command = m.groups!.command;
            if (this._tryHandleIfdef(ctx)) {
                return;
            }
            if (this._tryHandleIfndef(ctx)) {
                return;
            }
            if (this._tryHandleElse(ctx)) {
                return;
            }
            if (this._tryHandleEndif(ctx)) {
                return;
            }
            if (this._tryHandleUndef(ctx)) {
                return;
            }
            if (await this._tryHandleInclude(ctx)) {
                return;
            }
            if (this._tryHandleDefine(ctx)) {
                return;
            }
            throw makeError(`Unknown preprocessor directive: #${ctx.command}`, ctx);
        } else {
            ctx.command = undefined;
        }

        if (ctx.ifblock && !ctx.ifmatch) {
            ctx.current = '';
        }

        this._evaluator.evaluate(ctx);
        ctx.next();
    }

    _tryHandleIfdef(ctx: ProcessContext): boolean {
        if (ctx.command === 'ifdef') {
            if (ctx.ifblock) {
                throw makeError('Embedded #ifdef is not supported', ctx);
            }
            const m = ctx.current.match(rCommandSingleParam);
            if (m) {
                ctx.ifblock = IfBlock.If;
                ctx.ifmatch = ctx.defs.has(m.groups!.name);
                ctx.current = '';
                ctx.next();
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
            const m = ctx.current.match(rCommandSingleParam);
            if (m) {
                ctx.ifblock = IfBlock.If;
                ctx.ifmatch = !ctx.defs.has(m.groups!.name);
                ctx.current = '';
                ctx.next();
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
            ctx.current = '';
            ctx.next();
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
            ctx.current = '';
            ctx.next();
            return true;
        }
        return false;
    }

    _tryHandleUndef(ctx: ProcessContext): boolean {
        if (ctx.command === 'undef') {
            if (ctx.ifblock) {
                throw makeError('Embedded #undef is not supported', ctx);
            }
            const m = ctx.current.match(rCommandSingleParam);
            if (m) {
                ctx.defs.delete(m.groups!.name);
                ctx.current = '';
                ctx.next();
                return true;
            } else {
                throw makeError('Malformed #undef directive', ctx);
            }
        }
        return false;
    }

    async _tryHandleInclude(ctx: ProcessContext): Promise<boolean> {
        if (ctx.command === 'include') {
            const str = ctx.current;
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
                    ctx.current = '';
                }
                return true;
            } else {
                throw makeError('Malformed #include directive', ctx);
            }
        }
        return false;
    }

    _tryHandleDefine(ctx: ProcessContext): boolean {
        if (ctx.command === 'define') {
            if (ctx.ifblock) {
                throw makeError('Embedded #define is not supported', ctx);
            }
            const m = ctx.current.match(rCommandSingleParam);
            if (m) {
                ctx.current = ctx.current.substring(m[0].length);
                const definition = parseDefinition(ctx);
                ctx.defs.set(m.groups!.name, definition);
                return true;
            } else {
                throw makeError('Malformed #define directive', ctx);
            }
        } else {
            return false;
        }
    }

    _splitLines(text: Buffer): string[] {
        const contents = stripComments(text)
            .toString()
            .split(/\r\n|\r|\n/);
        return contents;
    }
}
