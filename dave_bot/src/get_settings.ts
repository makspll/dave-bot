import { Env } from "./main.js";
import { ChatbotSettings } from "./types/settings.js";

export function get_settings(env: Env): ChatbotSettings {
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
    };
}
