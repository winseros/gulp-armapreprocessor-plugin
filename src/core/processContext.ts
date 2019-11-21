export enum IfBlock {
    None,
    If,
    Else
}

export interface ProcessContext {
    path: string;
    lines: string[];
    index: number;
    ifblock: IfBlock;
    ifmatch: boolean;
    command?: string;
}
