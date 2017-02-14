import { PreprocessorStreamOptions, PreprocessorStream } from './preprocessorStream';
import { PreprocessorStorage } from './preprocessorStorage';

const transform: any = (options?: PreprocessorStreamOptions) => {
    return new PreprocessorStream(options);
};
transform.createStorage = () => {
    return new PreprocessorStorage();
};

export = transform;