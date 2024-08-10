import axios from 'axios';
import { escapeMarkdown } from './markdown.js';
import { formatDateToYYYYMMDD, sample } from './utils.js';

export const WordleIndices = [0, 1, 2, 3, 4] as const
export const ALL_LETTERS = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k',
    'l', 'm', 'n', 'o', 'p', 'q', 'r', 's', 't', 'u', 'v',
    'w', 'x', 'y', 'z'] as const;

export async function getWordleList() {
    try {
        const response = await axios.get('https://raw.githubusercontent.com/tabatkins/wordle-list/main/words');
        const wordleList = response.data.split('\n');
        return wordleList
    } catch (error) {
        console.error('Error retrieving wordle list:', error);
        return null;
    }
}


export async function getWordleForDay(day: Date): Promise<WordleResponse | null> {
    try {
        const response = await axios.get(`https://www.nytimes.com/svc/wordle/v2/${formatDateToYYYYMMDD(day)}.json`);
        const wordle = response.data;
        if (wordle == null || wordle.solution == null) {
            throw `No wordle for day ${day}`;
        }
        const wordle_no = wordle.days_since_launch;
        return {
            "wordle": wordle.solution,
            "wordle_no": wordle_no
        };
    } catch (error) {
        console.error(`Error retrieving wordle for day ${day}:`, error);
        return null;
    }
}


export async function getAllWordlesBetweenInclusive(start: Date, end: Date) {
    const promises = [];
    for (let day = new Date(start); day <= end; day.setDate(day.getDate() + 1)) {
        promises.push(getWordleForDay(day));
    }

    console.log("Sent all requests... awaiting..");
    const wordles = await Promise.all(promises);
    return wordles;
}




// removes words which are not possible given the current guess and state of the game
export function pruneWords(availableWords: WordleWord[], knowledgeState: WordleKnowledgeState) {
    return availableWords.filter((word) => {
        for (const i of WordleIndices) {
            const letter = word[i];

            if (knowledgeState.not_in_puzzle.has(letter)) { // eliminate words with letters not in the puzzle
                return false;
            } else if (knowledgeState.correct.get(i) && knowledgeState.correct.get(i) != letter) { // eliminate words with correct letters in the wrong position
                return false;
            } else if (knowledgeState.known_letters_positions.has(letter) // eliminate words with misplaced letters
                && !(knowledgeState.known_letters_positions.get(letter)!.has(i))
            ) {
                return false
            }
            // remove words which don't have enough multiple letters
            let multiples = knowledgeState.multiples.get(letter) ?? 0;
            if (multiples > 1 && (word.split(letter).length - 1 < multiples)) {
                return false;
            }
        }


        // if the word does not include the misplaced letters in the puzzle prune it
        for (const [letter, positions] of knowledgeState.known_letters_positions) {
            if (!word.includes(letter)) {
                return false;
            }
        }

        return knowledgeState.guesses.at(-1) != word;
    });
}

// calculates the probability that a random word has a given letter at a given position for all letters and positions


export function calculateLetterProbabilities(availableWords: WordleWord[]): LetterProbabilities {
    const letterProbabilities: LetterProbabilities = {
        a: [0, 0, 0, 0, 0],
        b: [0, 0, 0, 0, 0],
        c: [0, 0, 0, 0, 0],
        d: [0, 0, 0, 0, 0],
        e: [0, 0, 0, 0, 0],
        f: [0, 0, 0, 0, 0],
        g: [0, 0, 0, 0, 0],
        h: [0, 0, 0, 0, 0],
        i: [0, 0, 0, 0, 0],
        j: [0, 0, 0, 0, 0],
        k: [0, 0, 0, 0, 0],
        l: [0, 0, 0, 0, 0],
        m: [0, 0, 0, 0, 0],
        n: [0, 0, 0, 0, 0],
        o: [0, 0, 0, 0, 0],
        p: [0, 0, 0, 0, 0],
        q: [0, 0, 0, 0, 0],
        r: [0, 0, 0, 0, 0],
        s: [0, 0, 0, 0, 0],
        t: [0, 0, 0, 0, 0],
        u: [0, 0, 0, 0, 0],
        v: [0, 0, 0, 0, 0],
        w: [0, 0, 0, 0, 0],
        x: [0, 0, 0, 0, 0],
        y: [0, 0, 0, 0, 0],
        z: [0, 0, 0, 0, 0],
    };

    for (const word of availableWords) {
        for (const i of WordleIndices) {
            const letter = word[i];
            letterProbabilities[letter][i] += 1;
        }
    }


    for (const letter of ALL_LETTERS) {
        const positionCounts = letterProbabilities[letter];
        for (const i of WordleIndices) {
            positionCounts[i] /= availableWords.length
        }
    }

    return letterProbabilities;
}

// given a list of previous guesses and a list of available words, return the best guess.
export function makeNextGuess(availableWords: WordleWord[], knowledgeState: WordleKnowledgeState) {
    if (knowledgeState.guesses.length == 0) {
        // first guess is randomized
        return sample(['salet', 'crate', 'plate'])
    }
    const known_letters = calculateKnownLetters(knowledgeState);
    const letter_position_probabilities = calculateLetterProbabilities(availableWords);
    let bestGuess = 'horse';
    let bestScore = -99999999;

    for (const word of availableWords) {
        let score = 0;
        let used_letters = new Set();
        for (const i of WordleIndices) {
            const letter = word[i];
            // we can calculate the best word by looking at the a priori probabilities of their letters.
            // a simple heuristic we can use is, find the word which has the highest sum of the probabilities of its letters
            // we boost letters that are in the correct position by setting their probability to 1
            score += knowledgeState.correct.get(i) == letter ? 1 : letter_position_probabilities[letter][i];

            // slightly penalize words with duplicate letters
            // as they are less likely to be the solution
            if (used_letters.has(letter)) {
                score -= 1;
            }
            used_letters.add(letter);
        }

        // calculate the hint score if we were to guess this word
        const hint_score = calculateHintScore(word, known_letters);
        score += hint_score * 5;

        if (score > bestScore) {
            bestScore = score;
            bestGuess = word;
        }
    }

    return bestGuess
}

export function calculateKnownLetters(knowledgeState: WordleKnowledgeState): Set<Letter> {
    // find letters we already know something about
    let known_letters: Set<Letter> = new Set();
    for (const i of WordleIndices) {
        let letter = knowledgeState.correct.get(i);
        if (letter) {
            known_letters.add(letter);
        }
    }
    for (const letter of knowledgeState.known_letters_positions.keys()) {
        known_letters.add(letter);
    }

    for (const letter of knowledgeState.not_in_puzzle) {
        known_letters.add(letter);
    }
    return known_letters;
}

/// calculates how much information a new guess could give us given our current knowledge (i.e. a score from 0 to 1 describing how many new hints we could get)
export function calculateHintScore(word: WordleWord, knownLetters: Set<Letter>) {
    let score = 0;
    for (const i of WordleIndices) {
        const letter = word[i];
        if (!knownLetters.has(letter)) {
            score++;
        }
    }
    return score / 5;
}


export function initialKnowledgeState(): WordleKnowledgeState {
    return {
        'correct': new Map(), // position to letter mapping of correct letters
        'not_in_puzzle': new Set(), // set of letters which are not in the puzzle
        'known_letters_positions': new Map(), // letter to set of possible positions mapping if the letter is in the puzzle but not in the correct position
        'guesses': [], // list of guesses so far
        'available_words': [], // list of available words before each guess
        'multiples': new Map() // set of letters which appear more than once
    };
}

// given a list of available words, a guess, and the solution, update the locations dictionary to generate hints
// returns a guess in the form of '..a..' i.e. the word with the correct letter in the correct position and dots for the rest
export function updateKnowledgeState(previous_state: WordleKnowledgeState, guess: WordleWord, solution: WordleWord) {
    previous_state.guesses.push(guess);
    for (const i of WordleIndices) {
        const letter = guess[i];
        if (solution[i] == letter) {
            previous_state.correct.set(i, letter)
            let known_positions = previous_state.known_letters_positions.get(letter);
            if (!known_positions) {
                previous_state.known_letters_positions.set(letter, new Set(WordleIndices));
            }
        } else if (solution.includes(letter)) {
            let known_positions = previous_state.known_letters_positions.get(letter);
            if (!known_positions) {
                known_positions = new Set(WordleIndices);
                previous_state.known_letters_positions.set(letter, known_positions);
            }
            // keep track of letters which are in the puzzle but not in the correct position by storing their possible positions
            known_positions.delete(i);
        } else {
            // incorrect letter, eliminate from possible positions
            previous_state.not_in_puzzle.add(letter)
        }
        // keep track of letters which appear more than once
        // if the guess contains multiple instances of the letter and so does the solution, we reveal that information
        // like in the normal wordle
        const count_in_solution = solution.split(letter).length - 1;
        const count_in_guess = guess.split(letter).length - 1;
        const revealed_count = Math.min(count_in_solution, count_in_guess);
        if (revealed_count > 1) {
            previous_state.multiples.set(letter, revealed_count);
        }
    }
}




export function solveWordle(solution: WordleWord, availableWords: WordleWord[]): WordleSolveOutput {
    let knowledgeState = initialKnowledgeState();
    while (knowledgeState.guesses.at(-1) != solution && knowledgeState.guesses.length < 6) {
        // no need to prune if we have no information yet
        knowledgeState.available_words.push([...availableWords])
        const guess = makeNextGuess(availableWords, knowledgeState);

        updateKnowledgeState(knowledgeState, guess, solution);

        availableWords = pruneWords(availableWords, knowledgeState);
    }


    let solved = knowledgeState.guesses.at(-1) == solution;
    let count = solved ? knowledgeState.guesses.length : 7;
    return {
        'guess': knowledgeState.guesses.at(-1)!,
        'guesses_count': count,
        'guesses': knowledgeState.guesses,
        'available_words': knowledgeState.available_words,
    };
}

export function isWordleWord(word: string): word is WordleWord {
    return word.length == 5 && word.split('').every((letter) => ALL_LETTERS.includes(letter as Letter));
}

// generate emoji based wordle shareable
// of the form:
// Wordle 1,133 6/6*

// ⬛🟨⬛⬛⬛
// ⬛⬛🟩⬛⬛
// 🟨⬛🟩⬛⬛
// ⬛⬛🟩🟩⬛
// 🟩⬛🟩🟩⬛
// 🟩🟩🟩🟩🟩
export function generateWordleShareable(solution: WordleResponse, solve_output: WordleSolveOutput) {
    let guesses_length = solve_output.guesses.length == 7 ? 'X' : solve_output.guesses.length.toString();

    let shareable = escapeMarkdown(`Wordle ${solution.wordle_no} ${guesses_length}/6*\n\n`);
    for (const guess of solve_output.guesses) {
        const guess_idx = solve_output.guesses.indexOf(guess);
        shareable += emojify_guess(guess, solution.wordle);
        const words_before = (solve_output.available_words[guess_idx - 1] || []).length || 0;
        const words_now = solve_output.available_words[guess_idx].length;
        const change = words_before == 0 ? "" : `(↓${(((words_before - words_now) / words_before) * 100).toFixed(2)}%)`;
        shareable += ` ||${guess}||` + escapeMarkdown(` Words: ${String(words_now).padEnd(7, ' ')}${change}`);
        if (solve_output.available_words[guess_idx].length < 0) {
            for (const word of solve_output.available_words[guess_idx]) {
                shareable += emojify_guess(word, solution.wordle) + `||${word}||` + ',';
            }
        }
        shareable += '\n';
    }
    return shareable;
}

function emojify_guess(guess: WordleWord, solution: WordleWord) {
    let emojified = '';
    for (const i of WordleIndices) {
        const letter = guess[i]
        if (letter == solution[i]) {
            emojified += '🟩';
        } else if (solution.includes(letter)) {
            emojified += '🟨';
        } else {
            emojified += '⬛';
        }
    }
    return emojified;
}

// retrieves wordle stats from engaging-data.com
// wordlepuzzles={"626": {"date": "03/07", "num": 626, "answer": "HORSE", "cumulative": [1, 9, 44, 76, 92, 98], "individual": [1, 8, 35, 32, 16, 6], "sample": 666983, "datestr": "030723"}}
// note the id's are wrong :C, have to match them up by answer or something
export async function getHistoricWordleStats() {

    try {
        const response = await axios.get('https://engaging-data.com/pages/scripts/wordlebot/wordlepuzzles.js', {
            headers: {
                'Accept': 'text/plain'
            }
        });
        return JSON.parse(response.data.split('=')[1])
    } catch (error) {
        console.error('Error retrieving wordle list:', error);
        return {}
    }
}