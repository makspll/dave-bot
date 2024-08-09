import { ChatCompletionCreateParamsNonStreaming } from "openai/resources/index.mjs";

declare global {
    interface TTSRequest {
        api_key: string;
        payload: string;
    }

    interface LLMCompletionsRequest {
        api_key: string;
        payload: ChatCompletionCreateParamsNonStreaming;
    }

    interface LLMCompletionsResponse {
        choices: {
            message: {
                content: string;
            };
        }[];
    }
}
export { }