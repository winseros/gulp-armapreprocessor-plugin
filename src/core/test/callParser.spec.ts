import { Call, CallParser } from '../callParser';
import { ProcessContext } from '../processContext';

describe('callParser', () => {
    const expectPass = (lines: string[], end: number, params: string[]) => {
        const ctx = new ProcessContext('', lines);
        const call = new CallParser().parse(ctx, 0);
        expect(call).toEqual({ end, params } as Call);
    };

    it('should parse call', () => {
        expectPass(['(); a'], 1, []);
        expectPass(['( ); a'], 2, [' ']);
        expectPass(['(A,B,C)a'], 6, ['A', 'B', 'C']);
        expectPass(['(A, B, C) aa'], 8, ['A', ' B', ' C']);
        expectPass(['(A', ',', 'B', ',', 'C', ') a'], 0, ['A\n', '\nB\n', '\nC\n']);
        expectPass(['(A,"B","""C""") a'], 14, ['A', '"B"', '"""C"""']);
        expectPass(['((A && bb || cd), [1], [("a")]) a'], 30, ['(A && bb || cd)', ' [1]', ' [("a")]']);
        expectPass(['(A(1,2),B(2,3),C(4,5))a'], 21, ['A(1,2)', 'B(2,3)', 'C(4,5)']);
    });

    it('should parse macro within end of file', () => {
        expectPass(['(A(1,2),B(2,3),C(4,5'], 20, ['A(1,2)', 'B(2,3)', 'C(4,5']);
    });
});
