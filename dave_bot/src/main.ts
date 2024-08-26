import { sendMessage } from "./telegram.js";
import { commands_and_filter_optins, hardlyfier, keywords, nyt_games_submission, screamo, sickomode } from "./actions.js";
import { COMMANDS, connections_command, wordle_command } from "./commands.js";
import { TRIGGERS } from "./data.js";
import * as util from "node:util";
import { Action } from "./types/actions.js";
import { ChatbotSettings } from "./types/settings.js";
import { TelegramMessage } from "./types/telegram.js";
import { flush_logs, inject_logger } from "./logging.js";

export interface Env {
    MAIN_CHAT_ID: number,
    GOD_ID: number,
    KV_STORE: KVNamespace,
    TELEGRAM_API_KEY: string,
    TELEGRAM_WEBHOOK_SECRET: string,
    OPEN_AI_KEY: string,
    LOKI_USERNAME: string,
    LOKI_PASSWORD: string,
    ENVIRONMENT: string,
    DB: D1Database;
}

function get_settings(env: Env): ChatbotSettings {
    return {
        telegram_webhook_secret: env.TELEGRAM_WEBHOOK_SECRET,
        telegram_api_key: env.TELEGRAM_API_KEY,
        openai_api_key: env.OPEN_AI_KEY,
        main_chat_id: env.MAIN_CHAT_ID,
        god_id: env.GOD_ID,
        kv_namespace: env.KV_STORE,
        loki_username: env.LOKI_USERNAME,
        loki_password: env.LOKI_PASSWORD,
        environment: env.ENVIRONMENT,
        db: env.DB
    }
}

export default {
    //handles cron jobs
    async scheduled(event: any, env: Env, ctx: ExecutionContext) {
        let settings: ChatbotSettings = get_settings(env)
        inject_logger(settings, { service: "dave", environment: settings.environment })
        try {
            switch (event.cron) {
                case "0 8 * * *": // every morning
                    console.log("Firing off wordle")
                    await sendMessage({
                        api_key: settings.telegram_api_key,
                        open_ai_key: settings.openai_api_key,
                        payload: {
                            chat_id: settings.main_chat_id,
                            text: `Good morning! It's wordlin time!`
                        },
                    })
                    let message: TelegramMessage = {
                        message: {
                            chat: {
                                id: settings.main_chat_id,
                                title: "",
                                type: "private"
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

                    await wordle_command(message, settings)
                    await connections_command(message, settings)
                    break;
            }
        } catch (error: any) {
            console.error("Error in scheduled callback", error, error.message)
            await sendMessage({
                payload: {
                    chat_id: env.GOD_ID,
                    text: `${util.inspect(error)}`,
                },
                api_key: env.TELEGRAM_API_KEY,
                open_ai_key: env.OPEN_AI_KEY,
                audio_chance: 0,
                delay: 0,
            })
        }

        await flush_logs(settings)
    },

    async fetch(request: Request, env: Env, ctx: ExecutionContext) {
        // for easy access
        let settings: ChatbotSettings = get_settings(env)
        inject_logger(settings, { service: "dave", environment: settings.environment })
        console.log("fetch callback")

        // check X-Telegram-Bot-Api-Secret-Token is correct
        if (request.headers.get("X-Telegram-Bot-Api-Secret-Token") !== env.TELEGRAM_WEBHOOK_SECRET) {
            console.warn("Unauthorized webhook call", {
                method: request.method,
                url: request.url,
                cloudflare_props: JSON.stringify(request.cf)
                headers: {
                    "User-Agent": request.headers.get("User-Agent"),
                    "X-Forwarded-For": request.headers.get("X-Forwarded-For"),
                    "Content-Type": request.headers.get("Content-Type"),
                },
                ip: request.headers.get("CF-Connecting-IP") || "Unknown",
            });
            return new Response("Unauthorized", { status: 401 })
        }

        try {
            if (request.method === "POST") {
                const payload: TelegramMessage = await request.json()
                // Getting the POST request JSON payload
                if ('message' in payload && payload.message.text) {
                    console.log("Received telegram message from chat: " + (payload.message.chat.title || payload.message.chat.id))
                    let actions: [string, Action][] = [
                        ["commands and optin filters", commands_and_filter_optins],
                        ["nyt game submissions", nyt_games_submission],
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
        } catch (error: any) {
            console.error("Error in fetch callback", error, error.message)
            await sendMessage({
                payload: {
                    chat_id: env.GOD_ID,
                    text: `${util.inspect(error)}`,
                },
                api_key: env.TELEGRAM_API_KEY,
                open_ai_key: env.OPEN_AI_KEY,
                audio_chance: 0,
                delay: 0,
            })
        }

        await flush_logs(settings)
        return new Response("OK") // Doesn't really matter
    },
};





