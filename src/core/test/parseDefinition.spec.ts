import { Definition } from '../definition';
import { parseDefinition } from '../parseDefinition';
import { ProcessContext } from '../processContext';

describe('core/parseDefinition', () => {
    it('should parse an empty definition', () => {
        const ctx = new ProcessContext('', ['']);
        const def = parseDefinition(ctx);
        expect(def).toEqual({ body: '', callable: false, optimized: true } as Definition);
    });

    const expectPass = (lines: string[], expected: Definition, index: number) => {
        const ctx = new ProcessContext('', lines);
        const def = parseDefinition(ctx);
        expect(def).toEqual(expected);
        expect(ctx.index).toEqual(index);
    };

    it('should parse a static definition', () => {
        expectPass(['V1'], { body: 'V1', callable: false, optimized: false }, 1);
        expectPass(['     V1'], { body: 'V1', callable: false, optimized: false }, 1);
        expectPass(['\tV1'], { body: '\tV1', callable: false, optimized: false }, 1);
        expectPass(['V1', 'blablabla'], { body: 'V1', callable: false, optimized: false }, 1);
        expectPass(['V1 \\ aa', ' V2'], { body: 'V1 \n V2', callable: false, optimized: false }, 2);
        expectPass(['     V1 \\', ' V2'], { body: 'V1 \n V2', callable: false, optimized: false }, 2);
        expectPass(['\tV1 \\ ', 'V2'], { body: '\tV1 \nV2', callable: false, optimized: false }, 2);
        expectPass(['V1 \\', 'V2', 'blablabla'], { body: 'V1 \nV2', callable: false, optimized: false }, 2);
        expectPass([' (A,B,C)'], { body: '(A,B,C)', callable: false, optimized: false }, 1);
        expectPass(
            ['"\\A3\\ui_f\\data\\img\\some_img.paa"'],
            { body: '"\\A3\\ui_f\\data\\img\\some_img.paa"', callable: false, optimized: false },
            1
        );
        expectPass(
            ['" aa ""some text inside macro""  aa "'],
            { body: '" aa ""some text inside macro""  aa "', callable: false, optimized: false },
            1
        );
    });

    it('should parse a callable definition', () => {
        expectPass(['(A) 1##A##1'], { params: ['A'], body: '1##A##1', callable: true, optimized: false }, 1);
        expectPass(
            ['(A,B)\t1##A##B##1'],
            { params: ['A', 'B'], body: '\t1##A##B##1', callable: true, optimized: false },
            1
        );
        expectPass(
            ['(A,B)\t1##A\\', 'B##1', 'blablabla'],
            { params: ['A', 'B'], body: '\t1##A\nB##1', callable: true, optimized: false },
            2
        );
    });
});
