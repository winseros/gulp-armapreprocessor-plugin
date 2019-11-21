import {Definition} from './definitionParser';

export class DefinitionCollection {
    private readonly _defs = new Map<string, Definition>();

    define(definition: string, implementation: Definition): void {
        this._defs.set(definition, implementation);
    }

    undef(definition: string): void {
        this._defs.delete(definition);
    }

    defined(definition: string): boolean {
        return this._defs.has(definition);
    }
}
