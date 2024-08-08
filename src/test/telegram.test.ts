import { sendMessage } from "@src/telegram.js"

jest.mock("axios", () => {
    return {
        request: jest.fn().mockResolvedValue({ data: { ok: true } })
    }
})
jest.mock("@src/openai.js", () => {
    return {
        call_tts: jest.fn().mockResolvedValue(new Blob())
    }
})

describe('Telegram', () => {
    it('should be able to send a message', async () => {
        await sendMessage({
            api_key: "",
            open_ai_key: "",
            payload: {
                chat_id: 6924901817,
                text: "Hello, world",
            },
            audio_chance: 1,
            delay: 0
        })
    })
})