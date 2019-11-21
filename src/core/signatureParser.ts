import { ProcessContext } from './processContext';
import { makeError } from './util';

export interface MacroSignature {
    params: string[];
    charCount: number;
}

export class SignatureParser {
    private static _rParamChar = /^[\w\d_]+$/;
    private _index: number;

    parse(ctx: ProcessContext): MacroSignature {
        const line = ctx.lines[ctx.index];
        if (line[0] !== '(') {
            throw makeError('Macro signature is expected to start with "("', ctx);
        }
        this._index = 1;
        const signature: MacroSignature = {
            charCount: 0,
            params: []
        };
        while (this._index < line.length) {
            const p = this._readNextParam(ctx);
            signature.params.push(p);
            if (line[this._index] === ')') {
                break;
            } else {
                this._index++;
            }
        }

        this._validateParams(ctx, signature.params);

        if (line[this._index] === ')') {
            signature.charCount = this._index + 1;
        } else {
            throw makeError('Macro signature is expected to end with ")"', ctx);
        }
        return signature;
    }

    _validateParams(ctx: ProcessContext, params: string[]): void {
        if (params.length > 1) {
            params.forEach(p => {
                if (!p.length) {
                    throw makeError('Empty macro param name', ctx);
                }
                this._validateParamName(ctx, p);
            });
        } else {
            if (params[0].length) {
                this._validateParamName(ctx, params[0]);
            } else {
                params.splice(0);
            }
        }
    }

    _validateParamName(ctx: ProcessContext, p: string): void {
        if (!p.match(SignatureParser._rParamChar)) {
            throw makeError(`"${p}" is not a valid macro param name`, ctx);
        }
    }

    _readNextParam(ctx: ProcessContext): string {
        const line = ctx.lines[ctx.index];
        let name = '';
        while (this._index < line.length) {
            const ch = line[this._index];
            if (ch === ',' || ch === ')') {
                break;
            }
            name += ch;
            this._index++;
        }

        name = name.trim();

        return name;
    }
}
