import { Preprocessor } from '../preprocessor';
import File = require('vinyl');
import * as fs from 'fs';
import { join } from 'path';

describe('preprocessor', () => {
    describe('preprocess', () => {
        it('should resolve multilevel includes', (done: Function) => {
            const path = join(__dirname, './test_data/preprocessor/file1.txt');
            const contents = fs.readFileSync(path);

            const proc = new Preprocessor();
            proc.preprocess(new File({ path, contents })).then((data: string) => {
                expect(data).toEqual('file2contents1\n\nfile6contents\n\nfile2contents2\nfile3contents\n\nfile5contents\n\nfile4contents\n\nfile1contents');
                done();
            });
        });

        it('should reject if top level include dependency is missing', (done: Function) => {
            const contents = '#include "unexisting_folder/unexisting_file.txt"';

            const proc = new Preprocessor();
            proc.preprocess(new File({
                path: join(__dirname, 'somefile.txt'),
                contents: Buffer.from(contents)
            })).catch((err: string) => {
                const filePath = join('dist', 'test', 'somefile.txt');
                expect(err).toEqual(`${filePath}: could not include the file "unexisting_folder/unexisting_file.txt"`);
                done();
            });
        });

        it('should reject if nested include dependency is missing', (done: Function) => {
            const contents = '#include "folder1/file0.txt"';

            const proc = new Preprocessor();
            proc.preprocess(new File({
                path: join(__dirname, './test_data/preprocessor/somefile.txt'),
                contents: Buffer.from(contents)
            })).catch((err: string) => {
                const filePath = join('dist', 'test', 'test_data', 'preprocessor', 'folder1', 'file0.txt');
                expect(err).toEqual(`${filePath}: could not include the file "not_esisting_file.txt"`);
                done();
            });
        });

        it('should reject in case of preprocessor error', (done: Function) => {
            const contents = '#define error( 123';

            const proc = new Preprocessor();
            proc.preprocess(new File({
                path: join(__dirname, 'file0.txt'),
                contents: Buffer.from(contents)
            })).catch((err: string) => {
                const filePath = join('dist', 'test', 'file0.txt:1');
                expect(err).toEqual(`(cpp) error # ${filePath}: unbalanced parentheses in define: error( 123`);
                done();
            });
        });
    });

    describe('use', () => {
        it('should prefer an explicit dependency to a resolved one', (done: Function) => {
            const path = join(__dirname, './test_data/preprocessor/file1.txt');
            const contents = fs.readFileSync(path);

            const storage = new Map<string, File>();
            const f1 = new File({ path: 'dist/test/test_data/preprocessor/file2.txt', contents: Buffer.from('file2-text') });
            const f2 = new File({ path: 'dist/test/test_data/preprocessor/folder1/file4.txt', contents: Buffer.from('file4-text') });
            storage.set(f1.relative, f1);
            storage.set(f2.relative, f2);

            const proc = new Preprocessor();
            proc.useStorage(storage);

            proc.preprocess(new File({ path, contents })).then((data: string) => {
                expect(data).toEqual('file2-text\nfile4-text\n\nfile1contents');
                done();
            });
        });
    });
});
