import { AUDIO_MESSAGE_CHANCE, DEFAULT_MSG_DELAY } from "./data.js"
import { call_tts } from "./openai.js"


export async function sendMessage(request: TelegramSendMessageRequest): Promise<number> {
    let audio_chance = request.audio_chance != undefined ? request.audio_chance : AUDIO_MESSAGE_CHANCE
    let delay = request.delay != undefined ? request.delay : DEFAULT_MSG_DELAY

    console.log("sending telegram message", { ...request, api_key: "REDACTED", open_ai_key: "REDACTED" })

    if (audio_chance > 0 && Math.random() < audio_chance && request.payload.text) {
        console.log("sending as audio via random chance");
        try {
            request.payload.voice = await call_tts({
                api_key: request.open_ai_key,
                payload: request.payload.text
            })
            console.log("Successfully generated voice message", request.payload.voice, request.payload.voice.size)
        } catch (err) {
            console.error("Error in calling tts, falling back on text message", err)
        }
    }
    // Calling the API endpoint to send a telegram message
    if (delay > 0) {
        // delay by provided amount of seconds + random seconds between 0 and 10
        const variance = Math.floor(Math.random() * 10);
        await new Promise((resolve) => setTimeout(resolve, (delay + variance) * 1000));
    }

    // send either text or voice message
    let endpoint;
    let method;
    let data: any;
    let headers;
    if (request.payload.voice !== undefined) {
        endpoint = "sendVoice"
        delete request.payload.text
        method = "POST"
        data = new FormData()
    } else {
        endpoint = "sendMessage"
        method = "GET"
        data = new URLSearchParams()
    }

    Object.entries(request.payload).forEach(([key, value]) => {
        data.append(key, value);
    })

    console.log("sending telegram message", endpoint, method, data)
    let url = `https://api.telegram.org/bot${request.api_key}/${endpoint}`
    if (method === "GET") {
        url += "?" + data.toString()
        data = undefined
    }

    const message_id = await fetch(url, {
        method,
        body: data,
    }).then(res => res.json())
        .then((data: any) => {
            if (!data.ok) {
                throw new Error("Failed to send telegram message: " + data.responseText, data.status)
            }
            console.log("Successfully sent telegram message", data)
            return data.result.message_id as number
        }).catch((err: Error) => {
            console.error("Error in sending telegram message", err)
        })

    if (message_id === undefined) {
        throw new Error("Failed to send telegram message")
    }

    return message_id

}

export async function setReaction(request: TelegramSetReactionRequest): Promise<void> {
    console.log("sending telegram reaction", { ...request, api_key: "REDACTED" })

    let url = `https://api.telegram.org/bot${request.api_key}/setMessageReaction`
    let parameters = new URLSearchParams({
        chat_id: request.payload.chat_id.toString(),
        message_id: request.payload.message_id.toString(),
        reaction: JSON.stringify(request.payload.reaction)
    })

    console.log("sending telegram reaction", url, parameters)

    await fetch(`${url}?${parameters.toString()}`, {
        method: "GET",
    }).then(res => res.json())
        .then((res: any) => {
            if (!res.ok) {
                throw new Error("Failed to send telegram reaction: " + res.responseText, res.status)
            }
            const data: any = res
            console.log("Successfully sent telegram reaction", data)
        }).catch((err: Error) => {
            console.error("Error in sending telegram reaction", err)
        })
}

export async function setMyCommands(request: TelegramSetCommandRequest): Promise<void> {
    let url = `https://api.telegram.org/bot${request.api_key}/setMyCommands`
    let parameters = new FormData()
    parameters.append("commands", JSON.stringify(request.payload))
    return fetch(url, { method: "POST", body: parameters })
        .then(res => res.json())
        .then((data: any) => {
            if (!data.ok) {
                throw new Error("Failed to set telegram commands: " + data.responseText, data.status)
            }
            console.log("Successfully set telegram commands", data)
        }).catch((err: Error) => {
            console.error("Error in setting telegram commands", err)
        })
}
/// converts a telegram message to a user, extracting the user_id, alias and creating a new consent date
export function user_from_message(message: TelegramMessage): User {
    return {
        user_id: message.message.from.id,
        alias: message.message.from.username || message.message.from.first_name || message.message.from.last_name || message.message.from.id.toString(),
        consent_date: new Date(),
        bot: message.message.from.is_bot
    }
}

export function chat_from_message(message: TelegramMessage): Chat {
    return {
        chat_id: message.message.chat.id,
        alias: message.message.chat.title || message.message.chat.id.toString()
    }
}