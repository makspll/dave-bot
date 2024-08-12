import { ChatCompletionMessageParam } from "openai/resources/index.mjs";
import { convertGuessToPrompt, generateConnectionsShareable, getConnectionsForDay, parseConnectionsScoreFromShareable, PlayerCallback, solveConnections } from "./connections.js";
import { SYSTEM_PROMPT, TRIGGERS } from "./data.js";
import { convertDailyScoresToLeaderboard, generateLeaderboard } from "./formatters.js";
import { get_affection_data, get_connections_scores, get_included_ids, get_wordle_scores, store_affection_data, store_connections_scores, store_included_ids, store_wordle_scores } from "./data/kv_store.js";
import { call_gpt } from "./openai.js";
import { chat_from_message, sendMessage, user_from_message } from "./telegram.js";
import { generateWordleShareable, getWordleForDay, getWordleList, score_from_wordle_shareable, solveWordle } from "./wordle.js";
import { get_bot_users_for_chat, get_game_submissions_since_game_id, isGameType, register_consenting_user_and_chat, unregister_user } from "./data/sql.js";
import { FIRST_CONNECTIONS_DATE, FIRST_WORDLE_DATE, printDateToNYTGameId } from "./utils.js";
import moment from "moment-timezone";

export class InvalidInputException extends Error {
    constructor(user_message: string) {
        super(user_message);
        this.name = "CustomException";
    }
}

export const COMMANDS: { [key: string]: (payload: TelegramMessage, settings: ChatbotSettings, args: string[]) => Promise<any> } = {
    "score": async (payload, settings, args) => {
        let score = await get_affection_data(settings.kv_namespace);
        score = score[payload.message.from.id] ? score[payload.message.from.id] : 0
        await sendMessage({
            api_key: settings.telegram_api_key,
            open_ai_key: settings.openai_api_key,
            payload: {
                chat_id: payload.message.chat.id,
                text: "Your total sentiment is: " + score
            },
            audio_chance: 0,
            delay: 0
        })
    },
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
        let scores: Scores = { "names": {} }
        submissions.forEach(s => {
            latest_id = latest_id == undefined || s.game_id > latest_id ? s.game_id : latest_id
            if (!(s.game_id in scores)) {
                scores[s.game_id] = {}
            }

            switch (s.game_type) {
                case "connections":
                    scores[s.game_id][s.user_id] = parseConnectionsScoreFromShareable(s.submission)!.mistakes
                case "wordle":
                    scores[s.game_id][s.user_id] = score_from_wordle_shareable(s.submission).guesses
                    break
            }
        })

        const users = await get_bot_users_for_chat(settings.db, payload.message.chat.id)

        users.forEach(u => {
            scores["names"]![u.user_id] = u.alias ?? u.user_id.toString()
        })

        let previous_scores = structuredClone(scores)
        console.log("scores: ", scores, "previous_scores: ", previous_scores)

        if (latest_id != undefined) {
            delete previous_scores[latest_id]
        }
        const previous_leaderboard = convertDailyScoresToLeaderboard(previous_scores)
        const current_leaderboard = convertDailyScoresToLeaderboard(scores)
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
        let message = generateWordleShareable(wordle, solution) + '\n';
        let scores = await get_wordle_scores(settings.kv_namespace);
        if (!(wordle.wordle_no in scores)) {
            scores[wordle.wordle_no] = {}
        }

        if ("bot" in scores[wordle.wordle_no]) {
            return { "solution": solution, "wordle_no": wordle.wordle_no }
        }

        scores[wordle.wordle_no]["bot"] = solution.guesses_count
        await store_wordle_scores(settings.kv_namespace, scores);

        await sendMessage({
            api_key: settings.telegram_api_key,
            open_ai_key: settings.openai_api_key,
            payload: {
                chat_id: payload.message.chat.id,
                text: message,
                parse_mode: "MarkdownV2"
            },
            audio_chance: 0,
            delay: 0
        })
        return { "solution": solution, "wordle_no": wordle.wordle_no }
    },
    "connections": async (payload, settings, args) => {

        let scores = await get_connections_scores(settings.kv_namespace);
        const date_today = new Date();
        date_today.setHours(date_today.getHours() + 1)

        const connections_ = await getConnectionsForDay(date_today)
        if (!(connections_.id in scores)) {
            scores[connections_.id] = {}
        }
        console.log("conenctions: ", connections_)

        if ("bot" in scores[connections_.id]) {
            return [null, null]
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

            console.log("calling chat gpt with messages: ", messages)
            const response = await call_gpt({
                api_key: settings.openai_api_key,
                payload: {
                    model: "gpt-4o",
                    messages
                }
            })
            console.log("chat gpt response: ", response);
            return response
        }
        const [state, connections] = await solveConnections(date_today, playerCallback);
        const shareable = generateConnectionsShareable(state, connections)
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
        scores[connections.id]["bot"] = 4 - state.attempts
        await store_connections_scores(settings.kv_namespace, scores)
        return [state, connections]
    }
}
