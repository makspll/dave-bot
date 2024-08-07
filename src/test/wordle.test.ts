import { getWordleList, getWordleForDay, getAllWordlesBetweenInclusive, calculateLetterProbabilities, makeNextGuess, updateKnowledgeState, ALL_LETTERS, pruneWords, solveWordle, generateWordleShareable, initialKnowledgeState, getHistoricWordleStats, WordleWord, WordleIndices } from '../wordle.js';
import { makeMockServer } from '../server.js';

const TEST_TIMEOUT_SECONDS = 120;
jest.setTimeout(70 * TEST_TIMEOUT_SECONDS)

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
        expect(words.length).toBeGreaterThan(100);
        expect(words).toContain('horse');
    });

    it('gets correct wordle for day 2023-03-07', async () => {
        const wordle = await getWordleForDay(new Date('2023-03-07'));
        console.log(wordle)
        expect(wordle!.wordle).toBe('horse');
    });

    it('gets correct letter probabilities', async () => {
        const words = ['horse', 'house', 'haste', 'hides', 'hopes'] as WordleWord[];
        const probabilities = calculateLetterProbabilities(words);
        // all existing letters should have a probability dependent on their frequency across words at the given positions
        // all frequencies should sum to 1 across all positions

        expect(probabilities['h']).toStrictEqual([1, 0, 0, 0, 0]);
        expect(probabilities['o']).toStrictEqual([0, 3 / 5, 0, 0, 0]);
        expect(probabilities['s']).toStrictEqual([0, 0, 1 / 5, 2 / 5, 2 / 5]);
        expect(probabilities['e']).toStrictEqual([0, 0, 0, 2 / 5, 3 / 5]);
        expect(probabilities['r']).toStrictEqual([0, 0, 1 / 5, 0, 0]);
        expect(probabilities['t']).toStrictEqual([0, 0, 0, 1 / 5, 0]);
        expect(probabilities['i']).toStrictEqual([0, 1 / 5, 0, 0, 0]);
        expect(probabilities['d']).toStrictEqual([0, 0, 1 / 5, 0, 0]);
        expect(probabilities['p']).toStrictEqual([0, 0, 1 / 5, 0, 0]);
        expect(probabilities['u']).toStrictEqual([0, 0, 1 / 5, 0, 0]);
        expect(probabilities['a']).toStrictEqual([0, 1 / 5, 0, 0, 0]);
        expect(Object.keys(probabilities)).toHaveLength(26);


    })

    it('all non-existing letters should have a probability of 0', async () => {
        const words = ['horse', 'house', 'haste', 'hides', 'hopes'] as WordleWord[];
        const probabilities = calculateLetterProbabilities(words);
        for (const letter of ALL_LETTERS) {
            if (!words.some(word => word.includes(letter))) {
                expect(probabilities[letter]).toStrictEqual([0, 0, 0, 0, 0]);
            }
        }
    });

    it('all letter probabilities should sum to 1 for each position', async () => {
        const words = ['horse', 'house', 'haste', 'hides', 'hopes'] as WordleWord[];
        const probabilities = calculateLetterProbabilities(words);

        for (const index of WordleIndices) {
            let sum = 0;
            for (const letter of ALL_LETTERS) {
                sum += probabilities[letter][index];
            }
            expect(sum).toBeCloseTo(1, 0.0001);
        }
    })

    it('next best guess is sensible', async () => {
        // most likely is 'crate' since most words start with cra and end with e, and slightly more have a t just before
        // this guess eliminates a lot of words
        const words = ['crane', 'crate', 'crabs', 'crack', 'horse', 'plate'] as WordleWord[];
        const knowledgeState = initialKnowledgeState();
        knowledgeState.guesses = ['asdasd'] as WordleWord[];
        const guess = makeNextGuess(words, knowledgeState);
        expect(guess).toBe('crate');
    })

    it('prune words removes impossible words', async () => {
        const words = ['horse', 'house', 'haste', 'hides', 'hopes'] as WordleWord[];

        const knowledgeState = initialKnowledgeState();
        knowledgeState.correct.set(0, 'h');
        knowledgeState.correct.set(1, 'o');
        knowledgeState.correct.set(2, 'r');
        knowledgeState.correct.set(3, 's');
        knowledgeState.correct.set(4, 'e');

        const pruned = pruneWords(words, knowledgeState);
        expect(pruned).toStrictEqual(['horse']);
    })

    it('possible letter locations are updated correctly - horse vs crane', async () => {
        const guess = 'horse' as WordleWord;
        const solution = 'crane' as WordleWord;
        const knowledgeState = initialKnowledgeState();
        updateKnowledgeState(knowledgeState, guess, solution);

        expect(knowledgeState).toStrictEqual({
            correct: new Map([[4, 'e']]),
            known_letters_positions: new Map([
                ['r', new Set([0, 1, 3, 4])],
                ['e', new Set([0, 1, 2, 3, 4])]
            ]),
            not_in_puzzle: new Set(['h', 'o', 's']),
            guesses: ['horse'],
            available_words: [],
            multiples: new Map(),
        });
    })

    it('simple worldle is solved correctly', async () => {
        const solution = 'hello' as WordleWord;
        const availableWords = ['horse', 'house', 'haste', 'hides', 'hopes', 'hello'] as WordleWord[];
        const { guess, guesses_count } = solveWordle(solution, availableWords);
        expect(guess).toBe(solution);

    })

    it('solves wordle from 2024-07-27', async () => {
        const words = await getWordleList();
        const wordle = await getWordleForDay(new Date('2024-07-26'));
        console.log("solution: ", wordle)
        const solution = solveWordle(wordle!.wordle, words);
        console.log("solved: ", solution.guesses)

        console.log(generateWordleShareable(wordle!, solution))
    })

    it('correctly gets historic data', async () => {
        const wordles = await getHistoricWordleStats();
        expect(Object.entries(wordles).length).toBeGreaterThan(100);
    })
});

// yeah this shouldn't be a unit test IDGAF, it's nice and easy to run though
describe('Wordle performance tests', () => {
    it('solve wordles average is below 5', async () => {
        const originalConsoleLog = console.log;
        console.log = () => { };

        let stats: any = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0, 'x': 0 };

        let guesses = 0;
        let wordles = 0;
        let startTime = Number(new Date());
        const words = await getWordleList();
        for (const wordle of await getAllWordlesBetweenInclusive(new Date('2024-01-01'), new Date('2024-07-27'))) {
            const solution = solveWordle(wordle!.wordle, words);
            if (solution.guess != wordle!.wordle) {
                stats['x']++
            } else {
                stats[solution.guesses_count]++;
            }
            guesses += solution.guesses_count;
            wordles += 1;
        }
        console.log = originalConsoleLog;
        console.log("Average Guesses: ", (guesses / wordles).toFixed(2))
        console.log("Wordles Count: ", wordles)
        let current_time = Number(new Date());
        let ms_per_wordle = (current_time - startTime) / wordles;
        console.log("Time per wordle: ", (ms_per_wordle / 1000).toFixed(2), "seconds")
        const emojiBarChart = (stats: any) => {
            let chart = '';
            for (const count in stats) {
                const emoji = count == 'x' ? '🟧' : '🟦';
                const bar = emoji.repeat(stats[count]);
                chart += `${count}: ${bar}\n`;
            }
            return chart;
        };

        console.log(emojiBarChart(stats));
        expect(guesses / wordles).toBeLessThan(5);
    });
})