import { getWordleList, getWordleForDay, getAllWordlesBetweenInclusive, calculateLetterProbabilities, makeNextGuess, updateKnowledgeState, ALL_LETTERS, pruneWords, solveWordle, generateWordleShareable, initialKnowledgeState, getHistoricWordleStats, WordleIndices } from '../wordle.js';
import { makeMockServer } from '../server.js';
import { WordleWord } from '@src/types/wordle.js';
import { printDateToGameId as printDateToGameId } from '@src/utils.js';
import { FIRST_POOPLE_DATE } from '@src/types/poople.js';
import { score_from_poople_shareable } from '@src/poople.js';

const TEST_TIMEOUT_SECONDS = 120;
jest.setTimeout(70 * TEST_TIMEOUT_SECONDS)

let server = makeMockServer()

beforeEach(() => {
    server = makeMockServer();
    server.listen();
});

afterEach(() => {
    server.close();
});

describe('Poople tests', () => {
    it('Print date works correctly', async () => {
        const res = printDateToGameId('2026-06-18', FIRST_POOPLE_DATE, false);
        expect(res).toBe(308)
    });

    it('Parses score correctly', async () => {
        const res = score_from_poople_shareable("Poople #303 8/5")
        expect(res.score).toBe(3)
        expect(res.poopleNo).toBe(303)
    });


});
