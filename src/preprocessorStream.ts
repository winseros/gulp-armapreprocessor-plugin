import { PluginError } from 'gulp-util';
import { Transform } from 'stream';
import File = require('vinyl');
import { constants } from './constants';
import { Preprocessor } from './preprocessor';
import { PreprocessorStorage } from './preprocessorStorage';
import { TransformCallback } from './transformCallback';

export interface PreprocessorStreamOptions {
    storage?: PreprocessorStorage;
}

export class PreprocessorStream extends Transform {
    private _preprocessor = new Preprocessor();

    constructor(options?: PreprocessorStreamOptions) {
        super({ objectMode: true });
        this._useOptions(options);
    }

    _transform(file: File, enc: string, cb: TransformCallback): void {
        if (file.isNull()) {
            return cb(undefined, file);
        }

        if (!file.isBuffer()) {
            const err = new PluginError(constants.pluginName, 'Streaming input is not supported', {
                fileName: file.relative
            });
            return cb(err);
        }

        const promise = this._preprocessor.preprocess(file);

        promise.catch((msg: string) => {
            cb(new PluginError(constants.pluginName, msg, { fileName: file.relative }));
        });
        promise.then((text: string) => {
            file.contents = Buffer.from(text);
            cb(undefined, file);
        });
    }

    _useOptions(options?: PreprocessorStreamOptions): void {
        if (options && options.storage) {
            this._preprocessor.useStorage(options.storage.data);
        }
    }
}
