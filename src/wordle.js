import axios from 'axios';

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
export function pruneWords(availableWords, locations, guess = null) {
    return availableWords.filter((word) => {
        for (const i of [0, 1, 2, 3, 4]) {
            const letter = word[i];
            if (!locations[letter].includes(i)) {
                return false;
            }
        }
        
        for (const letter in locations) {
             if (locations[letter].length < 5 && locations[letter].length > 1 && !word.includes(letter)) {
                 return false;
             }

             if (locations[letter].length == 1 && word.indexOf(letter) != locations[letter][0]) {
                 return false;
             }
        }

        return guess != word;
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
// locations is a dictionary from letter to possible positions given our guesses
// i.e. { 'h': [0, 1], 'o': [2, 3], 'r': [4], 's': [] }
export function makeNextGuess(availableWords, current_guess = '.....') {
    const letter_position_probabilities = calculateLetterProbabilities(availableWords);
    let bestGuess = 'horse';
    let bestScore = 0;

    for (const word of availableWords) {
        let score = 0;
        let letter_scores = []
        for (const i of [0, 1, 2, 3, 4]) {
            const letter = word[i];
            // we can calculate the best word by looking at the a priori probabilities of their letters.
            // a simple heuristic we can use is, find the word which has the highest sum of the probabilities of its letters
            // we boost letters that are in the correct position by setting their probability higher
            const current_letter_score = current_guess[i] == letter ? 5 : 0;
            const total_current_letter_score = letter_position_probabilities[letter][i] + current_letter_score;
            score += total_current_letter_score;
            letter_scores.push(total_current_letter_score);
        }

        if (score > bestScore) {
            bestScore = score;
            bestGuess = word;
        }
    }

    return bestGuess
}

// given a list of available words, a guess, and the solution, update the locations dictionary to generate hints
// returns a guess in the form of '..a..' i.e. the word with the correct letter in the correct position and dots for the rest
export function updateLocations(locations, guess, solution) {
    let guess_word = ''
    for (const i of [0, 1, 2, 3, 4]) {
        const letter = guess[i];
        console.log("previous: ", locations[letter])
        if (solution[i] == letter) {
            guess_word += letter;
            // correct letter in correct position
            // locations[letter] = [i]
            console.log("correct letter in correct position: ", letter, " at ", i, "new locations: ", locations[letter]);
        } else if (solution.includes(letter)) {
            guess_word += '.';
            // correct letter in wrong position
            // eliminate current position as valid
            locations[letter] = locations[letter].filter(pos => pos !== i);
            console.log("correct letter in wrong position: ", letter, " at ", i, "new locations: ", locations[letter]);
        } else {
            guess_word += '.';
            // incorrect letter, eliminate from possible positions
            locations[letter] = []
            console.log("incorrect letter: ", letter, " at ", i, "new locations: ", locations[letter]);
        }
    }
    return guess_word;
}

export function solveWordle(solution, availableWords) {
    let locations = {}
    for (const letter of ALL_LETTERS) {
        locations[letter] = [0, 1, 2, 3, 4];
    }

    let guesses = 0;
    let all_guesses = [];
    let guess = null;
    let guess_word = '.....';
    while (guess != solution && guesses < 6) {
        console.log("guess no: ", guesses);
        console.log("available words: ", availableWords.length);

        // no need to prune if we have no information yet
        guess = makeNextGuess(availableWords, guess_word);
        console.log("guess: ", guess);

        all_guesses.push(guess);
        guesses++;
        guess_word = updateLocations(locations, guess, solution);
        availableWords = pruneWords(availableWords, locations, guess);
    }


    console.log(`Took ${guesses} guesses!`);
    return {
        'guess': guess,
        'guesses_count': guesses,
        'guesses': all_guesses
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
export function generateWordleShareable(solution, guesses) {
    let shareable = `Wordle ${solution.wordle_no} ${guesses.length}/6\\*\n\n`;
    for (const guess of guesses) {
        for (const letter of guess) {
            if (!solution.wordle.includes(letter)) {
                shareable += '⬛';
            } else if (letter == solution.wordle[guess.indexOf(letter)]) {
                shareable += '🟩';
            } else {
                shareable += '🟨';
            }
        }
        shareable += '\n';
    }

    return shareable;
}