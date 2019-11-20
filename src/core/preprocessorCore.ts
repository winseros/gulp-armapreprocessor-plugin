import * as assert from 'assert';
import * as File from 'vinyl';
import { DefinitionCollection } from './definitionCollection';
import { IncludeResolver } from './includeResolver';
import { stripComments } from './stripComments';

const makeRe = (command: string) => new RegExp(`^\\s*#${command}\\s+(?<name>[\\w\\n_]+)\\s*$`);
const rDefine = /^\s*#define(\s+|#|\()/;
const rInclude1 = /^\s*#include\s+"(?<name>[^s]+)"\s*$/;
const rInclude2 = /^\s*#include\s+<(?<name>[^s]+)>\s*$/;

const rUndef = makeRe('undef');
const rIfdef = makeRe('ifdef');
const rIfndef = makeRe('ifndef');
const rElse = makeRe('endif');

const pZero = Promise.resolve(0);

interface ProcessContext {
    path: string;
    lines: string[];
    index: number;
}

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
            path: file.path
        };
        while (ctx.index < ctx.lines.length) {
            ctx.index += await this._processLine(ctx);
        }
    }

    async _processLine(ctx: ProcessContext): Promise<number> {
        const included = await this._tryHandleIncludes(ctx);
        if (included) {
            return 0;
        }
        return 1;
    }

    async _tryHandleIncludes(ctx: ProcessContext): Promise<boolean> {
        const str = ctx.lines[ctx.index];
        const inc = str.match(rInclude1) || str.match(rInclude2);
        if (inc) {
            const name = inc.groups!.name;
            const included = await this._includeResolver.getContents(name, ctx.path);
            const splitted = this._splitLines(included);
            const right = ctx.lines.splice(ctx.index).splice(1);
            ctx.lines.push(...splitted);
            ctx.lines.push(...right);
            return true
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
