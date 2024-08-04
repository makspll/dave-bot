import { sendMessage, TelegramMessage } from "./telegram.js";
import { ChatbotSettings } from "./settings.js";
import { connections_slur, hardlyfier, keywords, screamo, sickomode, wordle_slur } from "./actions.js";
import { COMMANDS } from "./commands.js";



export interface Env {
    MAIN_CHAT_ID: number,
    GOD_ID: number,
    KV_NAMESPACE: KVNamespace,
    TELEGRAM_API_KEY: string,
    OPENAI_API_KEY: string,
}

function get_settings(env: Env): ChatbotSettings {
    return {
        telegram_api_key: env.TELEGRAM_API_KEY,
        openai_api_key: env.OPENAI_API_KEY,
        main_chat_id: env.MAIN_CHAT_ID,
        god_id: env.GOD_ID,
        kv_namespace: env.KV_NAMESPACE
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
                    let actions = [
                        connections_slur,
                        wordle_slur,
                        hardlyfier,
                        sickomode,
                        keywords,
                        screamo,
                    ]

                    for (const action of actions) {
                        console.log("Running action: " + action.name)
                        let keep_going = await action(payload, settings)
                        if (!keep_going) {
                            console.log("Action " + action.name + " stopped the chain")
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
                    text: `Error: ${error}, stack trace: ${console.trace()}`,
                },
                api_key: env.TELEGRAM_API_KEY,
            })
        }

        return new Response("OK") // Doesn't really matter
    },
};




