declare global {

    type LetterTypes = typeof ALL_LETTERS
    type Letter = LetterTypes[number]
    type WordleIndex = 0 | 1 | 2 | 3 | 4
    type Pentuple<T> = [T, T, T, T, T]
    type LetterProbabilities = Record<Letter, Pentuple<number>>
    type WordleWord = string & { length: 5 } & { [i in WordleIndex]: Letter };


    interface WordleKnowledgeState {
        correct: Map<WordleIndex, Letter>
        not_in_puzzle: Set<Letter>
        known_letters_positions: Map<Letter, Set<WordleIndex>>
        guesses: WordleWord[]
        available_words: WordleWord[][] // list of available words before each guess
        multiples: Map<Letter, number>
    }
    interface WordleSolveOutput {
        guess: WordleWord,
        guesses_count: number,
        guesses: WordleWord[],
        available_words: WordleWord[][]
    }
    interface WordleResponse {
        wordle: WordleWord,
        wordle_no: number
    }
}

export const WordleIndices = [0, 1, 2, 3, 4] as const
export const ALL_LETTERS = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k',
    'l', 'm', 'n', 'o', 'p', 'q', 'r', 's', 't', 'u', 'v',
    'w', 'x', 'y', 'z'] as const;


export { }