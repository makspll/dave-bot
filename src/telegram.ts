import axios, { AxiosError, AxiosRequestConfig } from "axios"
import { AUDIO_MESSAGE_CHANCE, DEFAULT_MSG_DELAY } from "./data.js"
import { call_tts } from "./openai.js"

export async function sendMessage(request: TelegramSendMessageRequest): Promise<void> {
    let audio_chance = request.audio_chance != undefined ? request.audio_chance : AUDIO_MESSAGE_CHANCE
    let delay = request.delay ? request.delay : DEFAULT_MSG_DELAY

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
    let endpoint = "sendMessage"
    let method = "GET"
    let form_data = undefined
    let parameters = ""
    if (request.payload.voice !== undefined) {
        endpoint = "sendVoice"
        delete request.payload.text
        method = "POST"
        form_data = new FormData()
        Object.entries(request.payload).forEach(([key, value]) => {
            form_data!.append(key, value);
        })
    } else {
        parameters = '?' + Object.entries(request.payload).map(([key, value]) => `${key}=${encodeURIComponent(value)}`).join("&")
    }

    console.log("sending telegram message", endpoint, method, parameters, form_data)
    const url = `https://api.telegram.org/bot${request.api_key}/${endpoint}${parameters}`
    const response = await axios.request({ url, method, data: form_data })
        .then(res => {
            console.log("Successfully sent telegram message", res)
        })
        .catch((err: AxiosError) => {
            console.error("Error in sending telegram message", err.response?.data)
        })
}