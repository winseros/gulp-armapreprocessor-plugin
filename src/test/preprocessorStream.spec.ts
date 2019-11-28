import { PluginError } from 'gulp-util';
import * as path from 'path';
import { Duplex, Readable, Writable } from 'stream';
import File = require('vinyl');
import { PreprocessorCore } from '../core/preprocessorCore';
import { readFile } from '../core/test/util';
import { PreprocessorStorage } from '../preprocessorStorage';
import { PreprocessorStream } from '../preprocessorStream';

describe('preprocessorStream', () => {
    describe('_transform', () => {
        it('should throw in case of streaming input', done => {
            const file = new File({
                base: './src',
                path: path.normalize('/src/file.js'),
                contents: new Duplex()
            });
            spyOn(file, 'isStream').and.returnValue(true);

            const stream = new Readable({ objectMode: true, read: () => 0 });
            stream.pipe(new PreprocessorStream()).on('error', (err: Error) => {
                expect(err instanceof PluginError).toEqual(true);
                expect(err.message).toEqual('Streaming input is not supported');
                done();
            });

            stream.push(file);
        });

        it('should not throw if file has no content', done => {
            const file = new File({ path: './file1.txt' });
            const stream = new Readable({ objectMode: true, read: () => 0 });
            stream.pipe(new PreprocessorStream()).pipe(
                new Writable({
                    objectMode: true,
                    write: (chunk: any, encoding: string, callback: () => void) => {
                        expect(chunk).toBe(file);
                        done();
                    }
                })
            );
            stream.push(file);
        });

        it('should handle the preprocessor result', async () => {
            const text = await readFile('src/test/_data/preprocessorStream/file1.txt');
            const file = new File({
                contents: Buffer.from(text),
                path: path.join(__dirname, '_data/preprocessorStream/file1.txt')
            });

            return new Promise(res => {
                const stream = new Readable({ objectMode: true, read: () => void 0 });
                stream.pipe(new PreprocessorStream()).pipe(
                    new Writable({
                        objectMode: true,
                        write: (processedFile: any) => {
                            const expected =
                                'file2contents1\nfile6contents\nfile2contents2\nfile3contents\nfile5contents\nfile4contents\nfile1contents';
                            expect(processedFile.contents.toString()).toEqual(expected);
                            res();
                        }
                    })
                );

                stream.push(file);
            });
        });

        it('should prefer an explicit dependency to a resolved one', async () => {
            const text = await readFile('src/test/_data/preprocessorStream/file1.txt');
            const file = new File({
                contents: Buffer.from(text),
                path: path.join(__dirname, '_data/preprocessorStream/file1.txt')
            });

            const storage = new PreprocessorStorage();
            const f1 = new File({
                path: 'src/test/_data/preprocessorStream/file2.txt',
                contents: Buffer.from('file2-text')
            });
            const f2 = new File({
                path: 'src/test/_data/preprocessorStream/folder1/file4.txt',
                contents: Buffer.from('file4-text')
            });
            storage.data.push(f1);
            storage.data.push(f2);

            return new Promise(res => {
                const stream = new Readable({ objectMode: true, read: () => void 0 });
                stream.pipe(new PreprocessorStream({ storage })).pipe(
                    new Writable({
                        objectMode: true,
                        write: (processedFile: any) => {
                            const expected = 'file2-text\nfile4-text\nfile1contents';
                            expect(processedFile.contents.toString()).toEqual(expected);
                            res();
                        }
                    })
                );

                stream.push(file);
            });
        });

        it('should handle preprocessor failures', done => {
            const initialData = 'some-initial-text';
            const file = new File({ contents: Buffer.from(initialData), path: 'file-path' });

            const rej = new PluginError('plugin-name', 'some-error-text');
            jest.spyOn(PreprocessorCore.prototype, 'process').mockRejectedValue(rej);

            const stream = new Readable({ objectMode: true, read: () => 0 });
            stream.pipe(new PreprocessorStream()).on('error', err => {
                expect(err).toBe(rej);
                done();
            });

            stream.push(file);
        });

        it('should handle generic failures', done => {
            const initialData = 'some-initial-text';
            const file = new File({ contents: Buffer.from(initialData), path: 'file-path' });

            const errorText = 'some-error-text';
            jest.spyOn(PreprocessorCore.prototype, 'process').mockRejectedValue(new Error(errorText));

            const stream = new Readable({ objectMode: true, read: () => 0 });
            stream.pipe(new PreprocessorStream()).on('error', (err: PluginError) => {
                expect(err).toBeInstanceOf(PluginError);
                expect(err.message).toEqual(errorText);
                expect(err.fileName).toEqual('file-path');
                done();
            });

            stream.push(file);
        });
    });
});
