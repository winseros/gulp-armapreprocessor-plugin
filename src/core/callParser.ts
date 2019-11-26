import {ProcessContext} from './processContext';
import {makeError} from './util';

export class Call {
    params: string[];
    end: number;
}

export class CallParser {
    parse(ctx: ProcessContext, start: number): Call | undefined {
        if (ctx.current[start] === '(') {
            let end = false;
            const params = [];
            let s = start + 1;
            while (!end) {
                const param = this._readCallParam(ctx, s);
                s = param.next;
                end = param.end;
                if (!end || param.name !== '') {
                    params.push(param.name); //a single '' param - means () call signature
                }
            }
            return {
                params,
                end: s
            };
        } else {
            return undefined;
        }
    }

    _readCallParam(ctx: ProcessContext, pos: number): { name: string; next: number; end: boolean } {
        let i = pos;
        let isString = false;
        let param = '';
        let end = false;
        let parenthesis = 0;
        while (true) {
            if (i >= ctx.current.length) {
                ctx.next();
                if (ctx.eof) {
                    end = true;
                    break;
                } else {
                    param += '\n';
                    i = 0;
                }
            }
            if (ctx.current[i] === '(') {
                if (!isString) {
                    parenthesis++;
                }
            } else if (ctx.current[i] === ')') {
                if (!isString) {
                    if (parenthesis) {
                        parenthesis--;
                    } else {
                        end = true;
                        break;
                    }
                }
            } else if (ctx.current[i] === '"') {
                if (isString) {
                    if (i < ctx.current.length - 1 && ctx.current[i + 1] === '"') {
                        param += '"';
                        i++;
                    } else {
                        isString = false;
                    }
                } else {
                    isString = true;
                }
            } else if (ctx.current[i] === ',' && !parenthesis) {
                if (!isString) {
                    i++;
                    break;
                }
            }
            param += ctx.current[i];
            i++;
        }
        return {
            name: param,
            next: i,
            end
        };
    }
}
