import { expect } from "chai";
import { stringPad } from "../src/utils.js";

it('stringPad should pad the string with specified character', () => {
    const input = 'hello';
    const expectedOutput = 'hello***'; // pad with 3 asterisks

    const result = stringPad(input, input.length + 3, '*');

    expect(result).to.equal(expectedOutput);
});

it('stringPad should pad the string with specified character and align right', () => {
    const input = 'hello';
    const expectedOutput = '***hello'; // pad with 3 asterisks

    const result = stringPad(input, input.length + 3, '*', 'right');

    expect(result).to.equal(expectedOutput);
});

it('stringPad should pad the string with specified character and align center', () => {
    const input = 'hello';
    const expectedOutput = '*hello**'; // pad with 3 asterisks

    const result = stringPad(input, input.length + 3, '*', 'center');

    expect(result).to.equal(expectedOutput);
});
