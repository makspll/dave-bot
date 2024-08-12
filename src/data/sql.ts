import { D1Database, D1Result } from "@cloudflare/workers-types"
type typeVerifier<T> = (obj: any) => obj is T

export function isUser(obj: any): obj is User {
    return typeof obj.user_id === 'number' && typeof obj.alias === 'string' && obj.consent_date instanceof Date &&
        obj.user_id != undefined && obj.consent_date != undefined;
}

// identity function for when you don't care
export function isAny(obj: any): obj is any {
    return true;
}

export function isChat(obj: any): obj is Chat {
    return typeof obj.chat_id === 'number' && typeof obj.alias === 'string' &&
        obj.chat_id != undefined;
}

export function isGameSubmission(obj: any): obj is GameSubmission {
    return typeof obj.game_id === 'number' && typeof obj.game_type === 'string' && typeof obj.user_id === 'number' && typeof obj.submission === 'string' && obj.submission_date instanceof Date && typeof obj.bot_entry === 'boolean' &&
        obj.game_id != undefined && obj.game_type != undefined && obj.user_id != undefined && obj.submission != undefined && obj.submission_date != undefined && obj.bot_entry != undefined;
}

export function isGameType(obj: any): obj is GameType {
    return obj == "wordle" || obj == "connections"
}

export async function execute_or_throw<T>(callable: () => Promise<D1Result<Record<string, unknown>> | null>, type_resolver: typeVerifier<T> = isAny, allow_empty: boolean = true): Promise<T[]> {
    let result: D1Result<Record<string, unknown>> | null;
    try {
        result = await callable()
    } catch (e: any) {
        console.error(`Error when executing statement: ${e.message}`)
        throw e
    }
    console.log(result)

    let success = result == null || (result.success && !result.error)
    let empty = (result == null || result?.results.length == 0) ?? false
    if (!success) {
        console.error(`Error when executing statement: ${result?.error}`)
        throw result?.error ?? "DB execution failed"
    } else if (empty && !allow_empty) {
        console.error(`Results were empty when executing statement: ${result}, expected at least one result with type resolver: ${type_resolver.name}`)
        throw result?.error ?? "Expected a result when executing sql operation but got none"
    }

    let non_null = result?.results ?? []

    for (const row of non_null) {
        if (!type_resolver(row)) {
            throw `Error when mapping row: '${JSON.stringify(row)}' with resolver: '${type_resolver.name}'`
        }
    }

    return non_null as T[]
}

export async function execute_or_throw_batch(callable: () => Promise<D1Result<Record<string, unknown>>[]>): Promise<void> {

    let result
    try {
        result = await callable()
    } catch (e: any) {
        console.error(`Error when executing batch statement: ${e.message}`)
        throw e
    }

    for (const res of result) {
        let success = (res != undefined && res?.success && !res?.error) ?? false
        if (!success) {
            throw res?.error ?? "Could not execute batch statement"
        }
    }
}

/// Get all consenting users for a chat
export async function get_bot_users_for_chat(db: D1Database, chat_id: number): Promise<User[]> {
    // join the users table with the chat_users table to get all users for a chat
    return await execute_or_throw(() =>
        db.prepare("SELECT * FROM users JOIN chat_users ON users.user_id = chat_users.user_id WHERE chat_users.chat_id = ?")
            .bind(chat_id)
            .first(),
        isUser
    )
}

/// Add a user and their chat to the db.
/// If the user already exists, update their alias and consent date.
export async function register_consenting_user_and_chat(db: D1Database, user: User, chat: Chat): Promise<void> {

    console.log(`Registering user ${user.user_id} with alias ${user.alias} and chat ${chat.chat_id} with alias ${chat.alias}. Consent date: ${user.consent_date.toISOString()}`)
    await execute_or_throw_batch(() => db.batch([
        // insert the chat if it doesn't exist or update
        db.prepare("INSERT INTO chats (chat_id, alias) VALUES (?, ?) ON CONFLICT DO UPDATE SET alias = ?")
            .bind(chat.chat_id, chat.alias, chat.alias),
        // insert the user if it doesn't exist or update
        db.prepare("INSERT INTO users (user_id, alias, consent_date) VALUES (?, ?, ?) ON CONFLICT DO UPDATE SET alias = ?, consent_date = ?")
            .bind(user.user_id, user.alias, user.consent_date.toISOString(), user.alias, user.consent_date.toISOString()),
        // insert the chat_user if it isn't already there
        db.prepare("INSERT INTO chat_users (chat_id, user_id) VALUES (?, ?) ON CONFLICT DO NOTHING")
            .bind(chat.chat_id, user.user_id)
    ]))
}

// Get a chat by its id
export async function get_chat(db: D1Database, chat_id: number): Promise<Chat | undefined> {
    const chats = await execute_or_throw(() =>
        db.prepare("SELECT * FROM chats WHERE chat_id = ?")
            .bind(chat_id)
            .first(),
        isChat
    )

    return chats[0]
}

/// Delete a user by id and all referencing tables
export async function unregister_user(db: D1Database, user: User): Promise<void> {
    await execute_or_throw(() =>
        db.prepare("DELETE FROM users WHERE user_id = ?")
            .bind(user.user_id)
            .run()
    )
}

/// inserts or updates a game submission
export async function insert_game_submission(db: D1Database, submission: GameSubmission): Promise<void> {
    await execute_or_throw(() =>
        db.prepare("INSERT INTO game_submissions (game_id, game_type, user_id, submission, submission_date, bot_entry) VALUES (?, ?, ?, ?, ?, ?) ON CONFLICT DO UPDATE SET submission = ?, submission_date = ?, bot_entry = ?")
            .bind(submission.game_id, submission.game_type, submission.user_id, submission.submission, submission.submission_date.toISOString(), submission.bot_entry,
                submission.submission, submission.submission_date.toISOString(), submission.bot_entry)
            .run()
    )
}


export async function get_game_submissions_since_game_id(db: D1Database, game_id: number, game_type: GameType, chat_id: number): Promise<GameSubmission[]> {
    return await execute_or_throw(() =>
        db.prepare(`
            SELECT gs.*
            FROM game_submissions gs
            JOIN chat_users cu ON gs.user_id = cu.user_id
            WHERE gs.game_id >= ? AND gs.game_type = ? AND cu.chat_id = ?
        `)
            .bind(game_id, game_type, chat_id)
            .all(),
        isGameSubmission
    )
}