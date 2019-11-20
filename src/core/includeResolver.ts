import * as assert from 'assert';
import {promises} from 'fs';
import {dirname, join} from 'path';

export interface IncludeResolver {
    getContents(includeFile: string, sourceFile: string): Promise<Buffer>;
}

export class FileSystemIncludeResolver implements IncludeResolver {
    async getContents(includeFile: string, sourceFile: string): Promise<Buffer> {
        assert.ok(includeFile, 'includeFile');
        assert.ok(sourceFile, 'sourceFile');

        const absPath = join(dirname(sourceFile), includeFile);
        const contents = await promises.readFile(absPath);
        return contents;
    }
}
