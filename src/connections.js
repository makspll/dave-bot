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

export async function getConnectionsForDay(date) {
    try {
        const response = await axios.get(`https://www.nytimes.com/svc/connections/v2/${formatDateToYYYYMMDD(date)}.json`);
        return response.data;
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
    return 'I will have you play the game of connections, I will present you with 16 items, each one belongs to one of 4 groups with a certain theme, the theme could be for example "items that you put in an oven". Your goal is to figure out which groups those are one guess at a time. Each time you guess you can choose 4 cards, you get to make 4 mistakes, I will let you know if your guess is only one tile away from correct. You must respond with only a comma separated list of 4 tiles each time AND NOTHING ELSE. I will present you with the state of the game and you must continue the game from that point regardless if its the first turn, DO NOT ANSWER WITH ANYTHING OTHER THAN 4 COMMA SEPARATED WORDS: ';
}

export function convertStateToPrompt(state) {
    let prompt = 'Remaining uncategorised tiles:\n';
    for (const tile of state.tiles) {
        prompt += `- ${tile}\n`;
    }
    prompt += 'Categorised tiles:\n';
    for (const [key, value] of Object.entries(state.categorised)) {
        prompt += `${key}: ${value.join(', ')}\n`;
    }
    if (state.one_away) {
        prompt += 'Your last guess was one away from correct!\n';
    }
    prompt += `Attempts remaining: ${state.attempts}\n`;
    return prompt;
}

// solves connections using a callback function that takes the current state of the game and outputs the list of 4 words to guess
export async function solveConnections(date, playerCallback) {
    let connections = await getConnectionsForDay(date);
    console.log("connections: ", connections);
    let all_tiles = connections.categories.flatMap(x => x.cards.map(y => y.content))
    // shuffle tiles
    all_tiles = all_tiles.sort(() => Math.random() - 0.5);
    let state = await initializeConnectionsKnowledgeState(all_tiles);

    while (state.attempts > 0) {
        let words = await playerCallback(state);
        console.log(`#Attempts: ${state.attempts + 1}, Guessing: `, words);
        words = words.split(',')
        let categories = []
        for (const word of words) {
            const category = connections.categories.find(x => x.cards.some(y => y.content === word));
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
            // update state
            state.categorised[maxCategory] = words;
            state.tiles = state.tiles.filter(x => !words.includes(x));
            state.one_away = undefined
        } else if (maxCategoryCount === 3) {
            // update state
            state.one_away = true;
            state.attempts--;
        } else {
            state.attempts--;
        }
        state.guesses.push(words);
    }

    return [state, connections];
}

// generates shareable of the format:
//Connections 
//Puzzle #412
//🟩🟩🟩🟩
//🟨🟨🟨🟨
//🟦🟦🟦🟦
//🟪🟪🟪🟪
export function generateConnectionsShareable(state, connections) {
    let shareable = 'Connections\n';
    shareable += `Puzzle #${connections.id}\n`;
    // give each category a color in order from green,orange through blue and purple:
    const colors = ['🟩', '🟨', '🟦', '🟪'];
    let category_to_color = {};
    for (const category of connections.categories) {
        category_to_color[category.title] = colors.shift();
    }

    for (const guesses of state.guesses) {
        for (const word of guesses) {
            const category = connections.categories.find(x => x.cards.some(y => y.content === word));
            shareable += category_to_color[category.title];
        }
        shareable += '\n';
    }
    return shareable;
}

