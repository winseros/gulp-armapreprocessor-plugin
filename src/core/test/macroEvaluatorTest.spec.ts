import {MacroEvaluator} from '../macroEvaluator';
import {ProcessContext} from '../processContext';

describe('core/macroEvaluator', () => {
    const expectPassConstant = (input: string, expected: string) => {
        const ctx = new ProcessContext('', [input]);
        ctx.defs.set('MACRO', {body: 'VALUE', callable: false, optimized: false});
        ctx.defs.set('MACRO2', {body: 'VALUE2', callable: false, optimized: false});
        ctx.defs.set('MACRO3', {body: 'MACRO', callable: false, optimized: false});
        ctx.defs.set('MACRO4', {body: 'MACRO5', callable: false, optimized: false});
        ctx.defs.set('MACRO5', {body: 'MACRO4', callable: false, optimized: false});
        new MacroEvaluator().evaluate(ctx);
        expect(ctx.current).toEqual(expected);
    };

    it('should evaluate constant macro', () => {
        expectPassConstant('abc MACRO def', 'abc VALUE def');
        expectPassConstant('abc MACRO MACRO def', 'abc VALUE VALUE def');
        expectPassConstant('abc #MACRO def', 'abc "VALUE" def');
        expectPassConstant('abc##MACRO##def', 'abcVALUEdef');
        expectPassConstant('abc##MACRO##MACRO2##def', 'abcVALUEVALUE2def');
        expectPassConstant('abc + MACRO-def', 'abc + VALUE-def');
        expectPassConstant('abc*MACRO / def', 'abc*VALUE / def');
        expectPassConstant('MACRO', 'VALUE');
        expectPassConstant('MACRO;', 'VALUE;');
        expectPassConstant('[MACRO]', '[VALUE]');
        expectPassConstant('[MACRO, 1]', '[VALUE, 1]');
        expectPassConstant('[a, MACRO]', '[a, VALUE]');
        expectPassConstant('if (MACRO)', 'if (VALUE)');
        expectPassConstant('if (MACRO && a)', 'if (VALUE && a)');
        expectPassConstant('if (b||MACRO)', 'if (b||VALUE)');
        expectPassConstant('if (b||MACRO3)', 'if (b||VALUE)');
        expectPassConstant('MACRO4 MACRO5', 'MACRO4 MACRO5');
    });

    it('should not evaluate constant inside a string', () => {
        expectPassConstant('abc "MACRO" def', 'abc "MACRO" def');
    });

    const expectPassCall = (input: string, expected: string) => {
        const ctx = new ProcessContext('', [input]);
        ctx.defs.set('M1', {params: ['A', 'B', 'C'], callable: true, body: 'A+B+C', optimized: false});
        new MacroEvaluator().evaluate(ctx);
        expect(ctx.current).toEqual(expected);
    };

    it('should evaluate single line call macro', () => {
        expectPassCall('M1(1,2,3)', '1+2+3');
        expectPassCall('M1(1,2,3) M1(2,3,4)', '1+2+3 2+3+4');
        expectPassCall('M1(1, 2, 3)', '1+ 2+ 3');
        expectPassCall('M1(1,A,3)', '1+A+3');
        expectPassCall('M1(1,"A",3)', '1+"A"+3');
        expectPassCall('M1(1,M2(1),3)', '1+M2(1)+3');
        expectPassCall('M1(1,(a && b), (c || d))', '1+(a && b)+ (c || d)');
    });

    it('should evaluate macro parameters', () => {
        const ctx = new ProcessContext('', ['M1(1,M2(X,Y),M3)']);
        ctx.defs.set('M1', {params: ['A', 'B', 'C'], callable: true, body: 'A+B+C', optimized: false});
        ctx.defs.set('M2', {params: ['A', 'B'], callable: true, body: 'x##A##B##x', optimized: false});
        ctx.defs.set('M3', {callable: false, body: 'pM3p', optimized: false});
        new MacroEvaluator().evaluate(ctx);
        expect(ctx.current).toEqual('1+xXYx+pM3p');
    });

    it('should evaluate multi line call macro', () => {
        const ctx = new ProcessContext('', ['call M1(', '1', ',2,', '3', '); 11']);
        ctx.defs.set('M1', {params: ['A', 'B', 'C'], callable: true, body: 'A + B + C', optimized: false});
        new MacroEvaluator().evaluate(ctx);
        expect(ctx.current).toEqual('call \n1\n + 2 + \n3\n; 11');
    });

    it('should evaluate another macro inside macro body', () => {
        const ctx = new ProcessContext('', ['M1(aaa)']);
        ctx.defs.set('M1', {params: ['A'], callable: true, body: 'M2(A)', optimized: false});
        ctx.defs.set('M2', {params: ['A'], callable: true, body: '1##A##1', optimized: false});
        new MacroEvaluator().evaluate(ctx);
        expect(ctx.current).toEqual('1aaa1');
    });

    it('should not evaluate macro with no call signaruee', () => {
        const ctx = new ProcessContext('', ['aa M1 aa M2 aa']);
        ctx.defs.set('M1', {params: ['A'], callable: true, body: 'A', optimized: false});
        ctx.defs.set('M2', {params: ['A'], callable: true, body: 'A', optimized: false});
        new MacroEvaluator().evaluate(ctx);
        expect(ctx.current).toEqual('aa M1 aa M2 aa');
    });

    it('should throw in case of invalid call signature', () => {
        try {
            const ctx = new ProcessContext('', ['M1(1,2)']);
            ctx.defs.set('M1', {params: ['A'], callable: true, body: 'A', optimized: false});
            new MacroEvaluator().evaluate(ctx);
            fail('Should not have reached here')
        } catch (err) {
            expect(err.message).toEqual('Macro "M1" definition had 1 arguments but was called with 2 params');
        }
    });
});
