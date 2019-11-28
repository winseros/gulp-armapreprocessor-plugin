import { promises } from 'fs';
import { join } from 'path';

const opts = { encoding: 'utf-8' };

export const resolveFile = (fn: string) => join(process.cwd(), fn);

export const readFile = async (name: string): Promise<string> => {
    const fn = resolveFile(name);
    const data = (await promises.readFile(fn, opts)) as string;
    return data;
};
