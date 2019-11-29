import { PluginError } from 'gulp-util';
import { Readable } from 'stream';
import * as File from 'vinyl';
import { PreprocessorStorage } from '../preprocessorStorage';

describe('preprocessorStorage', () => {
    describe('add', () => {
        it('should throw in case of streaming input', done => {
            const f1 = new File({ path: 'folder/file1.txt' });
            const stream = new Readable({ objectMode: true, read: () => 0 });
            stream.pipe(new PreprocessorStorage().add()).on('error', err => {
                expect(err).toBeInstanceOf(PluginError);
                expect(err.message).toEqual('Streaming input is not supported');
                done();
            });
            stream.push(f1);
        });

        it('should pipe a file to storage', done => {
            const f1 = new File({ path: 'folder/file1.txt', contents: Buffer.allocUnsafe(0) });
            const f2 = new File({ path: 'folder/file2.txt', contents: Buffer.allocUnsafe(0) });

            const storage = new PreprocessorStorage();

            const stream = new Readable({ objectMode: true, read: () => 0 });
            stream.pipe(storage.add()).on('finish', () => {
                expect(storage.data.has(f1.relative)).toBeTruthy();
                expect(storage.data.has(f2.relative)).toBeTruthy();
                done();
            });

            stream.push(f1);
            stream.push(f2);
            stream.push(null);
        });
    });

    describe('clear', () => {
        it('should clear the storage', done => {
            const f1 = new File({ path: 'folder/file1.txt', contents: Buffer.allocUnsafe(0) });
            const f2 = new File({ path: 'folder/file2.txt', contents: Buffer.allocUnsafe(0) });

            const storage = new PreprocessorStorage();
            storage.data.set(f1.relative, Promise.resolve(f1));
            storage.data.set(f2.relative, Promise.resolve(f2));

            const stream = new Readable({ objectMode: true, read: () => 0 });
            stream.pipe(storage.clear()).on('finish', () => {
                expect(storage.data.has(f1.relative)).toBeFalsy();
                expect(storage.data.has(f2.relative)).toBeFalsy();
                done();
            });

            stream.push(f1);
            stream.push(f2);
            stream.push(null);
        });
    });
});
