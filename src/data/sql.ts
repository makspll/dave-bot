import { D1Database, D1Result } from "@cloudflare/workers-types"
import { resourceLimits } from "node:worker_threads";
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


class DBException extends Error {
    constructor(message: string) {
        super(message)
        this.name = "DBException"
    }
}

/**
 * Stores a query and its arguments
 */
export class Query<T> {
    public query: string;
    public args: any[] = [];

    constructor(query: string, ...args: any[]) {
        this.query = query;
        this.args = args;
    }

    public toString() {
        return `${this.query}; with arguments: ${this.args}`
    }

    /**
     * Unwraps a D1Result into a list of results or throws an error if the result was not successful
     */
    public static async unwrapD1Result<T>(result: D1Result<T>): Promise<T[]> {
        if (!result.success || result.error) {
            throw result.error ?? `Error when executing query`
        }
        return result.results
    }


    public getBound(db: D1Database): D1PreparedStatement {
        try {
            return db.prepare(this.query).bind(...this.args);
        } catch (e) {
            console.error(`Error in query`, this.query, this.args, e)
            throw new DBException(`Error in query '${this}': '${e}'`)
        }
    }

    public async getMany(db: D1Database): Promise<T[]> {
        try {
            const result = await this.getBound(db).all<T>()
            return Query.unwrapD1Result(result)
        } catch (e) {
            console.error(`Error in query`, this.query, this.args, e)
            throw new DBException(`Error in query '${this}': '${e}'`)
        }
    }

    public async getFirst(db: D1Database): Promise<T | null> {
        try {
            let results = await this.getMany(db)

            if (results.length == 0) {
                return null
            } else {
                return results[0]
            }
        } catch (e) {
            console.error(`Error in query`, this.query, this.args, e)
            throw new DBException(`Error in query '${this}': '${e}'`)
        }
    }

    public async run(db: D1Database): Promise<void> {
        try {
            await this.getBound(db).run()
        } catch (e) {
            console.error(`Error in query`, this.query, this.args, e)
            throw new DBException(`Error in query '${this}': '${e}'`)
        }
    }
}

type Tuple<TItem, TLength extends number> = [TItem, ...TItem[]] & { length: TLength };

/**
 * Stores a batch of queries to be executed in order
 */
export class QueryBatch {
    public queries: Query<any>[]

    constructor(...queries: Query<any>[]) {
        this.queries = queries
    }


    public toString() {
        return this.queries.map(q => q.toString()).join(";\n")
    }

    public async execute(db: D1Database): Promise<void> {
        const result = await db.batch(this.queries.map(x => x.getBound(db)))
        result.forEach(res => {
            Query.unwrapD1Result<any>(res)
        })
    }
}

/// Get all consenting users for a chat
export async function get_bot_users_for_chat(db: D1Database, chat_id: number): Promise<User[]> {
    return await new Query<User>(`
        SELECT * FROM users 
        JOIN chat_users ON users.user_id = chat_users.user_id 
        WHERE chat_users.chat_id = ?
        `, chat_id).getMany(db)
}

export async function get_user_chats(db: D1Database, user_id: number): Promise<Chat[]> {
    return await new Query<Chat>(`
        SELECT * FROM chats 
        JOIN chat_users ON chats.chat_id = chat_users.chat_id 
        WHERE chat_users.user_id = ?
        `, user_id).getMany(db)
}



/// Add a user and their chat to the db.
/// If the user already exists, update their alias and consent date.
export async function register_consenting_user_and_chat(db: D1Database, user: User, chat: Chat): Promise<void> {
    console.log(`Registering user ${user.user_id} with alias ${user.alias} and chat ${chat.chat_id} with alias ${chat.alias}. Consent date: ${user.consent_date.toISOString()}`)
    return await new QueryBatch(
        new Query(`
            INSERT INTO chats (chat_id, alias) VALUES (?, ?) ON CONFLICT DO UPDATE SET alias = ?
        `, chat.chat_id, chat.alias, chat.alias),
        new Query(`
            INSERT INTO users (user_id, alias, consent_date, bot) VALUES (?, ?, ?, ?) ON CONFLICT DO UPDATE SET alias = ?, consent_date = ?
        `, user.user_id, user.alias, user.consent_date.toISOString(), user.bot, user.alias, user.consent_date.toISOString()),
        new Query(`
            INSERT INTO chat_users (chat_id, user_id) VALUES (?, ?) ON CONFLICT DO NOTHING
        `, chat.chat_id, user.user_id)
    ).execute(db)
}

// Get a chat by its id
export async function get_chat(db: D1Database, chat_id: number): Promise<Chat | null> {
    return await new Query<Chat>(`
        SELECT * FROM chats WHERE chat_id = ?
        `, chat_id).getFirst(db)
}

/// Delete a user by id and all referencing tables
export async function unregister_user(db: D1Database, user: User): Promise<void> {
    return await new Query<Chat>(`
        DELETE FROM users WHERE user_id = ?
        `, user.user_id).run(db)
}

/// inserts or updates a game submission
export async function insert_game_submission(db: D1Database, submission: GameSubmission): Promise<void> {
    return await new Query(`
        INSERT INTO game_submissions (game_id, game_type, user_id, submission, submission_date) 
        VALUES (?, ?, ?, ?, ?) 
        ON CONFLICT DO UPDATE 
        SET submission = ?, submission_date = ?
        `, submission.game_id, submission.game_type, submission.user_id, submission.submission, submission.submission_date.toISOString(),
        submission.submission, submission.submission_date.toISOString()).run(db)
}


export async function get_game_submissions_since_game_id(db: D1Database, game_id: number, game_type: GameType, chat_id: number, last_game_id: number | undefined = undefined): Promise<GameSubmission[]> {
    let last_id_filter = last_game_id === undefined ? "" : "AND gs.game_id > ?"
    let args = [game_id, game_type, chat_id]
    if (last_game_id !== undefined) {
        args.push(last_game_id)
    }
    return await new Query<GameSubmission>(`
        SELECT gs.*
        FROM game_submissions gs
        JOIN chat_users cu ON gs.user_id = cu.user_id
        WHERE gs.game_id >= ? AND gs.game_type = ? AND cu.chat_id = ? ${last_id_filter}
        `, ...args).getMany(db)
}

export async function get_game_submission(db: D1Database, game_id: number, game_type: GameType, user_id: number): Promise<GameSubmission | null> {
    return await new Query<GameSubmission>(`
        SELECT * FROM game_submissions WHERE game_id = ? AND game_type = ? AND user_id = ?
        `, game_id, game_type, user_id).getFirst(db)
}