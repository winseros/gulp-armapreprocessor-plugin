import { create, PreprocessorSettings, IncludeFunc, CallbackFunc } from './cpp';
import { FileInfo } from './fileInfo';
import File = require('vinyl');
import * as fs from 'fs';
import * as path from 'path';

type ResolveFunc = (text: string) => void;
type RejectFunc = (err: string) => void;

export class Preprocessor {
    public static preprocess(file: File): Promise<string> {
        return new Promise((resolve: ResolveFunc, reject: RejectFunc) => {
            const settings = {
                completion_func: (text: string) => resolve(text),
                include_func: Preprocessor._getIncludeFunc(reject)
            } as PreprocessorSettings;

            const pp = create(settings);

            try {
                const data = file.contents.toString();
                pp.run(data, new FileInfo(file.path));
            } catch (ex) {
                reject(ex);
            }
        });
    };

    private static _getIncludeFunc(reject: RejectFunc): IncludeFunc {
        return function include(descriptor: FileInfo, includeName: string, isGlobal: boolean, callback: CallbackFunc): void {
            const filePath = path.join(descriptor.fullDir, includeName);
            fs.readFile(filePath, 'utf8', (err: Error, data: string) => {
                if (err) {
                    const msg = `${descriptor.relativePath}: could not include the file "${includeName}"`;
                    reject(msg);
                    return;
                }

                callback(data, new FileInfo(filePath));
            });
        };
    }
}