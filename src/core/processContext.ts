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
    private _index = 0;

    constructor(path: string, lines: string[]) {
        this.path = path;
        this.lines = lines;
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

    next(lines = 1): this {
        this._index += lines;
        return this;
    }
}
