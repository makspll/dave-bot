import axios from 'axios';
import { formatDateToYYYYMMDD } from './utils.js';
import { escapeMarkdown } from './markdown.js';

// retrieves connections for a specific date, returns a json object in the format:
//{
// "id": 440,
// "print_date": "2024-07-27",
// "editor": "Wyna Liu",
// "categories": [
//     {
//         "title": "OFF-TOPIC REMARKS",
//         "cards": [{ "content": "ASIDE", "position": 13 }, { "content": "DETOUR", "position": 1 }, { "content": "DIGRESSION", "position": 10 }, { "content": "TANGENT", "position": 5 }]
//     },
//     {
//         "title": "CREATE, AS RESULTS",
//         "cards": [{ "content": "BEAR", "position": 0 }, { "content": "GENERATE", "position": 9 }, { "content": "PRODUCE", "position": 12 }, { "content": "YIELD", "position": 3 }]
//     },
//     {
//         "title": "HOTTIE",
//         "cards": [{ "content": "BABE", "position": 15 }, { "content": "FOX", "position": 4 }, { "content": "SNACK", "position": 7 }, { "content": "TEN", "position": 8 }]
//     }, {
//         "title": "WORDS REPRESENTED BY THE LETTER \"R\"",
//         "cards": [{ "content": "ARE", "position": 14 }, { "content": "RADIUS", "position": 2 }, { "content": "REVERSE", "position": 6 }, { "content": "RIGHT", "position": 11 }]
//     }]
//}

export function printDateToConnectionsNumber(printDate) {
    const days = Math.round((new Date(printDate) - new Date('2023-06-12')) / (1000 * 60 * 60 * 24));
    return days + 1;
}

export async function getConnectionsForDay(date) {
    try {
        let response = await axios.get(`https://www.nytimes.com/svc/connections/v2/${formatDateToYYYYMMDD(date)}.json`);
        // calculate days between June 12, 2023 and the print date
        let data = response.data
        let newId = printDateToConnectionsNumber(data.print_date);
        console.log("correcting id from id: ", data.id, " to print_date id: ", newId);
        data.id = newId
        return data;
    } catch (error) {
        console.error(error);
        throw new Error('Failed to fetch connections');
    }
}

export async function initializeConnectionsKnowledgeState(tiles) {
    return {
        categorised: {}, // dictionary from category title to list of 4 words
        tiles: tiles,
        attempts: 4,
        one_away: undefined,
        guesses: []
    };
}

export function generateInitialPrompt() {
    return `
    you are a chatbot playing the connections game. The user is the game master and will give you hints and guidance throughout the game.
    The game master will provide you with a list of 16 words, each word belongs to a category. Your goal is to categorise these words into 4 groups.
    Each group should contain 4 words, the words in each group are connected in some way. You only need to name the words which are connected, not the category itself.
    You will make guesses by providing 4 COMMA SEPARATED AND CAPITALISED WORDS. The game master will tell you if your guess is correct, one word away or incorrect.
    If you make a mistake you will lose a life, you have 4 lives. If you guess correctly you will have to guess another 4 words from the remaining words.
    Here is an example game: 
    '''
    GM: The words are: 'BEAR,GENERATE,PRODUCE,YIELD,ASIDE,DETOUR,DIGRESSION,TANGENT,BABE,FOX,SNACK,TEN,ARE,RADIUS,REVERSE,RIGHT'
    Bot: 'BEAR,GENERATE,PRODUCE,YIELD'
    GM: Correct! Your guess belongs to the category: 'CREATE, AS RESULTS'. Now you must guess another 4 words from the remaining words which are connected: 'ASIDE,DETOUR,DIGRESSION,TANGENT,BABE,FOX,SNACK,TEN,ARE,RADIUS,REVERSE,RIGHT'
    Bot: 'ASIDE,DETOUR,DIGRESSION,TEN'
    GM: One away! One word is in the wrong category. You have one less attempt left.
    Bot: 'ASIDE,DETOUR,DIGRESSION,TANGENT'
    GM: Correct! Your guess belongs to the category: 'OFF-TOPIC REMARKS'. Now you must guess another 4 words from the remaining words which are connected: 'BABE,FOX,SNACK,TEN,ARE,RADIUS,REVERSE,RIGHT'
    Bot: 'BABE,FOX,SNACK,TEN'
    GM: Correct! Your guess belongs to the category: 'HOTTIE'. Now you must guess another 4 words from the remaining words which are connected: 'ARE,RADIUS,REVERSE,RIGHT'
    Bot: 'ARE,RADIUS,REVERSE,RIGHT'
    GM: Correct! Your guess belongs to the category: 'WORDS REPRESENTED BY THE LETTER "R"'. You have successfully categorised all words.
    '''
    ONLY RESPOND WITH 4 COMMA SEPARATED AND CAPITALISED WORDS. AND NOTHING ELSE.
    I REPEAT ONLY RESPOND WITH 4 COMMA SEPARATED AND CAPITALISED WORDS. AND NOTHING ELSE. NO EMOJIS, NO PUNCTUATION, NO SPACES, NO COMMENTS.
    `;
}

// converts a guess to a prompt, if the guess was invalid it will return the invalid reason
// this can be used to generate a message history for the bot
// if no guess was made will generate the initial prompt
export function convertGuessToPrompt(guess) {
    let reason = ''
    if (!guess) {
        return generateInitialPrompt();
    } else if (guess.invalid) {
        reason = guess.invalid;
    } else if (guess.correct) {
        let uncategorised = `Remaining words to categorise: '${guess.remaining.join(',')}'`;
        reason = `Correct! Your guess belongs to the category: ${guess.category}. Now you must guess another 4 words from the remaining words which are connected: ${uncategorised}`;
    } else if (guess.one_away) {
        reason = `Your guess is one word away from correct! One word is in the wrong category. You have one less attempt left.`;
    } else {
        reason = `Incorrect guess, at least two words are in the wrong category. You have one less attempt left.`;
    }
    return `You guessed: '${guess.length ? guess.join(",") : JSON.stringify(guess)}'.${reason} `;
}

// solves connections using a callback function that takes the current state of the game and outputs the list of 4 words to guess
// the callback will receive a second argument corresponding to the last invalid guess, if the last guess was invalid
export async function solveConnections(date, playerCallback) {
    let connections = await getConnectionsForDay(date);
    let all_tiles = connections.categories.flatMap(x => x.cards.map(y => y.content))
    // shuffle tiles
    all_tiles = all_tiles.sort(() => Math.random() - 0.5);
    let state = await initializeConnectionsKnowledgeState(all_tiles);

    while (state.attempts > 0) {
        // attempt to get valid input twice before failing
        let input_attempts = 0;
        let last_guess = guessCategory(await playerCallback(state, null), connections);
        while (last_guess.invalid && input_attempts < 3) {
            if (last_guess.correct && last_guess.category in state.categorised) {
                last_guess.invalid = `the guess was already made, it was correct, it belongs to the category: ${last_guess.category}. You cannot guess the same category twice.`;
            }
            last_guess = guessCategory(await playerCallback(state, last_guess), connections);
            input_attempts++;
        }

        if (last_guess.invalid) {
            throw new Error('failed to get valid input from player. fuck you openAI');
        }
        console.log(`#${3 - state.attempts}, last_guess: ${last_guess} `);

        state.guesses.push(last_guess);
        if (last_guess.correct) {
            let category_to_remove = last_guess.category
            let cards = connections.categories.find(c => c.title == category_to_remove).cards.map(c => c.content)
            state.categorised[category_to_remove] = cards
            state.tiles = state.tiles.filter(t => !cards.includes(t))

        } else {
            state.attempts--;
        }

        console.log("state after guess: ", state);
    }

    return [state, connections];
}

// parses guess & checks whether it is valid and correct, returns:
// {
//   correct: true/false,
//   one_away: true/false
//   category: "category title"
//   invalid: "invalid reason"/null // if the guess is invalid everything else will be undefined apart from the guess
//   guess: ["word1", "word2", "word3", "word4"]
//   remaining: ["word1", "word2", "word3", "word4", ...] // if the guess was correct
// }
export function guessCategory(guess, connections) {
    if (typeof (guess) === 'string') {
        guess = guess.split(',').map(x => x.replace(/\W/g, '').trim());
    }

    if (guess == null || guess.length !== 4) {
        return { invalid: "guess does not contain 4 comma separated words", guess };
    }

    let categories = []
    for (const word of guess) {
        const category = connections.categories.find(x => x.cards.some(y => y.content === word));
        if (!category) {
            return { invalid: `The word ${word} is not part of the puzzle, use a valid word.`, guess };
        }
        categories.push(category.title);
    }

    // find unique title counts and find the title with most occurences
    const uniqueCategories = [...new Set(categories)];
    let maxCategory = '';
    let maxCategoryCount = 0;
    for (const category of uniqueCategories) {
        const count = categories.filter(x => x === category).length;
        if (count > maxCategoryCount) {
            maxCategory = category;
            maxCategoryCount = count;
        }
    }
    if (maxCategoryCount === 4) {
        let remaining = []
        for (const category of connections.categories) {
            if (category.title !== maxCategory) {
                remaining = remaining.concat(category.cards.map(x => x.content));
            }
        }
        // shuffle
        remaining = remaining.sort(() => Math.random() - 0.5);
        return { correct: true, one_away: false, category: maxCategory, guess, remaining };
    } else if (maxCategoryCount === 3) {
        return { correct: false, one_away: true, category: null, guess };
    } else {
        return { correct: false, one_away: false, category: null, guess };
    }
}

// generates shareable of the format:
// Connections 
// Puzzle #412
// 🟩🟩🟩🟩
// 🟨🟨🟨🟨
// 🟦🟦🟦🟦
// 🟪🟪🟪🟪
export function generateConnectionsShareable(state, connections) {
    let shareable = 'Connections\n';
    shareable += `Puzzle ${connections.id} \n`;
    // give each category a color in order from green,orange through blue and purple:
    const colors = ['🟩', '🟨', '🟦', '🟪'];
    let category_to_color = {};
    for (const category of connections.categories) {
        category_to_color[category.title] = colors.shift();
    }

    for (const guesses of state.guesses) {
        for (const word of guesses.guess) {
            const category = connections.categories.find(x => x.cards.some(y => y.content === word));
            shareable += category_to_color[category.title];
        }
        shareable += '\n';
    }
    return shareable;
}

// parses a shereable and returns either null if it's not a connections shareable or json with:
// {
//    "id": 440,
//    "mistakes": 4
// }
export function parseConnectionsScoreFromShareable(message) {
    const lines = message.split('\n');
    if (lines.length < 4 || !lines[0].includes("Connections")) {
        return null;
    }
    const puzzleMatch = message.match(/#(\d+)/);
    if (!puzzleMatch) {
        return null;
    }
    const id = parseInt(puzzleMatch[1]);
    // now parse the board, just count the lines which have 4 emojis which aren't the same
    const emojiRegex = /\p{Emoji_Presentation}/gu;
    // find all emojis in the multiline string
    const allEmojis = [...message.matchAll(emojiRegex)].map(x => x[0]);
    if ((allEmojis.length % 4 !== 0) || allEmojis.length < 16) {
        return null;
    }

    let mistakes = 0;
    while (allEmojis.length >= 4) {
        let emojiRow = allEmojis.splice(0, 4);
        const uniqueEmojis = [...new Set(emojiRow)];
        if (uniqueEmojis.length !== 1) {
            mistakes++;
        }
    }

    return { id, mistakes };

}

