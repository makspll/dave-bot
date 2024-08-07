import { stringPad } from "../utils.js";
import stringWidth from "string-width";


it('stringPad should pad the string with specified character', () => {
    const input = 'hello';
    const expectedOutput = 'hello***'; // pad with 3 asterisks

    const result = stringPad(input, input.length + 3, '*');

    expect(result).toBe(expectedOutput);
});

it('stringPad should pad the string with specified character and align right', () => {
    const input = 'hello';
    const expectedOutput = '***hello'; // pad with 3 asterisks

    const result = stringPad(input, input.length + 3, '*', 'right');

    expect(result).toBe(expectedOutput);
});

it('stringPad should pad the string with specified character and align center', () => {
    const input = 'hello';
    const expectedOutput = '*hello**'; // pad with 3 asterisks

    const result = stringPad(input, input.length + 3, '*', 'center');

    expect(result).toBe(expectedOutput);
});

it('various padded emojis and letters pad to the same string width', () => {
    const input1 = '🥇🥈🥉🏅 🎖️'
    const input2 = 'abcde✨ 0'
    const input3 = '🔻🔺d✨🔴a'

    expect(stringWidth(stringPad(input1, 15, '*'))).toBe(stringWidth(stringPad(input2, 15, '*')))
    expect(stringWidth(stringPad(input2, 15, '*'))).toBe(stringWidth(stringPad(input3, 15, '*')))

})