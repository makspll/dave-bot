declare global {
    interface TelegramMessage {
        message: {
            message_id: number
            from: {
                id: number
                is_bot: boolean
                first_name: string
                last_name: string
                username: string
                language_code: string
            }
            chat: {
                id: number
                title: string
                type: string
            }
            date: number
            text: string
        }

    }

    interface TelegramSendMessageRequest {
        api_key: string,
        open_ai_key: string,
        audio_chance?: number
        delay?: number
        payload: TelegramSendPayload
    }

    interface TelegramSendPayload {
        parse_mode?: string
        reply_to_message_id?: number
        chat_id: number
        voice?: Blob
        text?: string
    }
}

export { }