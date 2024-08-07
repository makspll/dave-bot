import axios, { AxiosError } from "axios"
import { AUDIO_MESSAGE_CHANCE, DEFAULT_MSG_DELAY } from "./data.js"
import { call_tts } from "./openai.js"

export async function sendMessage(request: TelegramSendMessageRequest): Promise<void> {
    let audio_chance = request.audio_chance != undefined ? request.audio_chance : AUDIO_MESSAGE_CHANCE
    let delay = request.delay ? request.delay : DEFAULT_MSG_DELAY

    console.log("sending telegram message", { ...request, api_key: "REDACTED" })

    if (audio_chance > 0 && Math.random() < audio_chance && request.payload.text) {
        console.log("sending as audio via random chance");
        try {
            request.payload.voice = await call_tts({
                api_key: request.api_key,
                payload: request.payload.text
            })
        } catch (err) {
            console.error("Error in calling tts, falling back on text message", err)
        }
    }

    // send either text or voice message
    let endpoint = "sendMessage"
    if (request.payload.voice) {
        endpoint = "sendVoice"
        delete request.payload.text
    }

    let form_data = new FormData();
    Object.entries(request.payload).forEach(([key, value]) => {
        form_data.append(key, value);
    })

    // Calling the API endpoint to send a telegram message
    if (delay > 0) {
        // delay by provided amount of seconds + random seconds between 0 and 10
        const variance = Math.floor(Math.random() * 10);
        await new Promise((resolve) => setTimeout(resolve, (delay + variance) * 1000));
    }


    const url = `https://api.telegram.org/bot${request.api_key}/${endpoint}`
    const response = await axios.post(url, form_data)
        .then(res => {
            console.log("Successfully sent telegram message", res)
        })
        .catch((err: AxiosError) => {
            console.error("Error in sending telegram message", err.toJSON())
        })
}