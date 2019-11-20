import { stripComments } from '../stripComments';
import { readFile } from './util';

describe('core/stripComments', () => {
    it('should keep text', async () => {
        const source = await readFile('_data/stripComments/samples/0.txt');
        const expected = await readFile('_data/stripComments/expected/0.txt');
        const stripped = stripComments(Buffer.from(source, 'utf-8'));
        expect(stripped.toString('utf-8')).toEqual(expected);
    });

    it('should strip line comments', async () => {
        const source = await readFile('_data/stripComments/samples/1.txt');
        const expected = await readFile('_data/stripComments/expected/1.txt');
        const stripped = stripComments(Buffer.from(source, 'utf-8'));
        expect(stripped.toString('utf-8')).toEqual(expected);
    });

    it('should strip block comments', async () => {
        const source = await readFile('_data/stripComments/samples/2.txt');
        const expected = await readFile('_data/stripComments/expected/2.txt');
        const stripped = stripComments(Buffer.from(source, 'utf-8'));
        expect(stripped.toString('utf-8')).toEqual(expected);
    });
});
