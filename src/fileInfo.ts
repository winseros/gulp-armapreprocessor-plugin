import { dirname, relative } from 'path';
import { cwd } from 'process';

export class FileInfo {
    readonly relativePath: string;
    readonly fullPath: string;
    readonly fullDir: string;

    constructor(filePath: string) {
        this.fullPath = filePath;
        this.fullDir = dirname(filePath);
        this.relativePath = relative(cwd(), this.fullPath);
    }

    toString(): string {
        return this.relativePath;
    }
}
