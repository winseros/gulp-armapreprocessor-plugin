import { PreprocessorStorage } from '../preprocessorStorage';
import { Readable } from 'stream';
import * as File from 'vinyl';
import { PluginError } from 'gulp-util';

describe('preprocessorStorage', () => {
    describe('add', () => {
        it('should throw in case of streaming input', (done: Function) => {
            const f1 = new File({ path: 'folder/file1.txt' });
            const stream = new Readable({ objectMode: true, read: () => 0 });
            stream.pipe(new PreprocessorStorage().add())
                .on('error', (err: PluginError) => {
                    expect(err instanceof PluginError).toEqual(true);
                    expect(err.message).toEqual('Streaming input is not supported');
                    done();
                });
            stream.push(f1);
        });

        it('should pipe a file to storage', (done: Function) => {
            spyOn(Map.prototype, 'set');

            const f1 = new File({ path: 'folder/file1.txt', contents: Buffer.allocUnsafe(0) });
            const f2 = new File({ path: 'folder/file2.txt', contents: Buffer.allocUnsafe(0) });

            const storage = new PreprocessorStorage();

            const stream = new Readable({ objectMode: true, read: () => 0 });
            stream.pipe(storage.add()).on('finish', () => {
                expect(Map.prototype.set).toHaveBeenCalledTimes(2);
                expect(Map.prototype.set).toHaveBeenCalledWith(f1.relative, f1);
                expect(Map.prototype.set).toHaveBeenCalledWith(f2.relative, f2);
                done();
            });

            stream.push(f1);
            stream.push(f2);
            stream.push(null);
        });
    });

    describe('clear', () => {
        it('should clear the storage', (done: Function) => {
            spyOn(Map.prototype, 'clear');

            const f1 = new File({ path: 'folder/file1.txt', contents: Buffer.allocUnsafe(0) });
            const f2 = new File({ path: 'folder/file2.txt', contents: Buffer.allocUnsafe(0) });

            const storage = new PreprocessorStorage();

            const stream = new Readable({ objectMode: true, read: () => 0 });
            stream.pipe(storage.clear()).on('finish', () => {
                expect(Map.prototype.clear).toHaveBeenCalledTimes(1);
                done();
            });

            stream.push(f1);
            stream.push(f2);
            stream.push(null);
        });
    });
});