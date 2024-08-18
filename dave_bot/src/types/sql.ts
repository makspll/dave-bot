//  Added in Migration number: 0001 
export interface User {
    user_id: number,
    alias?: string,
    consent_date: Date,
    bot: boolean
}

//  Added in Migration number: 0001 
export interface Chat {
    chat_id: number,
    alias?: string
}

export type GameType = "wordle" | "connections"

// Added in Migration number: 0002
export interface GameSubmission {
    game_id: number,
    game_type: GameType,
    user_id: number,
    submission: string,
    submission_date: Date
}

