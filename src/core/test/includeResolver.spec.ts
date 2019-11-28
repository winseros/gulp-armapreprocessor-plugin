import { PluginError } from 'gulp-util';
import * as path from 'path';
import { CacheIncludeResolver, FileSystemIncludeResolver, IncludeResolver } from '../includeResolver';

describe('core/includeResolver', () => {
    describe('FileSystemIncludeResolver', () => {
        it('should resolve files from filesystem 1', async () => {
            const res = new FileSystemIncludeResolver();
            const file = path.join('src', 'core', 'test', '_data', 'includeResolver', '1.sqf');
            const buf = await res.getContents('data.txt', file);
            expect(buf.toString()).toEqual('some data');
        });

        it('should resolve files from filesystem 2', async () => {
            const res = new FileSystemIncludeResolver();
            const file = path.join('src', 'core', 'test', '_data', '1.sqf');
            const buf = await res.getContents('includeResolver\\data.txt', file);
            expect(buf.toString()).toEqual('some data');
        });

        it('should resolve files from filesystem 3', async () => {
            const res = new FileSystemIncludeResolver();
            const file = path.join('src', 'core', 'test', '_data', 'includeResolver', 'f1', 'f2', '1.sqf');
            const buf = await res.getContents('..\\..\\data.txt', file);
            expect(buf.toString()).toEqual('some data');
        });

        it('should throw if file has not been found', async () => {
            const file = path.join('src', 'core', 'test', '_data', 'includeResolver', '1.sqf');
            try {
                const res = new FileSystemIncludeResolver();
                await res.getContents('not-existing.txt', file);
                fail('Should not have reached this line');
            } catch (e) {
                expect(e).toBeInstanceOf(PluginError);
                const absPath = path.join(process.cwd(), path.dirname(file), 'not-existing.txt');
                expect(e.message).toEqual(
                    `Could not find file "not-existing.txt" requested by "${file}" at "${absPath}"`
                );
            }
        });
    });

    describe('CacheIncludeResolver', () => {
        it('should return cached data', async () => {
            const back: IncludeResolver = { getContents: jest.fn() };
            const res = new CacheIncludeResolver(back);

            const buf = Buffer.from('some data');
            res.register('1.txt', buf);

            const contents = await res.getContents('1.txt', '2.txt');

            expect(contents).toBe(buf);

            expect(back.getContents).toHaveBeenCalledTimes(0);
        });

        it('should resolve cached file paths', async () => {
            const back: IncludeResolver = { getContents: jest.fn() };
            const res = new CacheIncludeResolver(back);

            const buf = Buffer.from('some data');
            res.register('1.txt', buf);

            const contents = await res.getContents('../../1.txt', 'f1/f2/2.txt');

            expect(contents).toBe(buf);

            expect(back.getContents).toHaveBeenCalledTimes(0);
        });

        it('should call the backend if no cached data data', async () => {
            const buf = Buffer.from('some data');
            const back: IncludeResolver = { getContents: jest.fn().mockResolvedValue(buf) };
            const res = new CacheIncludeResolver(back);

            const contents = await res.getContents('1.txt', '2.txt');

            expect(contents).toBe(buf);

            expect(back.getContents).toHaveBeenCalledTimes(1);
            expect(back.getContents).toHaveBeenCalledWith('1.txt', '2.txt');
        });
    });
});
