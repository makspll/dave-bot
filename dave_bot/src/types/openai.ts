import { ChatCompletionCreateParamsNonStreaming } from "openai/resources/index.mjs";

export interface TTSRequest {
    api_key: string;
    payload: string;
}

export interface LLMCompletionsRequest {
    api_key: string;
    payload: ChatCompletionCreateParamsNonStreaming;
}

export interface LLMCompletionsResponse {
    choices: {
        message: {
            content: string;
        };
    }[];
}
