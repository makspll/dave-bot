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

export async function execute_or_throw<T>(callable: () => Promise<D1Result<Record<string, unknown>> | null>, type_resolver: typeVerifier<T> = isAny, allow_empty: boolean = true): Promise<T[]> {
    const result = await callable()
    let success = (result != undefined && result?.success && !result?.error) ?? false
    let empty = (result?.results.length == 0 || result == null) ?? false
    if (!success || (empty && !allow_empty)) {
        throw result?.error ?? "No results found"
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
    const result = await callable()
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

    await execute_or_throw_batch(() => db.batch([
        // insert the chat if it doesn't exist or update
        db.prepare("INSERT INTO chats (chat_id) VALUES (?) ON CONFLICT(chat_id) DO UPDATE SET alias = ?")
            .bind(chat.chat_id, chat.alias),
        // insert the user if it doesn't exist or update
        db.prepare("INSERT INTO users (user_id, alias, consent_date) VALUES (?, ?, ?) ON CONFLICT(user_id) DO UPDATE SET alias = ?, consent_date = ?")
            .bind(user.user_id, user.alias, user.consent_date, user.alias, user.consent_date),
        // insert the chat_user if it isn't already there
        db.prepare("INSERT INTO chat_users (chat_id, user_id) VALUES (?, ?) ON CONFLICT DO NOTHING")
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
