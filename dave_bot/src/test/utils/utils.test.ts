import { DeepPartial } from "@src/types/deep_partial.js";
import { TelegramMessage } from "@src/types/telegram.js";


export function makeTestMessage(override: DeepPartial<TelegramMessage> | undefined = undefined): TelegramMessage {
    const message: TelegramMessage = {
        message: {
            message_id: override?.message?.message_id || 0,
            from: {
                id: 0,
                is_bot: false,
                first_name: '',
                last_name: '',
                username: '',
                language_code: '',
                ...(override?.message?.from || {})
            },
            chat: {
                id: 0,
                title: '',
                type: 'private',
                ...(override?.message?.chat || {})
            },
            date: override?.message?.date || 0,
            text: override?.message?.text || '',
        }
    };

    return message;
}

export function compareMultilineStrings(received: string, expected: string) {
    const receivedLines = received.trim().split('\n');
    const expectedLines = expected.trim().split('\n');


    for (let i = 0; i < receivedLines.length; i++) {
        expect(receivedLines[i].trim()).toBe(expectedLines[i].trim());
    }
    expect(receivedLines.length).toBe(expectedLines.length);
}


