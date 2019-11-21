import { DefinitionCollection } from '../definitionCollection';

describe('core/definitionCollection', () => {
    it('should return false if something is not defined', () => {
        const cl = new DefinitionCollection();
        expect(cl.defined('is-not-defined')).toEqual(false);
    });

    it('should add a new definition', () => {
        const cl = new DefinitionCollection();
        cl.define('some-definition', { lineCount: 1 });

        expect(cl.defined('some-definition')).toEqual(true);
    });

    it('should undefine a definition', () => {
        const cl = new DefinitionCollection();
        cl.define('some-definition', { lineCount: 1 });
        cl.undef('some-definition');

        expect(cl.defined('some-definition')).toEqual(false);
    });

    it('should not throw trying to undef something not defined', () => {
        const cl = new DefinitionCollection();
        cl.undef('some-definition');
    });
});
