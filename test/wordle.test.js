import { expect } from 'chai';
import { getWordleList, getWordleForDay, getAllWordlesBetweenInclusive, calculateLetterProbabilities, makeNextGuess, updateKnowledgeState, ALL_LETTERS, pruneWords, solveWordle, generateWordleShareable, initialKnowledgeState } from '../src/wordle.js';
import { makeMockServer } from './server.js';

let server = makeMockServer();

beforeEach(() => {
    server = makeMockServer();
    server.listen();
});

afterEach(() => {
    server.close();
});

describe('Wordle tests', () => {
    it('should retrieve at least 100 words including horse', async () => {
        const words = await getWordleList();
        expect(words).to.have.lengthOf.above(100);
        expect(words).to.include('horse');
    });

    it('gets correct wordle for day 2023-03-07', async () => {
        const wordle = await getWordleForDay(new Date('2023-03-07'));
        console.log(wordle)
        expect(wordle.wordle).to.equal('horse');
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
        const guess = makeNextGuess(words, initialKnowledgeState());
        expect(guess).to.equal('crate');
    })

    it('prune words removes impossible words', async () => {
        const words = ['horse', 'house', 'haste', 'hides', 'hopes'];

        const knowledgeState = initialKnowledgeState();
        knowledgeState.correct = { 0: 'h', 1: 'o', 2: 'r', 3: 's', 4: 'e' };
        for (const letter of ALL_LETTERS) {
            if (!letter in knowledgeState) {
                knowledgeState[letter] = [];
            }
        }
        const pruned = pruneWords(words, knowledgeState);
        expect(pruned).to.deep.equal(['horse']);
    })

    it('possible letter locations are updated correctly - horse vs crane', async () => {
        const guess = 'horse';
        const solution = 'crane';
        const knowledgeState = initialKnowledgeState();
        updateKnowledgeState(knowledgeState, guess, solution);
        expect(knowledgeState).to.deep.equal({
            correct: { 4: 'e' },
            known_letters_positions: {
                r: [0, 1, 3, 4],
                e: [0, 1, 2, 3, 4]
            },
            not_in_puzzle: { 'h': true, 'o': true, 's': true },
            guesses: ['horse'],
            available_words: []
        });
    })

    it('simple worldle is solved correctly', async () => {
        const solution = 'hello';
        const availableWords = ['horse', 'house', 'haste', 'hides', 'hopes', 'hello'];
        const { guess, guesses_count } = solveWordle(solution, availableWords);
        expect(guess).to.equal(solution);

    })

    it('solves wordle from 2024-07-26', async () => {
        const words = await getWordleList();
        const wordle = await getWordleForDay(new Date('2024-07-26'));
        console.log("solution: ", wordle)
        const solution = solveWordle(wordle.wordle, words);
        console.log("solved: ", solution)

        console.log(generateWordleShareable(wordle, solution))
        console.log("solution: ", wordle.wordle, "guess: ", solution.guess, "guesses: ", solution.guesses_count)
    })
});

describe('Wordle performance tests', () => {
    it('solve wordles average is below 5', async () => {
        const originalConsoleLog = console.log;
        console.log = () => { };


        let guesses = 0;
        let wordles = 0;
        for (const wordle of await getAllWordlesBetweenInclusive(new Date('2024-06-01'), new Date('2024-06-30'))) {
            const words = await getWordleList();
            const solution = solveWordle(wordle.wordle, words);
            guesses += solution.guesses_count;
            wordles += 1;
        }
        console.log = originalConsoleLog;
        console.log("Average Guesses: ", guesses / wordles)
        expect(guesses / wordles).to.be.below(5);
    }).timeout(10000);
})