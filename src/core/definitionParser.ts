import { ProcessContext } from './processContext';

export interface Definition {
    lineCount: number;
    invoke?: (params?: string[]) => string;
    value?: string;
}

const parseMacro = (ctx: ProcessContext): Definition => {
    const lines = [];
    return null as any;
};

const nextLine = (str: string) => {
    let index = -1;
    for (let i = str.length - 1; i >= 0; i--) {
        if (str[i] !== 's' && str[i] !== '\t') {
            if (str[i] === '\\') {
                index = i;
                break;
            }
        }
    }
    return index;
};

const trimForwardSpace = (str: string) => {
    let trim = 0;
    for (const ch of str) {
        if (ch === ' ') {
            trim++;
        } else {
            break;
        }
    }
    return trim ? str.substring(trim) : str;
};

const parseExpression = (ctx: ProcessContext): Definition => {
    const lines = [];

    for (let i = ctx.index; i < ctx.lines.length; i++) {
        let line = i === ctx.index ? trimForwardSpace(ctx.lines[i]) : ctx.lines[i];
        const nextLineChar = nextLine(line);
        if (nextLineChar >= 0) {
            line = line.substring(0, nextLineChar);
            lines.push(line);
        } else {
            lines.push(line);
            break;
        }
    }

    const text = lines.length > 1 ? lines.join('\n') : lines[0];
    return {
        lineCount: lines.length,
        value: text
    };
};

export const definitionParser = (ctx: ProcessContext): Definition => {
    if (ctx.current.trim() === '') {
        return {
            lineCount: 1
        };
    } else {
        const result = ctx.current[0] === '(' ? parseMacro(ctx) : parseExpression(ctx);
        return result;
    }
};
