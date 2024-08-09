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

    function isInvalidGuess(guess: Guess): guess is InvalidGuess {
        return (guess as InvalidGuess).invalid === undefined;
    }

    function isValidGuess(guess: Guess): guess is ValidGuess {
        return (guess as ValidGuess).category !== undefined;
    }
    function makeInvalidGuess(invalid: string, guess: ValidGuess): InvalidGuess {
        return { invalid, guess: guess.guess };
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

const _global = (window /* browser */ || global /* node */) as any

_global.isInvalidGuess = isInvalidGuess;
_global.isValidGuess = isValidGuess;
_global.makeInvalidGuess = makeInvalidGuess;

export { }