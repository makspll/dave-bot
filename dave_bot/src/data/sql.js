"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.QueryBatch = exports.Query = void 0;
exports.isUser = isUser;
exports.isAny = isAny;
exports.isChat = isChat;
exports.isGameSubmission = isGameSubmission;
exports.isGameType = isGameType;
exports.get_bot_users_for_chat = get_bot_users_for_chat;
exports.get_user_chats = get_user_chats;
exports.register_consenting_user_and_chat = register_consenting_user_and_chat;
exports.get_chat = get_chat;
exports.unregister_user = unregister_user;
exports.insert_game_submission = insert_game_submission;
exports.get_game_submissions_since_game_id = get_game_submissions_since_game_id;
exports.get_game_submission = get_game_submission;
function isUser(obj) {
    return typeof obj.user_id === 'number' && typeof obj.alias === 'string' && obj.consent_date instanceof Date &&
        obj.user_id != undefined && obj.consent_date != undefined;
}
// identity function for when you don't care
function isAny(obj) {
    return true;
}
function isChat(obj) {
    return typeof obj.chat_id === 'number' && typeof obj.alias === 'string' &&
        obj.chat_id != undefined;
}
function isGameSubmission(obj) {
    return typeof obj.game_id === 'number' && typeof obj.game_type === 'string' && typeof obj.user_id === 'number' && typeof obj.submission === 'string' && obj.submission_date instanceof Date && typeof obj.bot_entry === 'boolean' &&
        obj.game_id != undefined && obj.game_type != undefined && obj.user_id != undefined && obj.submission != undefined && obj.submission_date != undefined && obj.bot_entry != undefined;
}
function isGameType(obj) {
    return obj == "wordle" || obj == "connections";
}
class DBException extends Error {
    constructor(message) {
        super(message);
        this.name = "DBException";
    }
}
/**
 * Stores a query and its arguments
 */
class Query {
    constructor(query, ...args) {
        this.args = [];
        this.query = query;
        this.args = args;
    }
    toString() {
        return `${this.query}; with arguments: ${this.args}`;
    }
    /**
     * Unwraps a D1Result into a list of results or throws an error if the result was not successful
     */
    static unwrapD1Result(result) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            if (!result.success || result.error) {
                throw (_a = result.error) !== null && _a !== void 0 ? _a : `Error when executing query`;
            }
            return result.results;
        });
    }
    getBound(db) {
        try {
            return db.prepare(this.query).bind(...this.args);
        }
        catch (e) {
            console.error(`Error in query`, this.query, this.args, e);
            throw new DBException(`Error in query '${this}': '${e}'`);
        }
    }
    getMany(db) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const result = yield this.getBound(db).all();
                return Query.unwrapD1Result(result);
            }
            catch (e) {
                console.error(`Error in query`, this.query, this.args, e);
                throw new DBException(`Error in query '${this}': '${e}'`);
            }
        });
    }
    getFirst(db) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                let results = yield this.getMany(db);
                if (results.length == 0) {
                    return null;
                }
                else {
                    return results[0];
                }
            }
            catch (e) {
                console.error(`Error in query`, this.query, this.args, e);
                throw new DBException(`Error in query '${this}': '${e}'`);
            }
        });
    }
    run(db) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                yield this.getBound(db).run();
            }
            catch (e) {
                console.error(`Error in query`, this.query, this.args, e);
                throw new DBException(`Error in query '${this}': '${e}'`);
            }
        });
    }
}
exports.Query = Query;
/**
 * Stores a batch of queries to be executed in order
 */
class QueryBatch {
    constructor(...queries) {
        this.queries = queries;
    }
    toString() {
        return this.queries.map(q => q.toString()).join(";\n");
    }
    execute(db) {
        return __awaiter(this, void 0, void 0, function* () {
            const result = yield db.batch(this.queries.map(x => x.getBound(db)));
            result.forEach(res => {
                Query.unwrapD1Result(res);
            });
        });
    }
}
exports.QueryBatch = QueryBatch;
/// Get all consenting users for a chat
function get_bot_users_for_chat(db, chat_id) {
    return __awaiter(this, void 0, void 0, function* () {
        return yield new Query(`
        SELECT * FROM users 
        JOIN chat_users ON users.user_id = chat_users.user_id 
        WHERE chat_users.chat_id = ?
        `, chat_id).getMany(db);
    });
}
function get_user_chats(db, user_id) {
    return __awaiter(this, void 0, void 0, function* () {
        return yield new Query(`
        SELECT * FROM chats 
        JOIN chat_users ON chats.chat_id = chat_users.chat_id 
        WHERE chat_users.user_id = ?
        `, user_id).getMany(db);
    });
}
/// Add a user and their chat to the db.
/// If the user already exists, update their alias and consent date.
function register_consenting_user_and_chat(db, user, chat) {
    return __awaiter(this, void 0, void 0, function* () {
        console.log(`Registering user ${user.user_id} with alias ${user.alias} and chat ${chat.chat_id} with alias ${chat.alias}. Consent date: ${user.consent_date.toISOString()}`);
        return yield new QueryBatch(new Query(`
            INSERT INTO chats (chat_id, alias) VALUES (?, ?) ON CONFLICT DO UPDATE SET alias = ?
        `, chat.chat_id, chat.alias, chat.alias), new Query(`
            INSERT INTO users (user_id, alias, consent_date, bot) VALUES (?, ?, ?, ?) ON CONFLICT DO UPDATE SET alias = ?, consent_date = ?
        `, user.user_id, user.alias, user.consent_date.toISOString(), user.bot, user.alias, user.consent_date.toISOString()), new Query(`
            INSERT INTO chat_users (chat_id, user_id) VALUES (?, ?) ON CONFLICT DO NOTHING
        `, chat.chat_id, user.user_id)).execute(db);
    });
}
// Get a chat by its id
function get_chat(db, chat_id) {
    return __awaiter(this, void 0, void 0, function* () {
        return yield new Query(`
        SELECT * FROM chats WHERE chat_id = ?
        `, chat_id).getFirst(db);
    });
}
/// Delete a user by id and all referencing tables
function unregister_user(db, user) {
    return __awaiter(this, void 0, void 0, function* () {
        return yield new Query(`
        DELETE FROM users WHERE user_id = ?
        `, user.user_id).run(db);
    });
}
/// inserts or updates a game submission
function insert_game_submission(db, submission) {
    return __awaiter(this, void 0, void 0, function* () {
        return yield new Query(`
        INSERT INTO game_submissions (game_id, game_type, user_id, submission, submission_date) 
        VALUES (?, ?, ?, ?, ?) 
        ON CONFLICT DO UPDATE 
        SET submission = ?, submission_date = ?
        `, submission.game_id, submission.game_type, submission.user_id, submission.submission, submission.submission_date.toISOString(), submission.submission, submission.submission_date.toISOString()).run(db);
    });
}
function get_game_submissions_since_game_id(db_1, game_id_1, game_type_1, chat_id_1) {
    return __awaiter(this, arguments, void 0, function* (db, game_id, game_type, chat_id, last_game_id = undefined) {
        let last_id_filter = last_game_id === undefined ? "" : "AND gs.game_id <= ?";
        let args = [game_id, game_type, chat_id];
        if (last_game_id !== undefined) {
            args.push(last_game_id);
        }
        return yield new Query(`
        SELECT gs.*
        FROM game_submissions gs
        JOIN chat_users cu ON gs.user_id = cu.user_id
        WHERE gs.game_id >= ? AND gs.game_type = ? AND cu.chat_id = ? ${last_id_filter}
        `, ...args).getMany(db);
    });
}
function get_game_submission(db, game_id, game_type, user_id) {
    return __awaiter(this, void 0, void 0, function* () {
        return yield new Query(`
        SELECT * FROM game_submissions WHERE game_id = ? AND game_type = ? AND user_id = ?
        `, game_id, game_type, user_id).getFirst(db);
    });
}
