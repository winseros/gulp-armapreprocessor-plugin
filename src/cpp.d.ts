export type CallbackFunc = (contents: string | null, descriptor?: any) => void;
export type IncludeFunc = (
    descriptor: any,
    includeName: string,
    isGlobal: boolean,
    callback: CallbackFunc
) => void;

export interface PreprocessorSettings {
    signal_char?: string;
    warn_func?: (e: string) => void;
    error_func?: (e: string) => void;
    include_func?: IncludeFunc;
    completion_func?: (text: string, lines: string[], state: any) => void;
    pragma_func?: (pragma: string) => void;
    comment_stripper?: (text: string) => string;
}

export interface Preprocessor {
    clear(): void;
    defined(macro: string): boolean;
    define(macro: string, value: string): void;
    undefine(macro: string): void;
    define_multiple(dict: { [index: string]: string }): void;
    run(text: string, name?: any): void;
}

export function create(settings: PreprocessorSettings): Preprocessor;
