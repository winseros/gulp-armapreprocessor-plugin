import { dirname, relative } from 'path';
import { cwd } from 'process';

export class FileInfo {
    constructor(filePath: string) {
        this.fullPath = filePath;
        this.fullDir = dirname(filePath);
        this.relativePath = relative(cwd(), this.fullPath);
    }

    readonly relativePath: string;
    readonly fullPath: string;
    readonly fullDir: string;

    toString(): string {
        return this.relativePath;
    }
}