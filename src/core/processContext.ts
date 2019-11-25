import { Definition } from './definitionParser';

export enum IfBlock {
    None,
    If,
    Else
}

export class ProcessContext {
    readonly path: string;
    readonly lines: string[];
    readonly defs = new Map<string, Definition>();
    ifblock = IfBlock.None;
    ifmatch = false;
    command?: string;
    startLine = 0;
    private _index = 0;

    constructor(path: string, lines: string[], startLine = 0) {
        this.path = path;
        this.lines = lines;
        this.startLine = startLine;
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
}
