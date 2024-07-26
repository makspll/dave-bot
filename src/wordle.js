import axios from 'axios';

export const ALL_LETTERS = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k',
    'l', 'm', 'n', 'o', 'p', 'q', 'r', 's', 't', 'u', 'v',
    'w', 'x', 'y', 'z'];

export async function getWordleList() {
    try {
        const response = await axios.get('https://raw.githubusercontent.com/tabatkins/wordle-list/main/words');
        const wordleList = response.data;
        return wordleList;
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
        return wordle.solution;
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

        return guess != word;
    });
}

// calculates the probability that a random word has a given letter at a given position for all letters and positions
export function calculateLetterProbabilities(availableWords) {
    const letterProbabilities = {};

    for (const letter of ALL_LETTERS) {
        letterProbabilities[letter] = [0, 0, 0, 0, 0];
    }

    for (let i = 0; i < 5; i++) {
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
export function makeNextGuess(availableWords) {
    const letter_position_probabilities = calculateLetterProbabilities(availableWords);

    let bestGuess = 'horse';
    let bestScore = 0;

    for (const word of availableWords) {
        let score = 0;
        for (const i of [0, 1, 2, 3, 4]) {
            const letter = word[i];
            // we can calculate the best word by looking at the a priori probabilities of their letters.
            // a simple heuristic we can use is, find the word which has the highest sum of the probabilities of its letters 
            score += letter_position_probabilities[letter][i]
        }

        if (score > bestScore) {
            bestScore = score;
            bestGuess = word;
        }
    }

    return bestGuess
}

// given a list of available words, a guess, and the solution, update the locations dictionary to generate hints
export function updateLocations(locations, guess, solution) {
    for (const i of [0, 1, 2, 3, 4]) {
        const letter = guess[i];
        if (solution[i] == letter) {
            console.log("correct letter in correct position: ", letter, " at ", i);
            // correct letter in correct position
            locations[letter] = [i]
        } else if (solution.includes(letter)) {
            console.log("correct letter in wrong position: ", letter, " at ", i);
            // correct letter in wrong position
            // eliminate current position as valid
            locations[letter] = locations[letter].filter(pos => pos !== i);
        } else {
            console.log("incorrect letter: ", letter, " at ", i);
            // incorrect letter, eliminate from possible positions
            locations[letter] = []
        }
    }
}

export function solveWordle(solution, availableWords) {
    const locations = {}
    for (const letter of ALL_LETTERS) {
        locations[letter] = [0, 1, 2, 3, 4];
    }

    let guesses = 0;
    let all_guesses = [];
    let guess = null;
    while (guess != solution && guesses < 6) {
        console.log("guess no: ", guesses);
        console.log("available words: ", availableWords.length);

        // no need to prune if we have no information yet
        guess = makeNextGuess(availableWords);
        console.log("guess: ", guess);
        for (const i of [0, 1, 2, 3, 4]) {
            const letter = guess[i];
            if (!locations.hasOwnProperty(letter)) {
                locations[letter] = [];
            }
            locations[letter].push(i);
        }

        all_guesses.push(guess);
        guesses++;
        updateLocations(locations, guess, solution);
        availableWords = pruneWords(availableWords, locations, guess);
    }

    if (guesses > 6 || guess != solution) {
        console.log("Failed to solve wordle in 6 guesses");
        return null;
    } else {
        console.log(`Solved in ${guesses} guesses!`);
        return {
            'guess': guess,
            'guesses_count': guesses,
            'guesses': all_guesses
        };
    }
}