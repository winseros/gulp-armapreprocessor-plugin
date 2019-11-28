import { PreprocessorStorage } from './preprocessorStorage';
import { PreprocessorStream, PreprocessorStreamOptions } from './preprocessorStream';

const transform: any = (options?: PreprocessorStreamOptions) => {
    return new PreprocessorStream(options);
};
transform.createStorage = () => {
    return new PreprocessorStorage();
};

export = transform;
