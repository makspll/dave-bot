import { expect } from 'chai';
import { getWordleList, getWordleForDay, getAllWordlesBetweenInclusive, calculateLetterProbabilities, makeNextGuess, updateLocations, ALL_LETTERS, pruneWords, solveWordle } from '../src/wordle.js';

describe('Wordle tests', () => {
    it('should retrieve at least 100 words including horse', async () => {
        const words = await getWordleList();
        expect(words).to.have.lengthOf.above(100);
        expect(words).to.include('horse');
    });

    it('gets correct wordle for day 2023-03-07', async () => {
        const wordle = await getWordleForDay(new Date('2023-03-07'));
        console.log(wordle)
        expect(wordle).to.equal('horse');
    });

    it('gets correct letter probabilities', async () => {
        const words = ['horse', 'house', 'haste', 'hides', 'hopes'];
        const probabilities = calculateLetterProbabilities(words);
        // all existing letters should have a probability dependent on their frequency across words at the given positions
        // all frequencies should sum to 1 across all positions
        expect(probabilities['h']).to.deep.equal([1, 0, 0, 0, 0]);
        expect(probabilities['o']).to.deep.equal([0, 3 / 5, 0, 0, 0]);
        expect(probabilities['s']).to.deep.equal([0, 0, 1 / 5, 2 / 5, 2 / 5]);
        expect(probabilities['e']).to.deep.equal([0, 0, 0, 2 / 5, 3 / 5]);
        expect(probabilities['r']).to.deep.equal([0, 0, 1 / 5, 0, 0]);
        expect(probabilities['t']).to.deep.equal([0, 0, 0, 1 / 5, 0]);
        expect(probabilities['i']).to.deep.equal([0, 1 / 5, 0, 0, 0]);
        expect(probabilities['d']).to.deep.equal([0, 0, 1 / 5, 0, 0]);
        expect(probabilities['p']).to.deep.equal([0, 0, 1 / 5, 0, 0]);
        expect(probabilities['u']).to.deep.equal([0, 0, 1 / 5, 0, 0]);
        expect(probabilities['a']).to.deep.equal([0, 1 / 5, 0, 0, 0]);
        expect(Object.keys(probabilities)).to.have.lengthOf(26);


    })

    it('all non-existing letters should have a probability of 0', async () => {
        const words = ['horse', 'house', 'haste', 'hides', 'hopes'];
        const probabilities = calculateLetterProbabilities(words);
        for (const letter of ALL_LETTERS) {
            if (!words.some(word => word.includes(letter))) {
                expect(probabilities[letter]).to.deep.equal([0, 0, 0, 0, 0]);
            }
        }
    });

    it('all letter probabilities should sum to 1 for each position', async () => {
        const words = ['horse', 'house', 'haste', 'hides', 'hopes'];
        const probabilities = calculateLetterProbabilities(words);

        for (const index of [0, 1, 2, 3, 4]) {
            let sum = 0;
            for (const letter of ALL_LETTERS) {
                sum += probabilities[letter][index];
            }
            expect(sum).to.be.closeTo(1, 0.0001);
        }
    })

    it('next best guess is sensible', async () => {
        // most likely is 'crate' since most words start with cra and end with e, and slightly more have a t just before
        // this guess eliminates a lot of words
        const words = ['crane', 'crate', 'crabs', 'crack', 'horse', 'plate'];
        const guess = makeNextGuess(words);
        expect(guess).to.equal('crate');
    })

    it('prune words removes impossible words', async () => {
        const words = ['horse', 'house', 'haste', 'hides', 'hopes'];
        const locations = { 'h': [0], 'o': [1], 'r': [2], 's': [3], 'e': [4] };
        for (const letter of ALL_LETTERS) {
            if (!locations.hasOwnProperty(letter)) {
                locations[letter] = [];
            }
        }
        const pruned = pruneWords(words, locations);
        expect(pruned).to.deep.equal(['horse']);
    })

    it('possible letter locations are updated correctly - horse vs crane', async () => {
        const guess = 'horse';
        const solution = 'crane';
        const locations = {};
        for (const letter of ALL_LETTERS) {
            locations[letter] = [0, 1, 2, 3, 4];
        }
        updateLocations(locations, guess, solution);
        expect(locations['h'], 'h').to.deep.equal([]);
        expect(locations['o'], 'o').to.deep.equal([]);
        expect(locations['r'], 'r').to.have.members([0, 1, 3, 4]);
        expect(locations['s'], 's').to.deep.equal([]);
        expect(locations['e'], 'e').to.deep.equal([4]);

        // rest should be unchanged
        for (const letter of ALL_LETTERS) {
            if (!['h', 'o', 'r', 's', 'e'].includes(letter)) {
                expect(locations[letter], letter).to.have.members([0, 1, 2, 3, 4]);
            }
        }
    })

    it('simple worldle is solved correctly', async () => {
        const solution = 'hello';
        const availableWords = ['horse', 'house', 'haste', 'hides', 'hopes', 'hello'];
        const { guess, guesses_count } = solveWordle(solution, availableWords);
        expect(guesses_count).to.be.lessThan(6);
        expect(guess).to.equal(solution);
    })

    it('solves todays wordle', async () => {
        const words = await getWordleList();
        console.log("words: ", words)
        const wordle = await getWordleForDay(new Date());
        console.log("solution: ", wordle)
        const solution = solveWordle(wordle, words);
        console.log("solved: ", solution)

        console.log("solution: ", wordle, "guess: ", solution.guess, "guesses: ", solution.guesses_count)
    })
});
