import { constants } from './constants';
import { PluginError } from 'gulp-util';
import { Transform } from 'stream';
import File = require('vinyl');
import { Preprocessor } from './preprocessor';

export type TransformCallback = (err?: Error, file?: File) => void;

export class PreprocessorStream extends Transform {
    constructor() {
        super({ objectMode: true });
    }

    _transform(file: File, encoding: string, callback: TransformCallback): void {
        if (file.isStream()) {
            callback(new PluginError(constants.pluginName, 'Streaming input is not supported', { fileName: file.relative }));
            return;
        }

        Preprocessor.preprocess(file).then((text: string) => {
            file.contents = Buffer.from(text);
            callback(undefined, file);
        }).catch((msg: string) => {
            callback(new PluginError(constants.pluginName, msg, { fileName: file.relative }));
        });
    }
}