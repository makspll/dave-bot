
export type TelegramChatType = "private" | "group" | "supergroup" | "channel"
export interface TelegramMessage {
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
            type: TelegramChatType
        }
        date: number
        text: string
    }

}


export interface TelegramSetCommandRequest {
    api_key: string,
    payload: {
        command: string
        description: string
    }[]
}

export interface TelegramSendMessageRequest {
    api_key: string,
    open_ai_key: string,
    audio_chance?: number
    delay?: number
    payload: TelegramSendPayload
}

export type TelegramEmoji = '👍' | '👎' | '❤' | '🔥' | '🥰' | '👏' | '😁' | '🤔' | '🤯' | '😱' | '🤬' | '😢' | '🎉' | '🤩' | '🤮' | '💩' | '🙏' | '👌' | '🕊' | '🤡' | '🥱' | '🥴' | '😍' | '🐳' | '❤‍🔥' | '🌚' | '🌭' | '💯' | '🤣' | '⚡' | '🍌' | '🏆' | '💔' | '🤨' | '😐' | '🍓' | '🍾' | '💋' | '🖕' | '😈' | '😴' | '😭' | '🤓' | '👻' | '👨‍💻' | '👀' | '🎃' | '🙈' | '😇' | '😨' | '🤝' | '✍' | '🤗' | '🫡' | '🎅' | '🎄' | '☃' | '💅' | '🤪' | '🗿' | '🆒' | '💘' | '🙉' | '🦄' | '😘' | '💊' | '🙊' | '😎' | '👾' | '🤷‍♂' | '🤷' | '🤷‍♀' | '😡'

export interface TelegramReactionType {
    type: "emoji",
    emoji: TelegramEmoji
}
export interface TelegramSetReactionRequest {
    api_key: string,
    payload: {
        chat_id: number
        message_id: number
        reaction: TelegramReactionType[]
    }
}

export interface TelegramSendPayload {
    parse_mode?: string
    reply_to_message_id?: number
    chat_id: number
    voice?: Blob
    text?: string
}
