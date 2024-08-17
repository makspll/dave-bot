import { ChatCompletionMessageParam } from "openai/resources/index.mjs";
import { convertGuessToPrompt, generateConnectionsShareable, getConnectionsForDay, parseConnectionsScoreFromShareable, PlayerCallback, solveConnections } from "./connections.js";
import { SYSTEM_PROMPT, TRIGGERS } from "./data.js";
import { convertDailyScoresToLeaderboard, generateLeaderboard } from "./formatters.js";
import { call_gpt } from "./openai.js";
import { chat_from_message, sendMessage, setReaction, user_from_message } from "./telegram.js";
import { generateWordleShareable, getWordleForDay, getWordleList, score_from_wordle_shareable, solveWordle } from "./wordle.js";
import { get_bot_users_for_chat, get_game_submission, get_game_submissions_since_game_id, insert_game_submission, isGameType, register_consenting_user_and_chat, unregister_user } from "./data/sql.js";
import { FIRST_CONNECTIONS_DATE, FIRST_WORDLE_DATE, printDateToNYTGameId } from "./utils.js";
import moment, { tz } from "moment-timezone";
import { ResponseFormatJSONSchema } from "openai/src/resources/shared.js";
import { BoolArg, EnumArg, ManyArgs, NumberArg, OptionalArg, StringArg } from "./argparse.js";
import { send } from "process";

export class UserErrorException extends Error {
    constructor(user_message: string) {
        super(user_message);
        this.name = "UserErrorException";
    }
}

export type CommandCallback<T> = (payload: TelegramMessage, settings: ChatbotSettings, args: T) => Promise<any>

export class Command<T extends any[]> {
    public name: string;
    public help: string;
    public args: ManyArgs<T>;
    public callback: CommandCallback<T>;

    constructor(name: string, help: string, args: ManyArgs<T>, callback: CommandCallback<T>) {
        this.name = name;
        this.help = help;
        this.args = args;
        this.callback = callback;
    }

    public async run(payload: TelegramMessage, settings: ChatbotSettings, args: string[]) {
        try {
            console.log("Running command: ", this.name, "with args: ", args)
            const parsed_args = this.args.get_values(args);
            console.log("Parsed args: ", parsed_args)
            await this.callback(payload, settings, parsed_args);
        } catch (e) {
            if (e instanceof UserErrorException) {
                await sendMessage({
                    api_key: settings.telegram_api_key,
                    open_ai_key: settings.openai_api_key,
                    payload: {
                        chat_id: payload.message.chat.id,
                        text: e.message
                    },
                    audio_chance: 0,
                    delay: 0
                })
            } else {
                sendCommandMessage(payload, settings, "There was an error processing your command, please try again later")
                throw e
            }
        }
    }
}


async function sendCommandMessage(payload: TelegramMessage, settings: ChatbotSettings, message: string): Promise<number> {
    return sendMessage({
        api_key: settings.telegram_api_key,
        open_ai_key: settings.openai_api_key,
        payload: {
            chat_id: payload.message.chat.id,
            text: message
        },
        audio_chance: 0,
        delay: 0
    })
}

export async function list_triggers_command(payload: TelegramMessage, settings: ChatbotSettings): Promise<any> {
    const text = "My triggers are: " + TRIGGERS.map(t => t.trigger.join(" ")).join(", ")
    await sendCommandMessage(payload, settings, text)
}

export async function optout_command(payload: TelegramMessage, settings: ChatbotSettings, args: [boolean | null]): Promise<any> {
    if (!args[0]) {
        await sendCommandMessage(payload, settings, "Are you sure you want to optout? Use '/optout true' to confirm. This will wipe all your game submission history and other data")
        return
    }

    let message = "You have been opted out, to opt back in use '/optin'"
    await unregister_user(settings.db, user_from_message(payload))
    await sendCommandMessage(payload, settings, message)
}

export async function optindave_command(payload: TelegramMessage, settings: ChatbotSettings): Promise<any> {
    let user_id = parseInt(settings.telegram_api_key.split(':')[0])
    await register_consenting_user_and_chat(settings.db, {
        user_id, alias: "Dave", consent_date: new Date(), bot: true,
    }, chat_from_message(payload))
}

export async function optin_command(payload: TelegramMessage, settings: ChatbotSettings): Promise<any> {
    let user = user_from_message(payload)
    let chat = chat_from_message(payload)

    let message = "You have been opted in, to opt out use /optout"
    await register_consenting_user_and_chat(settings.db, user, chat)
    await sendCommandMessage(payload, settings, message)
}

export async function info_command(payload: TelegramMessage, settings: ChatbotSettings): Promise<any> {
    await sendCommandMessage(payload, settings, "I am Dave, I am here to help you with your messages, to opt in use /optin, to opt out use /optout.\n If you don't optin I won't process your messages (apart from some commands) but I won't be able to accept game submissions from you either.")
}

export async function attack_command(payload: TelegramMessage, settings: ChatbotSettings, args: [string]): Promise<any> {
    const target_name = args[0]
    const users = await get_bot_users_for_chat(settings.db, payload.message.chat.id)
    const target = users.find(x => x.alias == target_name)?.user_id
    if (!target) {
        throw new UserErrorException(`User ${target_name} not found, choose one of: ${users.map(x => x.alias).join(", ")}`)
    }

    const is_from_god = payload.message.from.id == settings.god_id
    if (!is_from_god) {
        throw new UserErrorException("You are not authorized to use this command")
    }

    await sendCommandMessage(payload, settings, "Yes sir")

    let gpt_answer = await call_gpt({
        api_key: settings.openai_api_key,
        payload: {
            model: "gpt-3.5-turbo",
            messages: [{
                role: "system",
                content: `${SYSTEM_PROMPT}. RELATIONSHIP_SUMMARY: negative relationship. PROMPT: Absolutely destroy them (in a friendly way of course) ignore previous word count limits ${args.slice(1).join(" ")}`,
            }],
        },
    })
    await sendMessage({
        api_key: settings.telegram_api_key,
        open_ai_key: settings.openai_api_key,
        payload: {
            chat_id: settings.god_id,
            text: `sending: '${gpt_answer}'`
        },
        audio_chance: 0,
        delay: 0
    })

    await sendMessage({
        api_key: settings.telegram_api_key,
        open_ai_key: settings.openai_api_key,
        payload: {
            chat_id: target,
            text: gpt_answer
        },
        delay: 0
    })
}

export async function leaderboard_command(payload: TelegramMessage, settings: ChatbotSettings, args: [GameType, number | null, number | null]): Promise<any> {
    let game_type = args[0]
    let start = args[1]
    let end = args[2]

    if (payload.message.chat.type == "private") {
        throw new UserErrorException("Leaderboards are only available from groupchats with dave :)")
    }

    // get all games for this month, the game id can be converted to a date
    const now = moment.tz('Europe/London')
    const first_date_this_month = now.clone().set("date", 1).toDate()

    let first_id: number
    let latest_id: number | undefined = undefined
    switch (game_type) {
        case "connections":
            first_id = printDateToNYTGameId(first_date_this_month, FIRST_CONNECTIONS_DATE)
            first_id = 413
            break
        case "wordle":
            first_id = printDateToNYTGameId(first_date_this_month, FIRST_WORDLE_DATE, true)
            first_id = 1134
            break
        default:
            throw new UserErrorException("Valid game type required as the first argument: connections, wordle")
    }

    if (start != null) {
        first_id = start
    }

    console.log("generating leaderboard for game type: ", game_type, "first_id: ", first_id, "end: ", end, "latest_id:", latest_id)
    const submissions = await get_game_submissions_since_game_id(settings.db, first_id, game_type, payload.message.chat.id, end ?? undefined)

    const users = await get_bot_users_for_chat(settings.db, payload.message.chat.id)
    const bot_ids = new Set(users.filter(x => x.bot).map(x => x.user_id))

    const player_ids_to_names = new Map<number, string>()
    let scores: Scores = new Map();
    submissions.forEach(s => {
        latest_id = latest_id == undefined || s.game_id > latest_id ? s.game_id : latest_id

        if (!scores.has(s.game_id)) {
            scores.set(s.game_id, new Map())
        }
        let score_map = scores.get(s.game_id)!

        let user_name = users.find(x => x.user_id == s.user_id)?.alias ?? "unknown"
        player_ids_to_names.set(s.user_id, user_name)
        switch (s.game_type) {
            case "connections":
                score_map.set(s.user_id, parseConnectionsScoreFromShareable(s.submission)!.mistakes)
                break
            case "wordle":
                score_map.set(s.user_id, score_from_wordle_shareable(s.submission).guesses)
                break
            default:
                console.error("Unknown game type: ", s.game_type)
        }

    })


    let previous_leaderboard;
    const dontUsePrevious = end != null && (!latest_id || end < latest_id)
    if (!dontUsePrevious) {
        let previous_scores = structuredClone(scores)

        if (latest_id != undefined) {
            delete previous_scores[latest_id]
        }
        previous_leaderboard = convertDailyScoresToLeaderboard(previous_scores, bot_ids, player_ids_to_names)
    }

    const current_leaderboard = convertDailyScoresToLeaderboard(scores, bot_ids, player_ids_to_names)
    const leaderboard = generateLeaderboard(current_leaderboard, "avg", `Top ${game_type.charAt(0).toUpperCase() + game_type.slice(1)}'ers`, previous_leaderboard)

    await sendMessage({
        api_key: settings.telegram_api_key,
        open_ai_key: settings.openai_api_key,
        payload: {
            chat_id: payload.message.chat.id,
            text: `<pre>\n${leaderboard}\n</pre>`,
            parse_mode: "HTML"
        },
        audio_chance: 0,
        delay: 0
    })
}

export async function wordle_command(payload: TelegramMessage, settings: ChatbotSettings): Promise<any> {
    const now = moment.tz('Europe/London').toDate()
    let todays_wordle_no = printDateToNYTGameId(now, FIRST_WORDLE_DATE, true)
    let bot_user_id = parseInt(settings.telegram_api_key.split(':')[0])
    let previous_score = await get_game_submission(settings.db, todays_wordle_no, "wordle", bot_user_id);


    if (previous_score) {
        await setReaction({
            api_key: settings.telegram_api_key,
            payload: {
                chat_id: payload.message.chat.id,
                message_id: payload.message.message_id,
                reaction: [{
                    "type": "emoji",
                    "emoji": "🖕",
                }]
            }
        })
        return
    }

    const words = await getWordleList();
    const wordle = await getWordleForDay(now);
    if (!wordle) throw new Error("Wordle not found for today")

    const solution = solveWordle(wordle.wordle, words);


    await insert_game_submission(settings.db, {
        game_id: wordle.wordle_no,
        game_type: "wordle",
        user_id: bot_user_id,
        submission: generateWordleShareable(wordle, solution) + '\n',
        submission_date: now,
    })

    await sendCommandMessage(payload, settings, generateWordleShareable(wordle, solution) + '\n')
    return
}

export async function connections_command(payload: TelegramMessage, settings: ChatbotSettings): Promise<any> {
    let bot_user_id = parseInt(settings.telegram_api_key.split(':')[0])

    const date_today = new Date();
    date_today.setHours(date_today.getHours() + 1)

    const connections_ = await getConnectionsForDay(date_today)

    let previous_submission = await get_game_submission(settings.db, connections_.id, "connections", bot_user_id);

    if (previous_submission) {
        await setReaction({
            api_key: settings.telegram_api_key,
            payload: {
                chat_id: payload.message.chat.id,
                message_id: payload.message.message_id,
                reaction: [{
                    "type": "emoji",
                    "emoji": "🖕",
                }]
            }
        })
        return
    }

    const playerCallback: PlayerCallback = async (state, invalid_guess) => {
        let messages: ChatCompletionMessageParam[] = []
        messages.push({ role: 'system', content: convertGuessToPrompt(null) })
        messages.push({ role: 'user', content: "Welcome to connections bot, here are your 16 words: '" + state.tiles.join(",") + "'" })
        for (const guess of [...state.guesses, invalid_guess]) {
            if (!guess) continue;
            messages.push({ role: 'assistant', content: guess.guess.join(",") }) // assistant message
            messages.push({ role: 'user', content: convertGuessToPrompt(guess) }) // user message
        }
        const schema = {
            type: "object",
            properties: {
                connections_guess: {
                    type: "array",
                    items: {
                        type: "string",
                        "enum": state.tiles
                    }
                }
            },
            required: ["connections_guess"],
            additionalProperties: false
        };

        let response_format: ResponseFormatJSONSchema = {
            "type": "json_schema",
            "json_schema": {
                "strict": true,
                "description": "A guess for the category in connections consisting of 4 words",
                "name": "connections_guess",
                schema
            }
        }

        const response = await call_gpt({
            api_key: settings.openai_api_key,
            payload: {
                model: "gpt-4o-2024-08-06",
                messages,
                response_format: response_format
            },
        })
        console.log("chat gpt response: ", response);
        return JSON.parse(response).connections_guess as string[]
    }

    const [state, connections] = await solveConnections(date_today, playerCallback);
    const shareable = generateConnectionsShareable(state, connections)
    await sendCommandMessage(payload, settings, shareable)
    await insert_game_submission(settings.db, {
        game_id: connections_.id,
        game_type: "connections",
        user_id: bot_user_id,
        submission: shareable,
        submission_date: date_today,
    })
}


export const COMMANDS: Command<any>[] = [
    new Command("listtriggers", "List all the triggers that Dave responds to", new ManyArgs([]), list_triggers_command),
    new Command("optout", "Opt out of Dave's services", new ManyArgs([new OptionalArg(new BoolArg("confirmation", "confirm you want to opt out"))]), optout_command),
    new Command("optin", "Opt in to Dave's services", new ManyArgs([]), optin_command),
    new Command("info", "Get opt in instructions from Dave", new ManyArgs([]), info_command),
    new Command("optindave", "Opt in Dave himself (he consents)", new ManyArgs([]), optindave_command),
    new Command("attack", "Attack a user with a message", new ManyArgs([new StringArg("user", "Name of the user to attack")]), attack_command),
    new Command("leaderboard", "Get the leaderboard for a game", new ManyArgs([
        new EnumArg<GameType>("game_type", "The game type to get the leaderboard for", ["wordle", "connections"]),
        new OptionalArg(new NumberArg("start", "The first game id to use for the leaderboard (inclusive)", "l")),
        new OptionalArg(new NumberArg("end", "The last game id to use for the leaderboard (inclusive)", "e")),
    ]), leaderboard_command),
    new Command("wordle", "Get dave to play today's wordle", new ManyArgs([]), wordle_command),
    new Command("connections", "Get dave to play today's connections", new ManyArgs([]), connections_command),
]
