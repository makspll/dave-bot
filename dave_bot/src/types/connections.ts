export interface Guess {
    guess: string[];
}

export interface ValidGuess extends Guess {
    one_away: boolean;
    category: string | null | undefined;
    remaining?: string[];
}

export interface InvalidGuess extends Guess {
    invalid: string;
}

export interface ConnectionsKnowledgeState {
    categorised: { [key: string]: string[]; };
    tiles: string[];
    attempts: number;
    one_away: boolean | undefined;
    guesses: ValidGuess[];
}

export interface CategoryCards {
    title: string;
    cards: {
        content: string;
        position: number;
    }[];
}

export interface ConnectionsResponse {
    id: number;
    print_date: string;
    editor: string;
    categories: [
        CategoryCards,
        CategoryCards,
        CategoryCards,
        CategoryCards
    ];
}


export interface ParsedConnectionsShareable {
    id: number;
    mistakes: number;
}