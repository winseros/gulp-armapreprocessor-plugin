import { Definition } from './definitionParser';
import { ProcessContext } from './processContext';
import { makeError } from './util';
import { CallParser } from './callParser';

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
            const pos = this._findDefinition(ctx.current, def);
            if (pos.end) {
                const impl = ctx.defs.get(def)!;
                if (impl.value) {
                    this._evalConstant(ctx, impl, pos);
                } else if (impl.invoke) {
                    this._tryEvalExpression(ctx, impl, pos);
                }
            }
        }
    }

    _findDefinition(line: string, def: string): DefinitionPos {
        const start = line.indexOf(def);
        return start >= 0 && this._isOperand(line, def, start) && !this._isInString(line, def, start)
            ? { start, end: start + def.length }
            : { start: 0, end: 0 };
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

    _isInString(line: string, def: string, pos: number): boolean {
        let quotes = 0;
        let l = pos - 1;
        while (l >= 0) {
            if (line[l] === '"') {
                quotes++;
            }
            l--;
        }
        const isIn = quotes % 2 === 1;
        return isIn;
    }

    _evalConstant(ctx: ProcessContext, def: Definition, pos: DefinitionPos): void {
        let stringify = false;
        let left = pos.start > 0 ? ctx.current.substr(0, pos.start) : '';
        if (left.endsWith('##')) {
            left = left.substr(0, left.length - 2);
        } else if (left.endsWith('#')) {
            left = left.substr(0, left.length - 1);
            stringify = true;
        }
        let right = pos.end < ctx.current.length ? ctx.current.substr(pos.end) : '';
        if (right.startsWith('##')) {
            right = right.substr(2);
        }
        ctx.current = left + (stringify ? `"${def.value}"` : def.value) + right;
    }

    _tryEvalExpression(ctx: ProcessContext, def: Definition, pos: DefinitionPos): void {
        const startIndex = ctx.index;
        const call = this._getCallParser().parse(ctx, pos.end);
        if (call) {
            if (call.params.length === def.invoke!.params.length) {
                call.params = call.params.map(p => {
                    const localCtx = new ProcessContext(ctx.path, [p], ctx.index);
                    new MacroEvaluator().evaluate(localCtx);
                    return localCtx.lines[0];
                });
                if (startIndex === ctx.index) {
                    ctx.current = ctx.current.substr(0, pos.start) + 'abcd' + ctx.current.substr(call.end + 1);
                    ctx.next();
                } else {
                    const deleteLines = ctx.index - startIndex - 2;
                    ctx.lines[startIndex] = ctx.lines[startIndex].substr(0, pos.start);
                    ctx.lines[ctx.index] = ctx.lines[ctx.index].substr(call.end);
                    ctx.lines.splice(startIndex + 1, deleteLines);
                    ctx.next(-deleteLines);
                }
            } else {
                const macro = ctx.current.substring(pos.start, pos.end);
                throw makeError(
                    `Macro \"${macro}\" definition had ${
                        def.invoke!.params.length
                    } arguments but was called with ${call.params.length} params`,
                    ctx
                );
            }
        }
    }

    _getCallParser(): CallParser {
        return new CallParser();
    }
}
