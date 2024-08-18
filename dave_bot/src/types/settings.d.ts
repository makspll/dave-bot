declare global {
    interface ChatbotSettings {
        telegram_api_key: string,
        openai_api_key: string,
        main_chat_id: number,
        god_id: number,
        kv_namespace: KVNamespace,
        db: D1Database
    }
}

export { }