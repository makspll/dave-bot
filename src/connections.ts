import axios from 'axios';
import { formatDateToYYYYMMDD } from './utils.js';

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


export function isInvalidGuess(guess: Guess): guess is InvalidGuess {
    return (guess as InvalidGuess).invalid === undefined;
}

export function isValidGuess(guess: Guess): guess is ValidGuess {
    return (guess as ValidGuess).category !== undefined;
}
export function makeInvalidGuess(invalid: string, guess: ValidGuess): InvalidGuess {
    return { invalid, guess: guess.guess };
}

export function printDateToConnectionsNumber(printDate: string | Date): number {
    const days = Math.round((+new Date(printDate) - +new Date('2023-06-12')) / (1000 * 60 * 60 * 24));
    return days + 1;
}

export async function getConnectionsForDay(date: Date): Promise<ConnectionsResponse> {
    try {
        let response = await axios.get(`https://www.nytimes.com/svc/connections/v2/${formatDateToYYYYMMDD(date)}.json`);
        // calculate days between June 12, 2023 and the print date
        let data = response.data
        let newId = printDateToConnectionsNumber(data.print_date);
        data.id = newId
        return data;
    } catch (error) {
        console.error(error);
        throw new Error('Failed to fetch connections');
    }
}

export async function initializeConnectionsKnowledgeState(tiles: string[]): Promise<ConnectionsKnowledgeState> {
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
export function convertGuessToPrompt(guess: Guess | null) {
    let reason = ''
    if (!guess) {
        return generateInitialPrompt();
    } else if (isInvalidGuess(guess)) {
        reason = guess.invalid;
    } else if (isValidGuess(guess)) {
        if (guess.category) {
            let uncategorised = `Remaining words to categorise: '${guess.remaining ? guess.remaining.join(',') : 'UNKNOWN SEE PREVIOUS MESSAGE'}'`;
            reason = `Correct! Your guess belongs to the category: ${guess.category}. Now you must guess another 4 words from the remaining words which are connected: ${uncategorised}`;
        } else if (guess.one_away) {
            reason = `One away! One word is in the wrong category. You have one less attempt left.`;
        }
        else {
            reason = `Incorrect guess, at least two words are in the wrong category. You have one less attempt left.`;
        }
    }
    return `You guessed: '${guess.guess.join(',')}'.${reason} `;
}

export interface PlayerCallback {
    (state: ConnectionsKnowledgeState, invalid_guess: InvalidGuess | null): any
}

// solves connections using a callback function that takes the current state of the game and outputs the list of 4 words to guess
// the callback will receive a second argument corresponding to the last invalid guess, if the last guess was invalid
export async function solveConnections(date: Date, playerCallback: PlayerCallback): Promise<[ConnectionsKnowledgeState, ConnectionsResponse]> {
    let connections = await getConnectionsForDay(date);
    let all_tiles = connections.categories.flatMap(x => x.cards.map(y => y.content))
    // shuffle tiles
    all_tiles = all_tiles.sort(() => Math.random() - 0.5);
    let state = await initializeConnectionsKnowledgeState(all_tiles);

    while (state.attempts > 0) {
        // attempt to get valid input twice before failing
        let input_attempts = 0;
        let last_guess = guessCategory(await playerCallback(state, null), connections);

        while (isInvalidGuess(last_guess) && input_attempts < 3) {
            last_guess = guessCategory(await playerCallback(state, last_guess), connections);
            input_attempts++;
            if (isValidGuess(last_guess) && last_guess.category && last_guess.category in state.categorised) {
                last_guess = makeInvalidGuess(`the guess was already made, it was correct, it belongs to the category: ${last_guess.category}. You cannot guess the same category twice.`, last_guess);
            }
        }

        if (isValidGuess(last_guess)) {

            state.guesses.push(last_guess);
            if (last_guess.category) {
                let category_to_remove = last_guess.category
                let category = connections.categories.find(c => c.title == category_to_remove)
                if (!category) throw new Error('category not found in connections: ' + category_to_remove)
                let cards = category.cards.map(c => c.content)
                state.categorised[category_to_remove] = cards
                state.tiles = state.tiles.filter(t => !cards.includes(t))
            } else {
                state.attempts--;
            }

        } else {
            throw new Error('failed to get valid input from player');
        }
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
export function guessCategory(guess: string, connections: ConnectionsResponse): Guess {
    let words: string[] = []
    if (typeof (guess) === 'string') {
        words = guess.split(',').map(x => x.replace(/\W/g, '').trim());
    } else {
        words = []
    }

    if (words == null || words.length !== 4) {
        let invalid_guess: InvalidGuess = { invalid: "guess does not contain 4 comma separated words", guess: words };
        return invalid_guess;
    }

    let categories = []
    for (const word of words) {
        const category = connections.categories.find(x => x.cards.some(y => y.content === word));
        if (!category) {
            let invalid_guess: InvalidGuess = { invalid: `The word ${word} is not part of the puzzle, use a valid word.`, guess: words };
            return invalid_guess
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
        let remaining: string[] = []
        for (const category of connections.categories) {
            if (category.title !== maxCategory) {
                remaining = remaining.concat(category.cards.map(x => x.content));
            }
        }
        // shuffle
        remaining = remaining.sort(() => Math.random() - 0.5);
        let valid_guess: ValidGuess = { one_away: false, category: maxCategory, guess: words, remaining };
        return valid_guess;
    } else if (maxCategoryCount === 3) {
        let valid_guess: ValidGuess = { one_away: true, guess: words, category: null };
        return valid_guess;
    } else {
        let valid_guess: ValidGuess = { one_away: false, guess: words, category: null };
        return valid_guess;
    }
}

// generates shareable of the format:
// Connections 
// Puzzle #412
// 🟩🟩🟩🟩
// 🟨🟨🟨🟨
// 🟦🟦🟦🟦
// 🟪🟪🟪🟪
export function generateConnectionsShareable(state: ConnectionsKnowledgeState, connections: ConnectionsResponse) {
    let shareable = 'Connections\n';
    shareable += `Puzzle ${connections.id} \n`;
    // give each category a color in order from green,orange through blue and purple:
    const colors = ['🟩', '🟨', '🟦', '🟪'];
    let category_to_color = connections.categories.reduce(
        (acc: { [key: string]: string }, x, i) => { acc[x.title] = colors[i]; return acc; },
        {}
    );

    for (const guesses of state.guesses) {
        for (const word of guesses.guess) {
            const category = connections.categories.find(x => x.cards.some(y => y.content === word));
            if (!category) throw new Error('word not found in categories: ' + word);
            shareable += category_to_color[category.title];
        }
        shareable += '\n';
    }
    return shareable;
}


export function parseConnectionsScoreFromShareable(message: string): ParsedConnectionsShareable | null {
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

