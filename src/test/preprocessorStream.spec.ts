import { PreprocessorStream } from '../preprocessorStream';
import { Preprocessor } from '../preprocessor';
import * as path from 'path';
import { Readable, Writable, Duplex } from 'stream';
import { PluginError } from 'gulp-util';
import File = require('vinyl');

describe('preprocessorStream', () => {
    describe('ctor', () => {
        it('should handle no options', () => {
            spyOn(Preprocessor.prototype, 'useStorage');

            new PreprocessorStream();//tslint:disable-line:no-unused-new

            expect(Preprocessor.prototype.useStorage).not.toHaveBeenCalled();
        });

        it('should handle empty options', () => {
            spyOn(Preprocessor.prototype, 'useStorage');

            new PreprocessorStream({});//tslint:disable-line:no-unused-new

            expect(Preprocessor.prototype.useStorage).not.toHaveBeenCalled();
        });

        it('should handle fulfilled options', () => {
            spyOn(Preprocessor.prototype, 'useStorage');

            const data = { prop: 'data' };
            new PreprocessorStream({ storage: { data: data } as any });//tslint:disable-line:no-unused-new

            expect(Preprocessor.prototype.useStorage).toHaveBeenCalledTimes(1);
            expect(Preprocessor.prototype.useStorage).toHaveBeenCalledWith(data);
        });
    });

    describe('_transform', () => {
        it('should throw in case of streaming input', (done: Function) => {
            const file = new File({ base: './src', path: path.normalize('/src/file.js'), contents: new Duplex() });
            spyOn(file, 'isStream').and.returnValue(true);

            const stream = new Readable({ objectMode: true, read: () => 0 });
            stream
                .pipe(new PreprocessorStream())
                .on('error', (err: Error) => {
                    expect(err instanceof PluginError).toEqual(true);
                    expect(err.message).toEqual('Streaming input is not supported');
                    done();
                });

            stream.push(file);
        });

        it('should not throw if file has no content', (done: Function) => {
            const file = new File({ path: './file1.txt' });
            const stream = new Readable({ objectMode: true, read: () => 0 });
            stream.pipe(new PreprocessorStream()).pipe(new Writable({
                objectMode: true,
                write: (chunk: any, encoding: string, callback: Function) => {
                    expect(chunk).toBe(file);
                    done();
                }
            }));
            stream.push(file);
        });

        it('should handle the preprocessor result', (done: Function) => {
            const initialData = 'some-initial-text';
            const file = new File({ contents: Buffer.from(initialData) });

            const preprocessedData = 'some-preprocessed-text';
            spyOn(Preprocessor.prototype, 'preprocess').and.returnValue(Promise.resolve(preprocessedData));

            const stream = new Readable({ objectMode: true, read: () => 0 });
            stream
                .pipe(new PreprocessorStream())
                .pipe(new Writable({
                    objectMode: true,
                    write: (processedFile: any) => {
                        expect(Preprocessor.prototype.preprocess).toHaveBeenCalledTimes(1);
                        expect(Preprocessor.prototype.preprocess).toHaveBeenCalledWith(file);

                        expect(processedFile).toBe(file);
                        expect(processedFile.contents).toEqual(Buffer.from(preprocessedData));
                        done();
                    }
                }));

            stream.push(file);
        });

        it('should handle the preprocessor failures', (done: Function) => {
            const initialData = 'some-initial-text';
            const file = new File({ contents: Buffer.from(initialData), path: 'file-path' });

            const errorText = 'some-error-text';
            spyOn(Preprocessor.prototype, 'preprocess').and.callFake(() => Promise.reject(errorText));

            const stream = new Readable({ objectMode: true, read: () => 0 });
            stream
                .pipe(new PreprocessorStream())
                .on('error', (err: PluginError) => {
                    expect(err instanceof PluginError).toEqual(true);
                    expect(err.message).toEqual(errorText);
                    expect(err.fileName).toEqual('file-path');
                    done();
                });

            stream.push(file);
        });
    });
});
