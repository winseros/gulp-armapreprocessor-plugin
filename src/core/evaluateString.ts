import { isInString } from './util';

const chConcat = '##';
const chStringify = '#';

const concatenate = (text: string, char: string): string => {
    let pos = text.indexOf(char, 0);
    while (pos >= 0) {
        if (!isInString(text, char, pos)) {
            text = text.substr(0, pos) + text.substr(pos + char.length);
        } else {
            pos += char.length;
        }
        pos = text.indexOf(char, pos);
    }
    return text;
};

const stringify = (text: string): string => {
    const reOperator = /(#+)(\w[\w\d_]*)/g;
    let match = reOperator.exec(text);
    while (match) {
        if (match[1].length % 2 === 1 && !isInString(text, match[0], reOperator.lastIndex)) {
            text =
                text.substr(0, reOperator.lastIndex - match[2].length - 1) +
                '"' +
                match[2] +
                '"' +
                text.substr(reOperator.lastIndex);
        }
        match = reOperator.exec(text);
    }
    return text;
};

export const evaluateString = (text: string) => {
    text = stringify(text);
    text = concatenate(text, chConcat); //concatenate
    text = concatenate(text, chStringify); //cleanup
    return text;
};
