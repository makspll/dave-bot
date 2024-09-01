import { sendMessage } from "./telegram.js";
import { commands_and_filter_optins, hardlyfier, keywords, nyt_games_submission, screamo, sickomode } from "./actions.js";
import { COMMANDS, connections_command, send_property_alerts, wordle_command } from "./commands.js";
import { TRIGGERS } from "./data.js";
import { Action } from "./types/actions.js";
import { ChatbotSettings } from "./types/settings.js";
import { TelegramMessage } from "./types/telegram.js";
import { flush_logs, inject_logger } from "./logging.js";
import { process_scrape_result, scrape_all_queries, send_all_property_alerts } from "./property/scrape.js";

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
    SCRAPFLY_API_KEY: string,
    WORKER_URL: string,
    DB: D1Database;
}

export interface CronEvent {
    cron: string
    type: "scheduled"
    scheduledTime: number
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
        scrapfly_api_key: env.SCRAPFLY_API_KEY,
        worker_url: env.WORKER_URL,
        db: env.DB
    }
}

async function fetch_callback(payload: TelegramMessage, env: Env, ctx: ExecutionContext, settings: ChatbotSettings) {
    // for easy access
    console.log("fetch callback")
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

    }

}

async function schedule_callback(event: CronEvent, env: Env, ctx: ExecutionContext, settings: ChatbotSettings) {
    switch (event.cron) {
        // every hour
        case "0 * * * *":
            console.log("Hourly schedule")
            // don't fire outside of working hours
            let now = new Date()
            let hour = now.getHours()
            if (hour < 9 || hour > 17) {
                console.log("Outside of working hours, not running property scraper")
                break;
            }

            await scrape_all_queries(settings)
            await send_all_property_alerts(settings)
            break;
        case "0 8 * * *": // every morning
            console.log("Morning schedule")
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

}

type Callback = (event: any, env: Env, ctx: ExecutionContext, settings: ChatbotSettings) => Promise<void>

function inject_logger_with_tags(settings: ChatbotSettings): Promise<any> {
    return new Promise((resolve, reject) => {
        try {
            inject_logger(settings, { service: "dave", environment: settings.environment })
            resolve(void 0)
        } catch (error) {
            reject(error);
        }
    })
}

function wrap_callback(event: any | Request, env: Env, ctx: ExecutionContext, name: string, callback: Callback): () => Promise<Response> {
    return async function () {
        try {
            let settings: ChatbotSettings = get_settings(env)
            inject_logger_with_tags(settings)
            if (event instanceof Request) {
                // check X-Telegram-Bot-Api-Secret-Token is correct
                if (event.headers.get("X-Scrapfly-Webhook-Signature")) {
                    // verify signature 
                    console.log("Received scrapfly webhook")
                    await process_scrape_result(await event.json(), settings)
                    await flush_logs(settings)
                    return new Response(null, { status: 200 })
                } else if (event.headers.get("X-Telegram-Bot-Api-Secret-Token") !== env.TELEGRAM_WEBHOOK_SECRET) {
                    console.warn("Unauthorized webhook call", {
                        method: event.method,
                        url: event.url,
                        cloudflare_props: JSON.stringify(event.cf),
                        headers: {
                            "User-Agent": event.headers.get("User-Agent"),
                            "X-Forwarded-For": event.headers.get("X-Forwarded-For"),
                            "Content-Type": event.headers.get("Content-Type"),
                        },
                        ip: event.headers.get("CF-Connecting-IP") || "Unknown",
                    });

                    return new Response(null, { status: 401 })
                }
                if (event.method === "POST") {
                    event = await event.json()
                } else {
                    console.log("received valid callback with no body", event.url, await event.text())
                }
            }
            ctx.waitUntil(
                inject_logger_with_tags(settings)
                    .then(async () => {
                        // flush logs periodically
                        const intervalId = setInterval(async () => {
                            await flush_logs(settings);
                        }, 500);

                        return callback(event, env, ctx, settings).finally(async () => {
                            clearInterval(intervalId);
                            await flush_logs(settings);
                        })
                    })
            )
            return new Response(null, { status: 200 })

        } catch (e) {
            console.error(e)
            console.error(`Error in ${name} callback`, e)
            await flush_logs(get_settings(env))
            return new Response(null, { status: 500 })
        }
    }
}

export default {
    //handles cron jobs
    async scheduled(event: any, env: Env, ctx: ExecutionContext) {
        return await wrap_callback(event, env, ctx, "scheduled", schedule_callback)()
    },

    async fetch(request: Request, env: Env, ctx: ExecutionContext) {
        // ingest the request and make a new one 
        return await wrap_callback(request, env, ctx, "scheduled", fetch_callback)()
    },
};


