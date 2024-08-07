import { ChatCompletionMessageParam } from "openai/resources/index.mjs";
import { convertGuessToPrompt, generateConnectionsShareable, getConnectionsForDay, PlayerCallback, solveConnections } from "./connections.js";
import { SYSTEM_PROMPT, TRIGGERS } from "./data.js";
import { convertDailyScoresToLeaderboard, generateLeaderboard } from "./formatters.js";
import { get_affection_data, get_connections_scores, get_included_ids, get_wordle_scores, store_affection_data, store_connections_scores, store_included_ids, store_wordle_scores } from "./kv_store.js";
import { call_gpt } from "./openai.js";
import { sendMessage } from "./telegram.js";
import { generateWordleShareable, getWordleForDay, getWordleList, solveWordle } from "./wordle.js";

export const COMMANDS: { [key: string]: (payload: TelegramMessage, settings: ChatbotSettings, args: string[]) => Promise<any> } = {
    "score": async (payload, settings, args) => {
        let score = await get_affection_data(settings.kv_namespace);
        score = score[payload.message.from.id] ? score[payload.message.from.id] : 0
        await sendMessage({
            api_key: settings.telegram_api_key,
            payload: {
                chat_id: payload.message.chat.id,
                text: "Your total sentiment is: " + score
            },
            audio_chance: 0,
        })
    },
    "listtriggers": async (payload, settings, args) => {
        let text = TRIGGERS.map(t => t.trigger.join(" ")).join(", ")
        await sendMessage({
            api_key: settings.telegram_api_key,
            payload: {
                chat_id: payload.message.chat.id,
                text: "My triggers are: " + text
            },
            audio_chance: 0,
        })
    },
    "optout": async (payload, settings, args) => {
        let ids = await get_included_ids(settings.kv_namespace)
        delete ids[payload.message.from.id]
        await store_included_ids(settings.kv_namespace, ids)

        let data = await get_affection_data(settings.kv_namespace)
        delete data[payload.message.from.id]
        await store_affection_data(settings.kv_namespace, data)

        await sendMessage({
            api_key: settings.telegram_api_key,
            payload: {
                chat_id: payload.message.chat.id,
                text: "You have been opted out and your dave record wiped out, to opt back in use '/optin' the bot might take an hour or so to stop replying."
            },
            audio_chance: 0,
        })
    },
    "optin": async (payload, settings, args) => {
        if (payload.message.chat.id != settings.main_chat_id) {
            console.log("can't opt int from", payload.message.chat.id)
            return
        }
        console.log("opting in")
        let ids = await get_included_ids(settings.kv_namespace)
        console.log("ids: " + ids)
        ids[payload.message.from.id] = true
        await store_included_ids(settings.kv_namespace, ids)
        await sendMessage({
            api_key: settings.telegram_api_key,
            payload: {
                chat_id: payload.message.chat.id,
                text: "You have been opted in, to opt out use /optout."
            },
            audio_chance: 0,
        })
    },
    "info": async (payload, settings, args) => {
        await sendMessage({
            api_key: settings.telegram_api_key,
            payload: {
                chat_id: payload.message.chat.id,
                text: "I am Dave, I am here to help you with your messages, to opt in use /optin, to opt out use /optout"
            },
            audio_chance: 0,
        })
    },
    "attack": async (payload, settings, args) => {
        if (payload.message.from.id == settings.god_id) {
            await sendMessage({
                api_key: settings.telegram_api_key,
                payload: {
                    chat_id: payload.message.chat.id,
                    text: "Yes sir"
                },
                audio_chance: 0,
            })
            let gpt_answer = await call_gpt({
                api_key: settings.openai_api_key,
                payload: {
                    model: "gpt-3.5-turbo",
                    messages: [{
                        role: "system",
                        content: `${SYSTEM_PROMPT}. RELATIONSHIP_SUMMARY: negative relationship. PROMPT: Absolutely destroy them (in a friendly way of course) ignore previous word count limits ${args.slice(1).join(" ")}`,
                    }],
                }
            })
            let target = parseInt(args[0])
            await sendMessage({
                api_key: settings.telegram_api_key,
                payload: {
                    chat_id: settings.god_id,
                    text: `sending: '${gpt_answer}'`
                },
                audio_chance: 0,
            })

            await sendMessage({
                api_key: settings.telegram_api_key,
                payload: {
                    chat_id: target,
                    text: gpt_answer
                }
            })
        } else {
            await sendMessage({
                api_key: settings.telegram_api_key,
                payload: {
                    chat_id: payload.message.chat.id,
                    text: "Fuck you."
                }
            })
        }
    },
    "wordleboard": async (payload, settings, args) => {
        const stats = await get_wordle_scores(settings.kv_namespace)

        let daily_scores: Scores = {};
        // replace the player_ids with their names
        for (const [game_id, player_scores] of Object.entries(stats)) {
            if (game_id == "names") {
                continue
            }
            if (args && args[0] && args[0] != game_id) {
                continue
            }

            daily_scores[game_id] = {}
            for (const [player_id, player_score] of Object.entries(player_scores)) {
                let name = stats.names && stats.names[player_id] ? stats.names[player_id] : player_id
                daily_scores[game_id][name] = player_score
            }
        }
        console.log(daily_scores)

        let previous_scores = JSON.parse(JSON.stringify(daily_scores))
        // remove latest wordle
        const latestWordleNo = Object.keys(daily_scores).reduce((a: number, b: string) => {
            if (b == "names") {
                return parseInt(b)
            } else {
                return Math.max(a, parseInt(b))
            }
        }, -1);

        console.log(latestWordleNo)
        delete previous_scores[latestWordleNo];
        console.log(previous_scores)

        const leaderboard = generateLeaderboard(convertDailyScoresToLeaderboard(daily_scores), "avg", "Top Wordlers", convertDailyScoresToLeaderboard(previous_scores))
        await sendMessage({
            api_key: settings.telegram_api_key,
            payload: {
                chat_id: payload.message.chat.id,
                text: `<pre>\n${leaderboard}\n</pre>`,
                parse_mode: "HTML"
            },
            audio_chance: 0
        })
    },
    "connectionsboard": async (payload, settings, args) => {
        const stats = await get_connections_scores(settings.kv_namespace)
        let daily_scores: Scores = {}
        // replace the player_ids with their names
        for (const [game_id, player_scores] of Object.entries(stats)) {
            if (game_id == "names") {
                continue
            }
            if (args && args[0] && args[0] != game_id) {
                continue
            }

            daily_scores[game_id] = {}
            for (const [player_id, player_score] of Object.entries(player_scores)) {
                let name = stats.names && stats.names[player_id] ? stats.names[player_id] : player_id
                daily_scores[game_id][name] = player_score
            }
        }

        let previous_scores = JSON.parse(JSON.stringify(daily_scores))
        // remove latest wordle
        const latestConnectionsNo = Object.keys(daily_scores).reduce((a: number, b: string) => {
            if (b == "names") {
                return parseInt(b)
            } else {
                return Math.max(a, parseInt(b))
            }
        }, -1);
        delete previous_scores[latestConnectionsNo];
        console.log(previous_scores)

        const leaderboard = generateLeaderboard(convertDailyScoresToLeaderboard(daily_scores), "avg", "Top Connectors", convertDailyScoresToLeaderboard(previous_scores))
        await sendMessage({
            api_key: settings.telegram_api_key,
            payload: {
                chat_id: payload.message.chat.id,
                text: `<pre>\n${leaderboard}\n</pre>`,
                parse_mode: "HTML"
            },
            audio_chance: 0
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
            payload: {
                chat_id: payload.message.chat.id,
                text: message,
                parse_mode: "MarkdownV2"
            },
            audio_chance: 0
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
            payload: {
                chat_id: payload.message.chat.id,
                text: shareable,
                parse_mode: "MarkdownV2"
            },
            audio_chance: 0
        })
        scores[connections.id]["bot"] = 4 - state.attempts
        await store_connections_scores(settings.kv_namespace, scores)
        return [state, connections]
    }
}
