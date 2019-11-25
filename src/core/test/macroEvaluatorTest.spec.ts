import { MacroEvaluator } from '../macroEvaluator';
import { ProcessContext } from '../processContext';

describe('core/macroEvaluator', () => {
    const expectPass = (input: string, expected: string) => {
        const ctx = new ProcessContext('', [input]);
        ctx.defs.set('MACRO', { value: 'VALUE' });
        new MacroEvaluator().evaluate(ctx);
        expect(ctx.current).toEqual(expected);
    };

    it('should evaluate constant macro', () => {
        expectPass('abc MACRO def', 'abc VALUE def');
        expectPass('abc #MACRO def', 'abc "VALUE" def');
        expectPass('abc##MACRO##def', 'abcVALUEdef');
        expectPass('abc + MACRO-def', 'abc + VALUE-def');
        expectPass('abc*MACRO / def', 'abc*VALUE / def');
        expectPass('MACRO', 'VALUE');
        expectPass('MACRO;', 'VALUE;');
        expectPass('[MACRO]', '[VALUE]');
        expectPass('[MACRO, 1]', '[VALUE, 1]');
        expectPass('[a, MACRO]', '[a, VALUE]');
        expectPass('if (MACRO)', 'if (VALUE)');
        expectPass('if (MACRO && a)', 'if (VALUE && a)');
        expectPass('if (b||MACRO)', 'if (b||VALUE)');
    });

    it('should not evaluate constant inside a string', () => {
        expectPass('abc "MACRO" def', 'abc "MACRO" def');
    });

    it('should evaluate call macro', () => {
        const ctx = new ProcessContext('', ['call M1(1,2,3);']);
        ctx.defs.set('M1', { invoke: {params: ['A', 'B', 'C'], call: () => ''} });
        new MacroEvaluator().evaluate(ctx);
        expect(ctx.current).toEqual('');
    });
});
