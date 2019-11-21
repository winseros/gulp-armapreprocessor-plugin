import { PluginError } from 'gulp-util';
import { IfBlock, ProcessContext } from '../processContext';
import { SignatureParser } from '../signatureParser';

describe('core/signatureParser', () => {
    const expectPass = (text: string, params: string[], length: number) => {
        const sp = new SignatureParser();
        const ctx: ProcessContext = {
            index: 0,
            lines: [text],
            path: '',
            ifblock: IfBlock.None,
            ifmatch: false
        };
        const sig = sp.parse(ctx);
        expect(sig.params).toEqual(params);
        expect(sig.charCount).toEqual(length);
    };

    const expectThrow = (text: string, message: string) => {
        try {
            const sp = new SignatureParser();
            const ctx: ProcessContext = {
                index: 0,
                lines: [text],
                path: '',
                ifblock: IfBlock.None,
                ifmatch: false
            };
            const sig = sp.parse(ctx);
            fail();
        } catch (err) {
            expect(err).toBeInstanceOf(PluginError);
            expect(err.message).toEqual(message);
        }
    };

    it('should parse signature parameters', () => {
        expectPass('(P1,P2,P3) P1 P2 P3', ['P1', 'P2', 'P3'], 10);
        expectPass('( P1 , P2 , P3 ) P1 P2 P3', ['P1', 'P2', 'P3'], 16);
        expectPass('() abcd', [], 2);
        expectPass('(     ) abcd', [], 7);
    });

    it('should fail on missing starting bracket', () => {
        expectThrow('abcd)', 'Macro signature is expected to start with "("');
    });

    it('should fail on missing ending bracket', () => {
        expectThrow('(abcd', 'Macro signature is expected to end with ")"');
    });


    it('should fail on illegal single param name (single param)', () => {
        expectThrow('(ab$cd)', '"ab$cd" is not a valid macro param name');
        expectThrow('(ab cd)', '"ab cd" is not a valid macro param name');
        expectThrow('(  ab cd  )', '"ab cd" is not a valid macro param name');
    });

    it('should fail on illegal single param name (multiple params)', () => {
        expectThrow('(a,,b)', 'Empty macro param name');
        expectThrow('(a,b,)', 'Empty macro param name');
        expectThrow('(a,ab cd,d)', '"ab cd" is not a valid macro param name');
        expectThrow('(a,  $abcd,  b)', '"$abcd" is not a valid macro param name');
    });
});
