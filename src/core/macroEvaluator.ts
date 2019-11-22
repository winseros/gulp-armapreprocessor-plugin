import { Definition } from './definitionParser';
import { ProcessContext } from './processContext';
import { makeError } from './util';

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
                    this._evalExpression(ctx, impl, pos);
                }
            }
        }
    }

    _findDefinition(line: string, def: string): DefinitionPos {
        const start = line.indexOf(def);
        return start >= 0 && this._isOperand(line, def, start)
            ? { start, end: start + def.length }
            : { start: 0, end: 0 };
    }

    _isOperand(line: string, def: string, index: number): boolean {
        const left = index === 0 || MacroEvaluator._operandSeparators.indexOf(line[index - 1]) >= 0;
        if (left) {
            const right =
                index + def.length === line.length ||
                MacroEvaluator._operandSeparators.indexOf(line[index + def.length]) >= 0;
            return right;
        }
        return false;
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

    _evalExpression(ctx: ProcessContext, def: Definition, pos: DefinitionPos): void {}
}
