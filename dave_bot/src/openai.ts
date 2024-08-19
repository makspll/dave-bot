import OpenAI from "openai";
import { TTSRequest, LLMCompletionsRequest } from "./types/openai.js";

export async function call_tts(request: TTSRequest): Promise<Blob> {
    const client = new OpenAI({
        apiKey: request.api_key, // This is the default and can be omitted
    });

    let response = await client.audio.speech.create({
        input: request.payload,
        model: "tts-1",
        voice: "onyx",
        response_format: "opus"
    }).then((response) => {
        if (response.ok) {
            return response.blob()
        }
    }).then((blob) => {
        return blob
    }).catch((error: typeof OpenAI.APIError) => {
        console.error("Error in tts call:", error);
        return error
    })

    if (!response || response instanceof OpenAI.APIError) {
        throw response
    }

    return response as Blob;
}




// calls chat gpt with the given message history and returns the response
// the messages alternate between assistant and user messages starting from a system message
// i.e. [system, user, assistant, user, assistant ...]
export async function call_gpt(request: LLMCompletionsRequest): Promise<string> {
    const client = new OpenAI({
        apiKey: request.api_key, // This is the default and can be omitted
    });

    console.log("Calling chat gpt, request:", { ...request, api_key: "REDACTED" });
    let response = await client.chat.completions.create(request.payload).then((response) => {
        return response.choices[0].message.content
    }).catch((error: typeof OpenAI.APIError) => {
        console.error("Error in chat gpt call:", error);
        return error
    })

    if (!response || response instanceof OpenAI.APIError) {
        throw response
    }

    return response as string
}
