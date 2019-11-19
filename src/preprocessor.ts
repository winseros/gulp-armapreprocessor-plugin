import * as fs from 'fs';
import * as path from 'path';
import File = require('vinyl');
import { CallbackFunc, create, IncludeFunc, PreprocessorSettings } from './cpp';
import { FileInfo } from './fileInfo';

type ResolveFunc = (text: string) => void;
type RejectFunc = (err: string) => void;

export class Preprocessor {
    private _storage: Map<string, File>;

    preprocess(file: File): Promise<string> {
        return new Promise((resolve: ResolveFunc, reject: RejectFunc) => {
            const settings = {
                completion_func: (text: string) => resolve(text),
                include_func: this._getIncludeFunc(reject)
            } as PreprocessorSettings;

            const pp = create(settings);

            try {
                const data = file.contents!.toString();
                pp.run(data, new FileInfo(file.path));
            } catch (ex) {
                reject(ex);
            }
        });
    }

    useStorage(storage: Map<string, File>): void {
        this._storage = storage;
    }

    private _getIncludeFunc(reject: RejectFunc): IncludeFunc {
        return (
            descriptor: FileInfo,
            includeName: string,
            isGlobal: boolean,
            callback: CallbackFunc
        ): void => {
            const filePath = path.join(descriptor.fullDir, includeName).replace('\\', '/');
            const fileInfo = new FileInfo(filePath);

            const cached = this._storage && this._storage.get(fileInfo.relativePath);
            if (cached) {
                const buf = cached.contents as Buffer;
                const str = buf.toString();
                return callback(str, fileInfo);
            }

            fs.readFile(filePath, 'utf8', (err: Error | null, data: string) => {
                if (err) {
                    const msg = `${descriptor.relativePath}: could not include the file "${includeName}"`;
                    reject(msg);
                    return;
                }

                callback(data, fileInfo);
            });
        };
    }
}
