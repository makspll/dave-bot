import { Scores } from "@src/types/formatters.js";
import { clone_score, FIRST_CONNECTIONS_DATE, FIRST_WORDLE_DATE, printDateToNYTGameId, stringPad } from "../utils.js";
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
// "connections": printDateToNYTGameId(first_date_this_month, new Date('2023-06-12')),
// "wordle": printDateToNYTGameId(first_date_this_month, new Date('2021-06-19'))
it('first connections puzzle date converts to 1', () => {
    const first_connections_date = new Date('2023-06-12')
    const result = printDateToNYTGameId(FIRST_CONNECTIONS_DATE, FIRST_CONNECTIONS_DATE)

    expect(result).toBe(1)
})

it('first wordle puzzle date converts to 0', () => {
    const first_wordle_date = new Date('2021-06-19')
    const result = printDateToNYTGameId(FIRST_WORDLE_DATE, FIRST_WORDLE_DATE, true)

    expect(result).toBe(0)
})

it('clones scores', () => {
    const scores: Scores = new Map([[1023, new Map([[1, 2]])]])
    const cloned = clone_score(scores)
    expect(cloned).toEqual(scores)
    expect(cloned.get(1023).get(1)).toEqual(2)
})