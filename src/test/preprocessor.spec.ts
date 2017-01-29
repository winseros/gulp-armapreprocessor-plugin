import { Preprocessor } from '../preprocessor';
import File = require('vinyl');
import * as fs from 'fs';
import { join } from 'path';

describe('preprocessor', () => {
    describe('preprocess', () => {
        it('should resolve multilevel includes', (done: Function) => {
            const path = join(__dirname, './test_data/preprocessor/file1.txt');
            const contents = fs.readFileSync(path);
            Preprocessor.preprocess(new File({ path, contents })).then((data: string) => {
                expect(data).toEqual('file2contents1\n\nfile6contents\n\nfile2contents2\nfile3contents\n\nfile5contents\n\nfile4contents\n\nfile1contents');
                done();
            });
        });

        it('should reject if top level include dependency is missing', (done: Function) => {
            const contents = '#include "unexisting_folder/unexisting_file.txt"';
            Preprocessor.preprocess(new File({
                path: join(__dirname, 'somefile.txt'),
                contents: Buffer.from(contents)
            })).catch((err: string) => {
                expect(err).toEqual('dist\\test\\somefile.txt: could not include the file "unexisting_folder/unexisting_file.txt"');
                done();
            });
        });

        it('should reject if nested include dependency is missing', (done: Function) => {
            const contents = '#include "folder1/file0.txt"';
            Preprocessor.preprocess(new File({
                path: join(__dirname, './test_data/preprocessor/somefile.txt'),
                contents: Buffer.from(contents)
            })).catch((err: string) => {
                expect(err).toEqual('dist\\test\\test_data\\preprocessor\\folder1\\file0.txt: could not include the file "not_esisting_file.txt"');
                done();
            });
        });

        it('should reject in case of preprocessor error', (done: Function) => {
            const contents = '#define error( 123';
            Preprocessor.preprocess(new File({
                path: join(__dirname, 'file0.txt'),
                contents: Buffer.from(contents)
            })).catch((err: string) => {
                expect(err).toEqual('(cpp) error # dist\\test\\file0.txt:1: unbalanced parentheses in define: error( 123');
                done();
            });
        });
    });
});
