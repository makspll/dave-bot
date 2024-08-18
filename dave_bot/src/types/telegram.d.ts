declare global {

    type TelegramChatType = "private" | "group" | "supergroup" | "channel"
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
                type: TelegramChatType
            }
            date: number
            text: string
        }

    }


    interface TelegramSetCommandRequest {
        api_key: string,
        payload: {
            command: string
            description: string
        }[]
    }

    interface TelegramSendMessageRequest {
        api_key: string,
        open_ai_key: string,
        audio_chance?: number
        delay?: number
        payload: TelegramSendPayload
    }

    type TelegramEmoji = '👍' | '👎' | '❤' | '🔥' | '🥰' | '👏' | '😁' | '🤔' | '🤯' | '😱' | '🤬' | '😢' | '🎉' | '🤩' | '🤮' | '💩' | '🙏' | '👌' | '🕊' | '🤡' | '🥱' | '🥴' | '😍' | '🐳' | '❤‍🔥' | '🌚' | '🌭' | '💯' | '🤣' | '⚡' | '🍌' | '🏆' | '💔' | '🤨' | '😐' | '🍓' | '🍾' | '💋' | '🖕' | '😈' | '😴' | '😭' | '🤓' | '👻' | '👨‍💻' | '👀' | '🎃' | '🙈' | '😇' | '😨' | '🤝' | '✍' | '🤗' | '🫡' | '🎅' | '🎄' | '☃' | '💅' | '🤪' | '🗿' | '🆒' | '💘' | '🙉' | '🦄' | '😘' | '💊' | '🙊' | '😎' | '👾' | '🤷‍♂' | '🤷' | '🤷‍♀' | '😡'

    interface TelegramReactionType {
        type: "emoji",
        emoji: TelegramEmoji
    }
    interface TelegramSetReactionRequest {
        api_key: string,
        payload: {
            chat_id: number
            message_id: number
            reaction: TelegramReactionType[]
        }
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