import { D1Database, KVNamespace } from "@cloudflare/workers-types";

export interface ChatbotSettings {
    telegram_webhook_secret: string,
    telegram_api_key: string,
    openai_api_key: string,
    main_chat_id: number,
    god_id: number,
    kv_namespace: KVNamespace,
    loki_username: string,
    loki_password: string,
    environment: string,
    scrapfly_api_key: string,
    db: D1Database
}