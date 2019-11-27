import { PluginError } from 'gulp-util';
import { constants } from '../constants';
import { ProcessContext } from './processContext';

export const makeError = (msg: string, ctx: ProcessContext) =>
    new PluginError({
        plugin: constants.pluginName,
        message: msg,
        fileName: ctx.path,
        lineNumber: ctx.index + ctx.startLine
    });

export const isInString = (line: string, def: string, pos: number): boolean => {
    let quotes = 0;
    let l = pos - 1;
    while (l >= 0) {
        if (line[l] === '"') {
            quotes++;
        }
        l--;
    }
    return quotes % 2 === 1;
};
