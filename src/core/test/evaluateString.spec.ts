import { evaluateString } from '../evaluateString';

describe('core/evaluateString', () => {
    it('should evaluate concatenation operator', () => {
        expect(evaluateString('A##B')).toEqual('AB');
        expect(evaluateString('A##B##C')).toEqual('ABC');
        expect(evaluateString('A####B')).toEqual('AB');
        expect(evaluateString('"A####B"')).toEqual('"A####B"');
        expect(evaluateString('"A####B')).toEqual('"A####B');
        expect(evaluateString('A####B"')).toEqual('AB"');
        expect(evaluateString('"A" A####B "B"')).toEqual('"A" AB "B"');
    });

    it('should evaluate stringify operator', () => {
        expect(evaluateString('#A')).toEqual('"A"');
        expect(evaluateString('#A#B')).toEqual('"A""B"');
        expect(evaluateString('#A #B ')).toEqual('"A" "B" ');
        expect(evaluateString(' #A11#b++#')).toEqual(' "A11""b"++');
        expect(evaluateString('"#A#B"')).toEqual('"#A#B"');
        expect(evaluateString('"#A#B')).toEqual('"#A#B');
        expect(evaluateString('#A#B"')).toEqual('"A""B""');
    });

    it('should evaluate stringify and evaluate operators', () => {
        expect(evaluateString('#A##B')).toEqual('"A"B');
        expect(evaluateString('A###B')).toEqual('A"B"');
        expect(evaluateString('"A###B')).toEqual('"A###B');
        expect(evaluateString('A###B"')).toEqual('A"B""');
        expect(evaluateString('A##B#C')).toEqual('AB"C"');
        expect(evaluateString('aaa#\nA##B#C\naa#')).toEqual('aaa\nAB"C"\naa');
    });
});
