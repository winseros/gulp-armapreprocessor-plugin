import { Definition } from './definition';
import { ProcessContext } from './processContext';
import { SignatureParser } from './signatureParser';

const parseCallable = (ctx: ProcessContext): Definition => {
    const sig = new SignatureParser().parse(ctx);
    ctx.current = ctx.current.substr(sig.charCount);
    const macro = parseStatic(ctx);
    macro.callable = true;
    macro.params = sig.params;
    return macro;
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

const parseStatic = (ctx: ProcessContext): Definition => {
    const lines = [];

    let first = true;
    while (!ctx.eof) {
        let line = first ? trimForwardSpace(ctx.current) : ctx.current;
        ctx.current = '';
        ctx.next();

        first = false;

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
        body: text,
        callable: false,
        optimized: false
    };
};

export const parseDefinition = (ctx: ProcessContext): Definition => {
    if (ctx.current.trim() === '') {
        return {body: '', callable: false, optimized: true};
    } else {
        const result = ctx.current[0] === '(' ? parseCallable(ctx) : parseStatic(ctx);
        return result;
    }
};
