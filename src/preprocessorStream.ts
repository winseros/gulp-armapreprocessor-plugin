import { PluginError } from 'gulp-util';
import { Transform } from 'stream';
import File = require('vinyl');
import { constants } from './constants';
import { CacheIncludeResolver, FileSystemIncludeResolver, IncludeResolver } from './core/includeResolver';
import { PreprocessorCore } from './core/preprocessorCore';
import { PreprocessorStorage } from './preprocessorStorage';
import { TransformCallback } from './transformCallback';

export interface PreprocessorStreamOptions {
    storage?: PreprocessorStorage;
}

export class PreprocessorStream extends Transform {
    private readonly _resolver: IncludeResolver;
    private readonly _preprocessor: PreprocessorCore;

    constructor(options?: PreprocessorStreamOptions) {
        super({ objectMode: true });

        const fsResolver = new FileSystemIncludeResolver();
        this._resolver =
            options && options.storage
                ? new CacheIncludeResolver(fsResolver, options.storage.data)
                : fsResolver;
        this._preprocessor = new PreprocessorCore(this._resolver);
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

        const promise = this._preprocessor.process(file);

        promise.catch((ex: Error) => {
            if (ex instanceof PluginError) {
                cb(ex);
            } else {
                cb(
                    new PluginError({
                        plugin: constants.pluginName,
                        message: ex.message,
                        fileName: file.relative,
                        stack: ex.stack
                    })
                );
            }
        });
        promise.then(() => {
            cb(undefined, file);
        });
    }
}
