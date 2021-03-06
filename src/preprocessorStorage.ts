import { PluginError } from 'gulp-util';
import { Transform } from 'stream';
import * as File from 'vinyl';
import { constants } from './constants';
import { TransformCallback } from './transformCallback';

class AddStream extends Transform {
    private _cache: Map<string, Promise<File>>;

    constructor(cache: Map<string, Promise<File>>) {
        super({ objectMode: true });
        this._cache = cache;
    }

    _transform(file: File, enc: string, cb: TransformCallback): void {
        if (!file.isBuffer()) {
            const err = new PluginError(constants.pluginName, 'Streaming input is not supported', {
                fileName: file.relative
            });
            return cb(err);
        }
        this._cache.set(file.relative, Promise.resolve(file));
        cb(undefined, file);
    }
}

class ClearStream extends Transform {
    private _cache: Map<string, Promise<File>>;

    constructor(cache: Map<string, Promise<File>>) {
        super({ objectMode: true });
        this._cache = cache;
    }

    _transform(file: File, enc: string, cb: TransformCallback): void {
        cb(undefined, file);
    }

    _flush(): void {
        this._cache.clear();
    }
}

export class PreprocessorStorage {
    readonly data = new Map<string, Promise<File>>();
    private _addStream = new AddStream(this.data);
    private _clearStream = new ClearStream(this.data);

    add(): Transform {
        return this._addStream;
    }

    clear(): Transform {
        return this._clearStream;
    }
}
