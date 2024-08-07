import { sendMessage } from "./telegram.js";
import { connections_slur, hardlyfier, keywords, screamo, sickomode, wordle_slur } from "./actions.js";
import { COMMANDS } from "./commands.js";
import { TRIGGERS } from "./data.js";



export interface Env {
    MAIN_CHAT_ID: number,
    GOD_ID: number,
    KV_STORE: KVNamespace,
    TELEGRAM_API_KEY: string,
    OPENAI_AI_KEY: string,
}

function get_settings(env: Env): ChatbotSettings {
    return {
        telegram_api_key: env.TELEGRAM_API_KEY,
        openai_api_key: env.OPENAI_AI_KEY,
        main_chat_id: env.MAIN_CHAT_ID,
        god_id: env.GOD_ID,
        kv_namespace: env.KV_STORE
    }
}

export default {
    //handles cron jobs
    async scheduled(event: any, env: Env, ctx: ExecutionContext) {
        let settings: ChatbotSettings = get_settings(env)

        switch (event.cron) {
            case "0 8 * * *": // every morning
                console.log("Firing off wordle")
                await sendMessage({
                    api_key: settings.telegram_api_key,
                    payload: {
                        chat_id: settings.main_chat_id,
                        text: `Good morning! It's wordlin time!`
                    },
                })
                let message = {
                    message: {
                        chat: {
                            id: settings.main_chat_id,
                            title: "",
                            type: ""
                        },
                        message_id: 0,
                        from: {
                            id: 0,
                            is_bot: false,
                            first_name: "",
                            last_name: "",
                            username: "",
                            language_code: ""
                        },
                        date: 0,
                        text: ""
                    }
                }

                await COMMANDS.wordle(message, settings, [])
                await COMMANDS.connections(message, settings, [])
                break;
        }
    },

    async fetch(request: Request, env: Env, ctx: ExecutionContext) {
        // for easy access
        console.log("fetch callback")
        try {
            if (request.method === "POST") {
                const payload: TelegramMessage = await request.json()
                // Getting the POST request JSON payload
                if ('message' in payload && payload.message.text) {
                    let settings: ChatbotSettings = get_settings(env)
                    console.log("Received telegram message from chat: " + (payload.message.chat.title || payload.message.chat.id))
                    let actions: [string, Action][] = [
                        ["connections", connections_slur],
                        ["wordle", wordle_slur],
                        ["hardly know her", hardlyfier],
                        ["dave sickomode", sickomode],
                        ["keyword triggers", keywords(TRIGGERS)],
                        ["random scream", screamo],
                    ]

                    for (const [name, action] of actions) {
                        console.log("Running action: " + name)
                        let keep_going = await action(payload, settings)
                        if (!keep_going) {
                            console.log("Action " + name + " stopped the chain")
                            break
                        }
                    }

                } else {
                    console.log(JSON.stringify(payload || {}))
                }
            }
        } catch (error) {
            console.error("Error in fetch callback", error)
            await sendMessage({
                payload: {
                    chat_id: env.GOD_ID,
                    text: `Error: ${error}, stringified: ${JSON.stringify(error)}`,
                },
                api_key: env.TELEGRAM_API_KEY,
                audio_chance: 0
            })
        }

        return new Response("OK") // Doesn't really matter
    },
};





