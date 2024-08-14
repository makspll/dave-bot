import { ChatCompletionMessageParam } from "openai/resources/index.mjs";
import { convertGuessToPrompt, generateConnectionsShareable, getConnectionsForDay, parseConnectionsScoreFromShareable, PlayerCallback, solveConnections } from "./connections.js";
import { SYSTEM_PROMPT, TRIGGERS } from "./data.js";
import { convertDailyScoresToLeaderboard, generateLeaderboard } from "./formatters.js";
import { call_gpt } from "./openai.js";
import { chat_from_message, sendMessage, user_from_message } from "./telegram.js";
import { generateWordleShareable, getWordleForDay, getWordleList, score_from_wordle_shareable, solveWordle } from "./wordle.js";
import { get_bot_users_for_chat, get_game_submission, get_game_submissions_since_game_id, insert_game_submission, isGameType, register_consenting_user_and_chat, unregister_user } from "./data/sql.js";
import { FIRST_CONNECTIONS_DATE, FIRST_WORDLE_DATE, printDateToNYTGameId } from "./utils.js";
import moment from "moment-timezone";
import { ResponseFormatJSONSchema } from "openai/src/resources/shared.js";

export class InvalidInputException extends Error {
    constructor(user_message: string) {
        super(user_message);
        this.name = "CustomException";
    }
}

export const COMMANDS: { [key: string]: (payload: TelegramMessage, settings: ChatbotSettings, args: string[]) => Promise<any> } = {
    "listtriggers": async (payload, settings, args) => {
        let text = TRIGGERS.map(t => t.trigger.join(" ")).join(", ")
        await sendMessage({
            api_key: settings.telegram_api_key,
            open_ai_key: settings.openai_api_key,
            payload: {
                chat_id: payload.message.chat.id,
                text: "My triggers are: " + text
            },
            audio_chance: 0,
            delay: 0
        })
    },
    "optout": async (payload, settings, args) => {
        let message = "You have been opted out, to opt back in use '/optin'"
        try {
            await unregister_user(settings.db, user_from_message(payload))
        } catch (e) {
            console.error("Error unregistering user: ", e)
            message = "There was an error unregistering you, please try again later :C"
        }

        await sendMessage({
            api_key: settings.telegram_api_key,
            open_ai_key: settings.openai_api_key,
            payload: {
                chat_id: payload.message.chat.id,
                text: message
            },
            audio_chance: 0,
            delay: 0
        })
    },
    "optindave": async (payload, settings, args) => {
        let user_id = parseInt(settings.telegram_api_key.split(':')[0])
        await register_consenting_user_and_chat(settings.db, {
            user_id, alias: "Dave", consent_date: new Date()
        }, chat_from_message(payload))
    },
    "optin": async (payload, settings, args) => {

        let user = user_from_message(payload)
        let chat = chat_from_message(payload)

        let message = "You have been opted in, to opt out use /optout."
        try {
            await register_consenting_user_and_chat(settings.db, user, chat)
        } catch (e) {
            console.error("Error registering user and chat: ", e)
            message = "There was an error registering you, please try again later :C"
        }

        await sendMessage({
            api_key: settings.telegram_api_key,
            open_ai_key: settings.openai_api_key,
            payload: {
                chat_id: payload.message.chat.id,
                text: message
            },
            audio_chance: 0,
            delay: 0
        })
    },
    "info": async (payload, settings, args) => {
        await sendMessage({
            api_key: settings.telegram_api_key,
            open_ai_key: settings.openai_api_key,
            payload: {
                chat_id: payload.message.chat.id,
                text: "I am Dave, I am here to help you with your messages, to opt in use /optin, to opt out use /optout"
            },
            audio_chance: 0,
            delay: 0
        })
    },
    "attack": async (payload, settings, args) => {
        if (payload.message.from.id == settings.god_id) {
            await sendMessage({
                api_key: settings.telegram_api_key,
                open_ai_key: settings.openai_api_key,
                payload: {
                    chat_id: payload.message.chat.id,
                    text: "Yes sir"
                },
                audio_chance: 0,
                delay: 0
            })
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
            let target = parseInt(args[0])
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
        } else {
            await sendMessage({
                api_key: settings.telegram_api_key,
                open_ai_key: settings.openai_api_key,
                payload: {
                    chat_id: payload.message.chat.id,
                    text: "Fuck you."
                },
                delay: 0
            })
        }
    },
    "leaderboard": async (payload, settings, args) => {
        let game_type: GameType
        if (!isGameType(args[0])) {
            throw new InvalidInputException("Valid game type required as the first argument: connections, wordle")
        } else {
            game_type = args[0]
        }

        if (payload.message.chat.type == "private") {
            throw new InvalidInputException("Leaderboards are only available from groupchats with dave :)")
        }

        // get all games for this month, the game id can be converted to a date
        const now = moment.tz('Europe/London')
        const first_date_this_month = now.clone().set("date", 1).toDate()

        let first_id: number
        let latest_id: number | undefined = undefined
        switch (game_type) {
            case "connections":
                first_id = printDateToNYTGameId(first_date_this_month, FIRST_CONNECTIONS_DATE)
                break
            case "wordle":
                first_id = printDateToNYTGameId(first_date_this_month, FIRST_WORDLE_DATE, true)
                break
            default:
                throw new InvalidInputException("Valid game type required as the first argument: connections, wordle")
        }

        console.log("generating leaderboard for game type: ", game_type, "first_id: ", first_id)
        const submissions = await get_game_submissions_since_game_id(settings.db, first_id, game_type, payload.message.chat.id)

        const users = await get_bot_users_for_chat(settings.db, payload.message.chat.id)
        const bot_ids = new Set<number>()
        const player_ids_to_names = new Map<number, string>()
        let scores: Scores = new Map();
        submissions.forEach(s => {
            latest_id = latest_id == undefined || s.game_id > latest_id ? s.game_id : latest_id

            if (!scores.has(s.game_id)) {
                scores.set(s.game_id, new Map())
            }
            let score_map = scores.get(s.game_id)!

            let user_name = users.find(x => x.user_id == s.user_id)?.alias ?? "unknown"
            if (s.bot_entry) {
                bot_ids.add(s.user_id)
            }
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

        let previous_scores = structuredClone(scores)

        if (latest_id != undefined) {
            delete previous_scores[latest_id]
        }
        console.log("scores: ", scores, "previous_scores: ", previous_scores)
        const previous_leaderboard = convertDailyScoresToLeaderboard(previous_scores, bot_ids, player_ids_to_names)
        const current_leaderboard = convertDailyScoresToLeaderboard(scores, bot_ids, player_ids_to_names)

        console.log("current leaderboard: ", current_leaderboard, "previous leaderboard: ", previous_leaderboard)
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
    },
    "wordle": async (payload, settings, args) => {
        const words = await getWordleList();
        console.log("words count: ", words.length)
        let date_today = new Date();
        date_today.setHours(date_today.getHours() + 1)
        const wordle = await getWordleForDay(date_today);

        if (!wordle) throw new Error("Wordle not found for today")

        console.log("solution: ", wordle)
        const solution = solveWordle(wordle.wordle, words);
        console.log("solved: ", solution)
        let bot_user_id = parseInt(settings.telegram_api_key.split(':')[0])

        let previous_score = await get_game_submission(settings.db, wordle.wordle_no, "wordle", bot_user_id);

        if (previous_score) {
            return { "solution": solution, "wordle_no": wordle.wordle_no }
        }

        await insert_game_submission(settings.db, {
            game_id: wordle.wordle_no,
            game_type: "wordle",
            user_id: bot_user_id,
            submission: generateWordleShareable(wordle, solution) + '\n',
            submission_date: date_today,
            bot_entry: true
        })

        await sendMessage({
            api_key: settings.telegram_api_key,
            open_ai_key: settings.openai_api_key,
            payload: {
                chat_id: payload.message.chat.id,
                text: generateWordleShareable(wordle, solution) + '\n',
            },
            audio_chance: 0,
            delay: 0
        })
        return { "solution": solution, "wordle_no": wordle.wordle_no }
    },
    "connections": async (payload, settings, args) => {

        let bot_user_id = parseInt(settings.telegram_api_key.split(':')[0])

        const date_today = new Date();
        date_today.setHours(date_today.getHours() + 1)

        const connections_ = await getConnectionsForDay(date_today)

        let previous_submission = await get_game_submission(settings.db, connections_.id, "connections", bot_user_id);

        console.log("conenctions: ", connections_)

        if (previous_submission) {
            return [null, null]
        }

        const playerCallback: PlayerCallback = async (state, invalid_guess) => {
            console.log("Player Callback")
            let messages: ChatCompletionMessageParam[] = []
            messages.push({ role: 'system', content: convertGuessToPrompt(null) })
            messages.push({ role: 'user', content: "Welcome to connections bot, here are your 16 words: '" + state.tiles.join(",") + "'" })
            for (const guess of [...state.guesses, invalid_guess]) {
                if (!guess) continue;
                messages.push({ role: 'assistant', content: guess.guess.join(",") }) // assistant message
                messages.push({ role: 'user', content: convertGuessToPrompt(guess) }) // user message
            }

            let response_format: ResponseFormatJSONSchema = {
                "type": "json_schema",
                "json_schema": {
                    "strict": true,
                    "description": "A guess for the category in connections consisting of 4 words",
                    "name": "connections_guess",
                    "schema": {
                        "type": "array",
                        "minItems": 4,
                        "maxItems": 4,
                        "uniqueItems": true,
                        "items": {
                            "type": "string",
                        },
                    }
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
            return JSON.parse(response) as [string, string, string, string]
        }

        const [state, connections] = await solveConnections(date_today, playerCallback);
        let score = 4 - state.attempts

        const shareable = generateConnectionsShareable(state, connections)

        await insert_game_submission(settings.db, {
            game_id: connections_.id,
            game_type: "connections",
            user_id: bot_user_id,
            submission: shareable,
            submission_date: date_today,
            bot_entry: true
        })


        await sendMessage({
            api_key: settings.telegram_api_key,
            open_ai_key: settings.openai_api_key,
            payload: {
                chat_id: payload.message.chat.id,
                text: shareable,
                parse_mode: "MarkdownV2"
            },
            audio_chance: 0,
            delay: 0
        })

        return [state, connections]
    }
}
