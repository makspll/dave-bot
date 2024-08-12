declare global {
    //  Added in Migration number: 0001 
    interface User {
        user_id: number,
        alias?: string,
        consent_date: Date,
    }

    //  Added in Migration number: 0001 
    interface Chat {
        chat_id: number,
        alias?: string
    }

    type GameType = "wordle" | "connections"

    // Added in Migration number: 0002
    interface GameSubmission {
        game_id: number,
        game_type: GameType,
        user_id: number,
        submission: string,
        submission_date: Date,
        bot_entry: boolean
    }
}

export { }

