import { CallParser } from './callParser';
import { Definition } from './definition';
import { evaluateString } from './evaluateString';
import { ProcessContext } from './processContext';
import { isInString, makeError } from './util';

interface DefinitionPos {
    start: number;
    end: number;
}

export class MacroEvaluator {
    private static _operandSeparators = [
        ' ',
        '\t',
        '=',
        '!',
        '+',
        '-',
        '*',
        '/',
        '\\',
        '%',
        '<',
        '>',
        '=',
        '#',
        '&',
        '|',
        ';',
        '?',
        ':',
        ',',
        '{',
        '}',
        '(',
        ')',
        '[',
        ']',
        '\n' //might be introduced into a string only by multiline macro
    ];

    evaluate(ctx: ProcessContext): void {
        for (const def of ctx.defs.keys()) {
            const impl = ctx.defs.get(def)!;
            let findPos = 0;
            let pos = this._findDefinition(ctx.current, def, findPos);
            while (pos.end) {
                findPos = impl.callable
                    ? this._tryEvalExpression(ctx, impl, pos)
                    : this._evalConstant(ctx, impl, pos);
                pos = this._findDefinition(ctx.current, def, findPos);
            }
        }
        ctx.current = evaluateString(ctx.current);
    }

    _findDefinition(line: string, def: string, startAt: number): DefinitionPos {
        while (startAt < line.length) {
            const start = line.indexOf(def, startAt);
            if (start < 0) {
                break;
            } else if (this._isOperand(line, def, start) && !isInString(line, def, start)) {
                return { start, end: start + def.length };
            } else {
                startAt = start + def.length;
            }
        }
        return { start: 0, end: 0 };
    }

    _isOperand(line: string, def: string, pos: number): boolean {
        const left = pos === 0 || MacroEvaluator._operandSeparators.indexOf(line[pos - 1]) >= 0;
        if (left) {
            const right =
                pos + def.length === line.length ||
                MacroEvaluator._operandSeparators.indexOf(line[pos + def.length]) >= 0;
            return right;
        }
        return false;
    }

    _evalConstant(ctx: ProcessContext, def: Definition, pos: DefinitionPos): number {
        const left = pos.start > 0 ? ctx.current.substr(0, pos.start) : '';
        const right = pos.end < ctx.current.length ? ctx.current.substr(pos.end) : '';

        let value = def.body;
        if (!def.optimized) {
            const bctx = ctx.deepCopy(def.body);
            const defn = ctx.current.substr(pos.start, pos.end);
            bctx.defs.delete(defn);
            this.evaluate(bctx);
            value = bctx.lines[0];
        }

        ctx.current = left + value + right;

        return pos.start + value.length;
    }

    _tryEvalExpression(ctx: ProcessContext, def: Definition, pos: DefinitionPos): number {
        const startIndex = ctx.index;
        const call = this._getCallParser().parse(ctx, pos.end);
        if (call) {
            if (call.params.length === def.params!.length) {
                call.params = call.params.map(p => {
                    const pctx = ctx.shallowCopy(p);
                    this.evaluate(pctx);
                    return pctx.lines[0];
                });

                const bctx = ctx.deepCopy(def.body);
                call.params.forEach((p, i) =>
                    bctx.defs.set(def.params![i], { body: p, callable: false, optimized: true })
                );
                this.evaluate(bctx);

                if (startIndex === ctx.index) {
                    ctx.current =
                        ctx.current.substr(0, pos.start) + bctx.lines[0] + ctx.current.substr(call.end + 1);
                } else {
                    const deleteLines = ctx.index - startIndex;
                    ctx.lines[startIndex] =
                        ctx.lines[startIndex].substr(0, pos.start) +
                        bctx.lines[0] +
                        ctx.lines[ctx.index].substr(call.end + 1);
                    ctx.lines.splice(startIndex + 1, deleteLines);
                    ctx.next(-deleteLines);
                }
                return pos.start + bctx.lines[0].length;
            } else {
                const macro = ctx.current.substring(pos.start, pos.end);
                throw makeError(
                    `Macro \"${macro}\" definition had ${def.params!.length} arguments but was called with ${
                        call.params.length
                    } params`,
                    ctx
                );
            }
        } else {
            return pos.end;
        }
    }

    _getCallParser(): CallParser {
        return new CallParser();
    }
}
