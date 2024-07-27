import axios from 'axios';
import { escapeMarkdown } from './markdown.js';

export const ALL_LETTERS = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k',
    'l', 'm', 'n', 'o', 'p', 'q', 'r', 's', 't', 'u', 'v',
    'w', 'x', 'y', 'z'];

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

function formatDateToYYYYMMDD(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0'); // Months are zero-based
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}


export async function getWordleForDay(day) {
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


export async function getAllWordlesBetweenInclusive(start, end) {
    const promises = [];
    for (let day = new Date(start); day <= end; day.setDate(day.getDate() + 1)) {
        promises.push(getWordleForDay(day));
    }

    console.log("Sent all requests... awaiting..");
    const wordles = await Promise.all(promises);
    return wordles;
}




// removes words which are not possible given the current guess and state of the game
export function pruneWords(availableWords, knowledgeState) {
    return availableWords.filter((word) => {
        for (const i of [0, 1, 2, 3, 4]) {
            const letter = word[i];

            if (letter in knowledgeState.not_in_puzzle) {
                return false;
            } else if (knowledgeState.correct[i] != null && knowledgeState.correct[i] != letter) {
                return false;
            } else if (letter in knowledgeState.known_letters_positions
                && !(knowledgeState.known_letters_positions[letter].includes(i))
            ) {
                return false
            }
            // remove words which don't have enough multiple letters
            if (knowledgeState.multiples[letter] > 1 && (word.split(letter).length - 1 < knowledgeState.multiples[letter])) {
                console.log(`pruning ${word} because it doesn't have enough ${letter}s`);
                return false;
            }
        }


        // if the word does not include the misplaced letters in the puzzle prune it
        for (const letter in knowledgeState.known_letters_positions) {
            if (!word.includes(letter)) {
                return false;
            }
        }

        return knowledgeState.guesses.at(-1) != word;
    });
}

// calculates the probability that a random word has a given letter at a given position for all letters and positions
export function calculateLetterProbabilities(availableWords) {
    const letterProbabilities = {};

    for (const letter of ALL_LETTERS) {
        letterProbabilities[letter] = [0, 0, 0, 0, 0];
    }

    for (const i of [0, 1, 2, 3, 4]) {
        for (const word of availableWords) {
            const letter = word[i];
            letterProbabilities[letter][i]++;
        }
    }

    for (const letter in letterProbabilities) {
        const positionCounts = letterProbabilities[letter];
        letterProbabilities[letter] = positionCounts.map((count) => count / availableWords.length);
    }

    return letterProbabilities;
}

// given a list of previous guesses and a list of available words, return the best guess.
export function makeNextGuess(availableWords, knowledgeState) {
    if (knowledgeState.guesses.length == 0) {
        // first guess is always alright
        return 'salet'
    }

    const letter_position_probabilities = calculateLetterProbabilities(availableWords);
    let bestGuess = 'horse';
    let bestScore = -99999999;

    for (const word of availableWords) {
        let score = 0;
        let letter_scores = []
        for (const i of [0, 1, 2, 3, 4]) {
            const letter = word[i];
            // we can calculate the best word by looking at the a priori probabilities of their letters.
            // a simple heuristic we can use is, find the word which has the highest sum of the probabilities of its letters
            // we boost letters that are in the correct position by setting their probability to 1
            const current_letter_score = knowledgeState.correct[i] == letter ? 1 : 0;
            const total_current_letter_score = letter_position_probabilities[letter][i] + current_letter_score;
            score += total_current_letter_score;
            letter_scores.push(total_current_letter_score);
        }

        if (score > bestScore) {
            console.log(`new best guess: ${word} with score ${score} and letter scores: ${letter_scores}`);
            bestScore = score;
            bestGuess = word;
        }
    }

    return bestGuess
}

export function initialKnowledgeState() {
    return {
        'correct': {}, // position to letter mapping of correct letters
        'not_in_puzzle': {}, // set of letters which are not in the puzzle
        'known_letters_positions': {}, // letter to set of possible positions mapping if the letter is in the puzzle but not in the correct position
        'guesses': [], // list of guesses so far
        'available_words': [], // list of available words before each guess
        'multiples': {} // set of letters which appear more than once
    };
}

// given a list of available words, a guess, and the solution, update the locations dictionary to generate hints
// returns a guess in the form of '..a..' i.e. the word with the correct letter in the correct position and dots for the rest
export function updateKnowledgeState(previous_state, guess, solution) {
    previous_state.guesses.push(guess);
    for (const i of [0, 1, 2, 3, 4]) {
        const letter = guess[i];
        if (solution[i] == letter) {
            console.log(`correct letter ${letter} at position ${i}`);
            previous_state.correct[i] = letter
            if (previous_state.known_letters_positions[letter] == null) {
                previous_state.known_letters_positions[letter] = [0, 1, 2, 3, 4];
            }
        } else if (solution.includes(letter)) {
            console.log(`incorrect letter ${letter} at position ${i}`);
            // keep track of letters which are in the puzzle but not in the correct position by storing their possible positions
            if (previous_state.known_letters_positions[letter] == null) {
                previous_state.known_letters_positions[letter] = [0, 1, 2, 3, 4];
            }
            previous_state.known_letters_positions[letter] = previous_state.known_letters_positions[letter].filter(pos => pos !== i);
        } else {
            console.log(`letter ${letter} not in puzzle`);
            // incorrect letter, eliminate from possible positions
            previous_state.not_in_puzzle[letter] = true
        }
        // keep track of letters which appear more than once
        // if the guess contains multiple instances of the letter and so does the solution, we reveal that information
        // like in the normal wordle
        const count_in_solution = solution.split(letter).length - 1;
        const count_in_guess = guess.split(letter).length - 1;
        const revealed_count = Math.min(count_in_solution, count_in_guess);
        if (revealed_count > 1) {
            previous_state.multiples[letter] = revealed_count;
        }
    }
}

export function solveWordle(solution, availableWords) {
    let locations = {}
    for (const letter of ALL_LETTERS) {
        locations[letter] = [0, 1, 2, 3, 4];
    }

    let knowledgeState = initialKnowledgeState();
    while (knowledgeState.guesses.at(-1) != solution && knowledgeState.guesses.length < 6) {
        // no need to prune if we have no information yet
        knowledgeState.available_words.push(availableWords.length)
        const guess = makeNextGuess(availableWords, knowledgeState);
        console.log(`#${knowledgeState.guesses.length}: guess: '${guess}'. with ${availableWords.length} words left`);

        updateKnowledgeState(knowledgeState, guess, solution);
        console.log(`new knowledge state:` + JSON.stringify(knowledgeState, null, 2));
        availableWords = pruneWords(availableWords, knowledgeState);
    }


    console.log(`Took ${knowledgeState.guesses} guesses!`);
    return {
        'guess': knowledgeState.guesses.at(-1),
        'guesses_count': knowledgeState.guesses.length,
        'guesses': knowledgeState.guesses,
        'available_words': knowledgeState.available_words
    };
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
export function generateWordleShareable(solution, solve_output) {
    let shareable = escapeMarkdown(`Wordle ${solution.wordle_no} ${solve_output.guesses.length}/6*\n\n`);
    for (const guess of solve_output.guesses) {
        for (const i of [0, 1, 2, 3, 4]) {
            const letter = guess[i]
            if (letter == solution.wordle[i]) {
                shareable += '🟩';
            } else if (solution.wordle.includes(letter)) {
                shareable += '🟨';
            } else {
                shareable += '⬛';
            }
        }
        const words_before = solve_output.available_words[solve_output.guesses.indexOf(guess) - 1] || 0;
        const words_now = solve_output.available_words[solve_output.guesses.indexOf(guess)];
        const change = words_before == 0 ? "" : `(↓${(((words_before - words_now) / words_before) * 100).toFixed(2)}%)`;
        shareable += escapeMarkdown(` Words: ${String(words_now).padEnd(7, ' ')}${change}\n`);
    }

    return shareable;
}