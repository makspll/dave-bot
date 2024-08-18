declare global {
    interface Guess {
        guess: string[];
    }

    interface ValidGuess extends Guess {
        one_away: boolean;
        category: string | null | undefined;
        remaining?: string[];
    }

    interface InvalidGuess extends Guess {
        invalid: string;
    }

    interface ConnectionsKnowledgeState {
        categorised: { [key: string]: string[]; };
        tiles: string[];
        attempts: number;
        one_away: boolean | undefined;
        guesses: ValidGuess[];
    }

    interface CategoryCards {
        title: string;
        cards: {
            content: string;
            position: number;
        }[];
    }

    interface ConnectionsResponse {
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


    interface ParsedConnectionsShareable {
        id: number;
        mistakes: number;
    }
}


export { }