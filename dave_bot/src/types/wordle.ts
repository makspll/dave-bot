
export const ALL_LETTERS = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k',
    'l', 'm', 'n', 'o', 'p', 'q', 'r', 's', 't', 'u', 'v',
    'w', 'x', 'y', 'z'] as const;

export type LetterTypes = typeof ALL_LETTERS;
export type Letter = LetterTypes[number]
export type WordleIndex = 0 | 1 | 2 | 3 | 4
export type Pentuple<T> = [T, T, T, T, T]
export type LetterProbabilities = Record<Letter, Pentuple<number>>
export type WordleWord = string & { length: 5 } & { [i in WordleIndex]: Letter };


export interface WordleKnowledgeState {
    correct: Map<WordleIndex, Letter>
    not_in_puzzle: Set<Letter>
    known_letters_positions: Map<Letter, Set<WordleIndex>>
    guesses: WordleWord[]
    available_words: WordleWord[][] // list of available words before each guess
    multiples: Map<Letter, number>
}
export interface WordleSolveOutput {
    guess: WordleWord,
    guesses_count: number,
    guesses: WordleWord[],
    available_words: WordleWord[][]
}
export interface WordleResponse {
    wordle: WordleWord,
    wordle_no: number
}

export interface WordleScore {
    guesses: number,
    hard_mode: boolean
}
