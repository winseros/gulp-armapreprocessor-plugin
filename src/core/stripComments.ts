const chSingleQuote = "'".charCodeAt(0);
const chDoubleQuote = '"'.charCodeAt(0);
const chBackwardSlash = '\\'.charCodeAt(0);
const chForwardSlash = '/'.charCodeAt(0);
const chAsterisk = '*'.charCodeAt(0);
const chLf = '\n'.charCodeAt(0);
const chCr = '\r'.charCodeAt(0);

const isLastChar = (str: Buffer, index: number) => index >= str.byteLength - 1;

export const stripComments = (str: Buffer): Buffer => {
    let blockComment = false;
    let lineComment = false;
    let quote = false;

    const out = Buffer.allocUnsafe(str.byteLength);

    let inIndex = 0;
    let outIndex = 0;
    while (inIndex < str.byteLength) {
        const current = str.readInt8(inIndex);

        if (current === chCr || current === chLf) {
            lineComment = false;
            out.writeInt8(current, outIndex);
            inIndex++;
            outIndex++;
            continue;
        }

        if (quote) {
            const prev = str.readInt8(inIndex - 1);
            if ((current === chSingleQuote || current === chDoubleQuote) && prev !== chBackwardSlash) {
                quote = false;
            }
            out.writeInt8(current, outIndex);
            inIndex++;
            outIndex++;
            continue;
        }

        if (blockComment) {
            if (current === chAsterisk && !isLastChar(str, inIndex)) {
                const next = str.readInt8(inIndex + 1);
                if (next === chForwardSlash) {
                    inIndex++;
                    blockComment = false;
                }
            }
            inIndex++;
            continue;
        }

        if (lineComment) {
            inIndex++;
            continue;
        }

        if (current === chForwardSlash && !isLastChar(str, inIndex)) {
            const next = str.readInt8(inIndex + 1);
            if (next === chAsterisk) {
                inIndex++;
                blockComment = true;
                continue;
            }
            if (next === chForwardSlash) {
                inIndex++;
                lineComment = true;
                continue;
            }
            out.writeInt8(current, outIndex);
            outIndex++;
            inIndex++;
        } else {
            quote = current === chSingleQuote || current === chDoubleQuote;
            out.writeInt8(current, outIndex);
            inIndex++;
            outIndex++;
        }
    }

    return outIndex >= out.byteLength ? out : out.slice(0, outIndex);
};
