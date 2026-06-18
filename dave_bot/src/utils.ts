import stringWidth from "string-width";
import { AFINN } from "./sem.js";
import { Scores } from "./types/formatters.js";
import { GameDescriptor, GameType } from "./types/sql.js";
import { isGameSubmission } from "./data/sql.js";
import { score_from_poople_shareable } from "./poople.js";
import { FIRST_POOPLE_DATE } from "./types/poople.js";
import { parse_social_score } from "./social_score.js";
import { score_from_wordle_shareable } from "./wordle.js";
import { parseConnectionsScoreFromShareable } from "./connections.js";
import { FIRST_ANTHROPEUM_DATE } from "./types/anthropeum.js";


export const FIRST_WORDLE_DATE = new Date('2021-06-19')
export const FIRST_CONNECTIONS_DATE = new Date('2023-06-12')

export function printDateToGameId(printDate: string | Date, firstPrintDate: Date, starts_with_zero = false): number {
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
    let new_scores = new Map();
    for (const [key, value] of score.entries()) {
        new_scores.set(key, new Map([...value]))
    }
    return new_scores
}

export function all_game_descriptors(): [GameType, GameDescriptor][] {
    return Object.entries(GAME_DESCRIPTORS) as [GameType, GameDescriptor][];
}

export const GAME_DESCRIPTORS: Record<GameType, GameDescriptor> = {
    connections: {
        first_id_fn: (date) => printDateToGameId(date, FIRST_CONNECTIONS_DATE),
        score_function: (s) => parseConnectionsScoreFromShareable(s)!.mistakes,
        use_tiers: false,
        low_is_good: true,
        low_emoji: '❌',
        use_sum: false,
        regex: /^Connections\nPuzzle #(?<game_id>[\d,.]+)/,
    },

    wordle: {
        first_id_fn: (date) => printDateToGameId(date, FIRST_WORDLE_DATE, true),
        score_function: (s) => score_from_wordle_shareable(s).guesses,
        use_tiers: false,
        low_is_good: true,
        low_emoji: '🟨',
        use_sum: false,
        regex: /^Wordle (?<game_id>[\d,\.]+) (?<game_score>[\dX]+\/\d+)(?<hard_mode>\*?)/
    },

    autism_test: {
        first_id_fn: (_) => 0,
        score_function: (s) => parseInt(s.split(":")[1].trim()),
        use_tiers: false,
        low_is_good: false,
        low_emoji: '🧩',
        use_sum: false,
        regex: /^Autism Test: (?<game_score>\d+)/,
        regex_to_id: (r) => 0,
    },

    social_score: {
        first_id_fn: (_) => 0,
        score_function: (s) => parse_social_score(s)?.score ?? 0,
        use_tiers: false,
        low_is_good: false,
        low_emoji: '📈',
        use_sum: true,
    },

    poople: {
        first_id_fn: (date) => printDateToGameId(date, FIRST_POOPLE_DATE, true),
        score_function: (s) => score_from_poople_shareable(s).score,
        use_tiers: false,
        low_is_good: true,
        low_emoji: '💩',
        use_sum: false,
        regex: /^Poople #(?<game_id>\d+) (?<game_score>\d+)\/(?<game_maximum>\d+)/
    },
    anthropeum: {
    first_id_fn: (date) => printDateToGameId(date, FIRST_ANTHROPEUM_DATE, true),
    score_function: (submission) => parse_anthropeum_score(submission),
    regex_to_id: (match) => anthropeum_date_to_id(match),
    use_tiers: false,
    low_is_good: false,
    low_emoji: '🧠',
    use_sum: false,
    regex: /^Anthropeum\.com · (?<game_date>(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec) \d{1,2} \d{4})\n.*\n(?<game_score>[\d\s\u00A0]+)\s·\s/
}
};

export function parse_anthropeum_score(s: string): number {
    const match = s.match(
        GAME_DESCRIPTORS.anthropeum.regex!
    );

    if (!match?.groups?.game_score) {
        throw new Error(`Invalid Anthropeum score: ${s}`);
    }

    return parseInt(
        match.groups.game_score.replace(/\s/g, ""),
        10
    );
}

export function anthropeum_date_to_id(match: RegExpMatchArray): number {
    const dateStr = match.groups?.game_date;

    if (!dateStr) {
        throw new Error("Missing Anthropeum game date");
    }

    const parsed = new Date(Date.parse(dateStr.trim()));

    if (isNaN(parsed.getTime())) {
        return 0;
    }

    return printDateToGameId(
        parsed,
        FIRST_ANTHROPEUM_DATE,
        true
    );
}