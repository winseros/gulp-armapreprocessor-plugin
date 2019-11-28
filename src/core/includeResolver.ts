import * as assert from 'assert';
import { promises } from 'fs';
import { PluginError } from 'gulp-util';
import { dirname, join, sep } from 'path';
import { constants } from '../constants';

export interface IncludeResolver {
    getContents(includeFile: string, sourceFile: string): Promise<Buffer>;
}

const reNormalize = /\\/g;

const normalize = (path: string) => {
    if (!path || sep === '\\') {
        return path;
    }
    return path.replace(reNormalize, sep);
};

export class FileSystemIncludeResolver implements IncludeResolver {
    async getContents(includeFile: string, sourceFile: string): Promise<Buffer> {
        assert.ok(includeFile, 'includeFile');
        assert.ok(sourceFile, 'sourceFile');

        const absPath = join(dirname(join(process.cwd(), sourceFile)), normalize(includeFile));
        try {
            const contents = await promises.readFile(absPath);
            return contents;
        } catch (e) {
            if (e.code === 'ENOENT') {
                throw new PluginError({
                    plugin: constants.pluginName,
                    fileName: sourceFile,
                    message: `Could not find file "${includeFile}" requested by "${sourceFile}" at "${absPath}"`
                });
            } else {
                throw e;
            }
        }
    }
}

export class CacheIncludeResolver implements IncludeResolver {
    private readonly _backend: IncludeResolver;
    private readonly _cwd: string;
    private readonly _cache = new Map<string, Promise<Buffer>>();

    constructor(backend: IncludeResolver, cwd = process.cwd()) {
        assert.ok(backend, 'backend');
        assert.ok(cwd, 'cwd');
        this._backend = backend;
        this._cwd = cwd.endsWith(sep) ? cwd : cwd + sep;
    }

    getContents(includeFile: string, sourceFile: string): Promise<Buffer> {
        const absPath = join(dirname(join(process.cwd(), sourceFile)), normalize(includeFile));
        const relpath = absPath.substr(this._cwd.length);
        if (this._cache.has(relpath)) {
            return this._cache.get(relpath)!;
        } else {
            const data = this._backend.getContents(includeFile, sourceFile);
            return data;
        }
    }

    register(relpath: string, body: Buffer): void {
        assert.ok(relpath, 'relpath');
        assert.ok(body, 'body');
        this._cache.set(relpath, Promise.resolve(body));
    }
}
