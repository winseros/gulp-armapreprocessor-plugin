import { PluginError } from 'gulp-util';
import { Transform } from 'stream';
import * as File from 'vinyl';
import { constants } from './constants';
import { TransformCallback } from './transformCallback';

class AddStream extends Transform {
    private _cache: File[];

    constructor(cache: File[]) {
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
        this._cache.push(file);
        cb(undefined, file);
    }
}

class ClearStream extends Transform {
    private _cache: File[];

    constructor(cache: File[]) {
        super({ objectMode: true });
        this._cache = cache;
    }

    _transform(file: File, enc: string, cb: TransformCallback): void {
        cb(undefined, file);
    }

    _flush(): void {
        this._cache.splice(0);
    }
}

export class PreprocessorStorage {
    readonly data: File[] = [];
    private _addStream = new AddStream(this.data);
    private _clearStream = new ClearStream(this.data);

    add(): Transform {
        return this._addStream;
    }

    clear(): Transform {
        return this._clearStream;
    }
}
