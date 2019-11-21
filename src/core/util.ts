import { PluginError } from 'gulp-util';
import { constants } from '../constants';
import { ProcessContext } from './processContext';

export const makeError = (msg: string, ctx: ProcessContext) =>
    new PluginError({
        plugin: constants.pluginName,
        message: msg,
        fileName: ctx.path,
        lineNumber: ctx.index
    });
