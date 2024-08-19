import stringWidth from "string-width";
import { AFINN } from "./sem.js";
import { Scores } from "./types/formatters.js";


export const FIRST_WORDLE_DATE = new Date('2021-06-19')
export const FIRST_CONNECTIONS_DATE = new Date('2023-06-12')

export function printDateToNYTGameId(printDate: string | Date, firstPrintDate: Date, starts_with_zero = false): number {
    const days = Math.round((+new Date(printDate) - +new Date(firstPrintDate)) / (1000 * 60 * 60 * 24));
    return starts_with_zero ? days : days + 1;
}


export function formatDateToYYYYMMDD(date: Date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0'); // Months are zero-based
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

export function stringPad(string: string, target_length: number, fill = ' ', align = 'left') {
    let padding_required = target_length - stringWidth(string);
    if (padding_required <= 0) {
        return string;
    }
    let left_padding = Math.floor(padding_required / 2);
    let right_padding = padding_required - left_padding;
    if (align == 'left') {
        right_padding = left_padding + right_padding;
        left_padding = 0;
    } else if (align == 'right') {
        left_padding = left_padding + right_padding;
        right_padding = 0;
    }

    return fill.repeat(left_padding) + string + fill.repeat(right_padding);
}
// pick random element in array
export function sample(arr: any[]) {
    if (arr.length) {
        return arr[Math.floor(Math.random() * arr.length)]
    } else {
        return null
    }
}

export function to_words(message: string) {
    return message.split(' ').map(word => word.replace(/[^a-zA-Z0-9]/g, '').trim().toLowerCase())
}

// returns integer corresponding to the sentiment in the given word list using the AFINN list of sentiment keyword pairs
// words must be normalised to lower case
export function calculate_sentiment(words: string[]) {
    if (words.length > 0) {
        console.log("Calculating sentiment for: " + words)
        let sentiment_carriers = words.map(w => AFINN[w]).filter(Boolean)
        if (sentiment_carriers.length == 0) { return 0 }
        return sentiment_carriers.reduce((a, b) => a + b, 0) / sentiment_carriers.length
    } else {
        return 0
    }
}

export function clone_score(score: Scores) {
    const new_scores = new Map();
    for (const [key, value] of score.entries()) {
        new_scores.set(key, new Map(value))
    }
    return new_scores
}