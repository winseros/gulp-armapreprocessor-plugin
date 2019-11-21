import { PluginError } from 'gulp-util';
import * as File from 'vinyl';
import { FileSystemIncludeResolver } from '../includeResolver';
import { PreprocessorCore } from '../preprocessorCore';
import { readFile, resolveFile } from './util';

describe('core/preprocessorCore', () => {
    const testOnFiles = async (target: string) => {
        const fileName = `_data/preprocessorCore/samples/${target}.txt`;
        const data = await readFile(fileName);
        const file = new File({ path: resolveFile(fileName), contents: Buffer.from(data) });
        const pp = new PreprocessorCore(new FileSystemIncludeResolver());
        await pp.process(file);

        const contents = file.contents.toString();
        const expected = await readFile(`_data/preprocessorCore/expected/${target}.txt`);
        expect(contents).toEqual(expected);
    };

    it('should resolve #include', async () => {
        await testOnFiles('0');
    });

    it('should resolve conditions', async () => {
        await testOnFiles('1');
    });

    it('should clean up comments', async () => {
        await testOnFiles('2');
    });

    const throwOnCommand = async (text: string, message: string, lineNumber: number) => {
        const file = new File({ path: __filename, contents: Buffer.from(text) });
        const pp = new PreprocessorCore(new FileSystemIncludeResolver());
        try {
            await pp.process(file);
            fail();
        } catch (err) {
            expect(err).toBeInstanceOf(PluginError);
            expect(err.message).toEqual(message);
            expect(err.fileName).toEqual(__filename);
            expect(err.lineNumber).toEqual(lineNumber);
        }
    };

    it('should throw on embedded #ifdef', async () => {
        await throwOnCommand('#ifdef AAA\n#ifdef BBB', 'Embedded #ifdef is not supported', 1);
        await throwOnCommand('#ifndef AAA\n#ifdef BBB', 'Embedded #ifdef is not supported', 1);
        await throwOnCommand('#ifdef AAA\nAAA\n#else\n#ifdef BBB', 'Embedded #ifdef is not supported', 3);
        await throwOnCommand('#ifndef AAA\nAAA\n#else\n#ifdef BBB', 'Embedded #ifdef is not supported', 3);
    });

    it('should throw on embedded #ifndef', async () => {
        await throwOnCommand('#ifdef AAA\n#ifndef BBB', 'Embedded #ifdef is not supported', 1);
        await throwOnCommand('#ifndef AAA\n#ifndef BBB', 'Embedded #ifdef is not supported', 1);
        await throwOnCommand('#ifdef AAA\nAAA\n#else\n#ifndef BBB', 'Embedded #ifdef is not supported', 3);
        await throwOnCommand('#ifndef AAA\nAAA\n#else\n#ifndef BBB', 'Embedded #ifdef is not supported', 3);
    });

    it('should throw on misplaced #else', async () => {
        await throwOnCommand('#ifdef AAA\nAAA\n#else\nBBB\n#else\nCCC', 'Misplaced #else directive', 4);
        await throwOnCommand('#ifndef AAA\nAAA\n#else\nBBB\n#else\nCCC', 'Misplaced #else directive', 4);

        await throwOnCommand('#else\nCCC', '#else outside #ifdef / #ifndef block', 0);
    });

    it('should throw on unclosed condition', async () => {
        await throwOnCommand('#ifdef AAA\nAAA', 'Non-closed #ifdef / #ifndef / #else block', 2);
        await throwOnCommand('#ifndef AAA\nAAA', 'Non-closed #ifdef / #ifndef / #else block', 2);
        await throwOnCommand('#ifdef AAA\nAAA\n#else\nBBB', 'Non-closed #ifdef / #ifndef / #else block', 4);
        await throwOnCommand('#ifndef AAA\nAAA\n#else\nBBB', 'Non-closed #ifdef / #ifndef / #else block', 4);
    });

    it('should throw on unknown command', async () => {
        await throwOnCommand('AAA\nBBB\n    #somecommand', 'Unknown preprocessor directive: #somecommand', 2);
        await throwOnCommand('AAA\nBBB\n#some-command ', 'Unknown preprocessor directive: #some-command', 2);
        await throwOnCommand('AAA\nBBB\n#some_command ', 'Unknown preprocessor directive: #some_command', 2);
        await throwOnCommand('AAA\nBBB\n#some$command ', 'Unknown preprocessor directive: #some$command', 2);
    });
});
