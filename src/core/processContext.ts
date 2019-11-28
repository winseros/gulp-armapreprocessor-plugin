import { Definition } from './definition';

export enum IfBlock {
    None,
    If,
    Else
}

export class ProcessContext {
    readonly path: string;
    readonly lines: string[];
    readonly defs: Map<string, Definition>;
    ifblock = IfBlock.None;
    ifmatch = false;
    command?: string;
    startLine = 0;
    private _index = 0;

    constructor(path: string, lines: string[], startLine = 0, defs = new Map<string, Definition>()) {
        this.path = path;
        this.lines = lines;
        this.startLine = startLine;
        this.defs = defs;
    }

    get index(): number {
        return this._index;
    }

    get current(): string {
        return this.lines[this._index];
    }

    set current(value: string) {
        this.lines[this._index] = value;
    }

    get eof(): boolean {
        return this.index >= this.lines.length;
    }

    next(lines = 1): this {
        this._index += lines;
        return this;
    }

    deepCopy(body: string): ProcessContext {
        const ctx = new ProcessContext(this.path, [body], this._index);
        for (const pair of this.defs) {
            ctx.defs.set(pair[0], pair[1]);
        }
        return ctx;
    }

    shallowCopy(body: string): ProcessContext {
        return new ProcessContext(this.path, [body], this._index, this.defs);
    }
}
