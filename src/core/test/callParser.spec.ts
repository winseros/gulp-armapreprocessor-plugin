import { PluginError } from 'gulp-util';
import { Call, CallParser } from '../callParser';
import { ProcessContext } from '../processContext';

describe('callParser', () => {
    const expectPass = (lines: string[], end: number, params: string[]) => {
        const ctx = new ProcessContext('', lines);
        const call = new CallParser().parse(ctx, 0);
        expect(call).toEqual({ end, params } as Call);
    };

    it('should return undefined', () => {
        const ctx = new ProcessContext('', ['not a call']);
        const call = new CallParser().parse(ctx, 0);
        expect(call).toBeUndefined();
    });

    it('should parse call', () => {
        expectPass(['(); a'], 1, []);
        expectPass(['( ); a'], 2, [' ']);
        expectPass(['(A,B,C)a'], 6, ['A', 'B', 'C']);
        expectPass(['(A, B, C) aa'], 8, ['A', ' B', ' C']);
        expectPass(['(A', ',', 'B', ',', 'C', ') a'], 0, ['A\n', '\nB\n', '\nC\n']);
        expectPass(['(A,"B","""C""") a'], 14, ['A', '"B"', '"""C"""']);
        expectPass(['((A && bb || cd), [1], [("a")]) a'], 30, ['(A && bb || cd)', ' [1]', ' [("a")]']);
        expectPass(['(A(1,2),B(2,3),C(4,5))a'], 21, ['A(1,2)', 'B(2,3)', 'C(4,5)']);
        expectPass(['([1,2],[3,4],[5,6])'], 18, ['[1,2]', '[3,4]', '[5,6]']);
        expectPass(['({1,2},{3,4},{5,6})'], 18, ['{1,2}', '{3,4}', '{5,6}']);
    });

    it('should parse macro within end of file', () => {
        expectPass(['(A(1,2),B(2,3),C(4,5'], 20, ['A(1,2)', 'B(2,3)', 'C(4,5']);
    });

    const expectThrow = (lines: string[], message: string) => {
        const ctx = new ProcessContext('', lines);
        try {
            new CallParser().parse(ctx, 0);
            fail('Should have not reached this line');
        } catch (ex) {
            expect(ex).toBeInstanceOf(PluginError);
            expect(ex.message).toEqual(message)
        }
    };

    it('should throw on brackets unpaired', () => {
        expectThrow(['([)'], 'Expected "]" parenthesis at macro call but got ")"');
        expectThrow(['([{])'], 'Expected "}" parenthesis at macro call but got "]"');
        expectThrow(['([}])'], 'Expected "]" parenthesis at macro call but got "}"');
        expectThrow(['(]'], 'Unexpected "]" parenthesis at macro call');
    });
});
