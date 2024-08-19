// actions.test.ts
import { hardlyfier, keywords, screamo, sickomode } from '@src/actions.js';
import { sendMessage } from '@src/telegram.js';
import { makeTestMessage } from './utils/utils.test.js';
import { calculate_sentiment } from '@src/utils.js';
import { call_gpt } from '@src/openai.js';
import { KeywordTrigger } from '@src/types/data.js';
import { ChatbotSettings } from '@src/types/settings.js';

jest.mock('@src/telegram.js', () => ({
    ...jest.requireActual('@src/telegram.js'),
    sendMessage: jest.fn()
}));

jest.mock('@src/utils.js', () => ({
    ...jest.requireActual('@src/utils.js'),
    calculate_sentiment: jest.fn()
}));

jest.mock('@src/openai.js', () => ({
    ...jest.requireActual('@src/openai.js'),
    call_tts: jest.fn(),
    call_gpt: jest.fn()
}));




const testSettings: ChatbotSettings = {
    telegram_api_key: 'telegramkey',
    telegram_webhook_secret: 'webhook',
    openai_api_key: 'openaikey',
    main_chat_id: 0,
    god_id: 1,
    kv_namespace: {
        get: jest.fn(),
        list: jest.fn(),
        put: jest.fn(),
        getWithMetadata: jest.fn(),
        delete: jest.fn()
    },
    db: {
        prepare: jest.fn(),
        exec: jest.fn(),
        dump: jest.fn(),
        batch: jest.fn(),
    }
}

beforeEach(() => {
    // by default enable most random things to fire
    jest.spyOn(global.Math, 'random').mockReturnValue(0);
})


describe('sickomode', () => {
    it('should send message when Math.random() is lower than SICKOMODE_PROBABILITY', async () => {
        const result = await sickomode(makeTestMessage(), testSettings);
        expect(sendMessage).toHaveBeenCalled();
    });

    it('should not send message when Math.random() is greater than SICKOMODE_PROBABILITY', async () => {
        jest.spyOn(global.Math, 'random').mockReturnValue(1);
        const result = await sickomode(makeTestMessage(), testSettings);
        expect(sendMessage).not.toHaveBeenCalled();
    });

    it('sickomode for sender with first name and username should contain first name', async () => {
        const result = await sickomode(makeTestMessage({ message: { from: { first_name: "first name", username: "user name" } } }), testSettings);
        expect(sendMessage).toHaveBeenCalledWith({
            api_key: testSettings.telegram_api_key,
            payload: expect.objectContaining({
                text: expect.stringContaining("first name")
            })
        });
    })

    it('sickomode should be a reply to the original message', async () => {
        const result = await sickomode(makeTestMessage({ message: { message_id: 123 } }), testSettings);
        expect(sendMessage).toHaveBeenCalledWith({
            api_key: testSettings.telegram_api_key,
            payload: expect.objectContaining({
                reply_to_message_id: 123
            })
        });
    })
});

describe('hardlyfier', () => {
    it('should send message when Math.random() is lower than HARDLYFY_PROBABILITY and message contains "harder"', async () => {
        const result = await hardlyfier(makeTestMessage({ message: { text: "harder" } }), testSettings);
        expect(sendMessage).toHaveBeenCalled();
    })

    it('should not send message when Math.random() is higher than HARDLYFIER_PROBABILITY and message contains "harder"', async () => {
        jest.spyOn(global.Math, 'random').mockReturnValue(1);
        const result = await hardlyfier(makeTestMessage({ message: { text: "harder" } }), testSettings);
        expect(sendMessage).not.toHaveBeenCalled();
    })

    it('"harder" responds with "harder? I hardly know er!"', async () => {
        const result = await hardlyfier(makeTestMessage({ message: { text: "harder" } }), testSettings);
        expect(sendMessage).toHaveBeenCalledWith({
            api_key: testSettings.telegram_api_key,
            payload: expect.objectContaining({
                text: "harder? I hardly know er!"
            })
        });
    })

    it('"damnit" responds with "damnit? I hardly know it!"', async () => {
        const result = await hardlyfier(makeTestMessage({ message: { text: "damnit" } }), testSettings);
        expect(sendMessage).toHaveBeenCalledWith({
            api_key: testSettings.telegram_api_key,
            payload: expect.objectContaining({
                text: "damnit? I hardly know it!"
            })
        });
    })
})

describe('screamo', () => {
    it('should send message when Math.random() is lower than SCREAMO_PROBABILITY', async () => {
        const result = await screamo(makeTestMessage(), testSettings);
        expect(sendMessage).toHaveBeenCalled();
    })

    it('should not send message when Math.random() is higher than SCREAMO_PROBABILITY', async () => {
        jest.spyOn(global.Math, 'random').mockReturnValue(1);
        const result = await screamo(makeTestMessage(), testSettings);
        expect(sendMessage).not.toHaveBeenCalled();
    })
})

describe('keywords', () => {
    it('should not send message when Math.random() is higher than trigger probability', async () => {
        jest.spyOn(global.Math, 'random').mockReturnValue(1);

        let triggers: KeywordTrigger[] = [{
            trigger: ["word"],
            chance: 0.1
        }]

        const result = await keywords(triggers)(makeTestMessage({ message: { text: "harder" } }), testSettings);
        expect(sendMessage).not.toHaveBeenCalled();
    })

    it('should send message containing trigger payload when Math.random() is lower than trigger probability', async () => {
        testSettings.kv_namespace.get = jest.fn().mockResolvedValue("{}");

        let triggers: KeywordTrigger[] = [{
            trigger: ["word"],
            chance: 0.1,
            pos_sent_variations: ["word"],
            neg_sent_variations: ["word"]
        }]

        const result = await keywords(triggers)(makeTestMessage({ message: { text: "word" } }), testSettings);
        expect(sendMessage).toHaveBeenCalledWith({
            api_key: testSettings.telegram_api_key,
            payload: expect.objectContaining({
                text: "word"
            })
        });
    })

    it('positive sentiment variation should be sent when sentiment is positive', async () => {
        (calculate_sentiment as jest.Mock).mockImplementation(() => 0.5);

        testSettings.kv_namespace.get = jest.fn().mockResolvedValue("{}");

        let triggers: KeywordTrigger[] = [{
            trigger: ["word"],
            chance: 0.1,
            pos_sent_variations: ["positive"],
            neg_sent_variations: ["negative"]
        }]

        const result = await keywords(triggers)(makeTestMessage({ message: { text: "word" } }), testSettings);
        expect(sendMessage).toHaveBeenCalledWith({
            api_key: testSettings.telegram_api_key,
            payload: expect.objectContaining({
                text: "positive"
            })
        });
    })

    it('negative sentiment variation should be sent when sentiment is negative', async () => {
        (calculate_sentiment as jest.Mock).mockImplementation(() => -0.5);

        testSettings.kv_namespace.get = jest.fn().mockResolvedValue("{}");

        let triggers: KeywordTrigger[] = [{
            trigger: ["word"],
            chance: 0.1,
            pos_sent_variations: ["positive"],
            neg_sent_variations: ["negative"]
        }]

        const result = await keywords(triggers)(makeTestMessage({ message: { text: "word" } }), testSettings);
        expect(sendMessage).toHaveBeenCalledWith({
            api_key: testSettings.telegram_api_key,
            payload: expect.objectContaining({
                text: "negative"
            })
        });
    })

    it('when keyword triggers AND Math.random() is lower than chat gpt probability, call gpt and use the response', async () => {
        testSettings.kv_namespace.get = jest.fn().mockResolvedValue("{}");
        (call_gpt as jest.Mock).mockResolvedValue("gpt response");

        let triggers: KeywordTrigger[] = [{
            trigger: ["word"],
            chance: 0.1,
            gpt_chance: 0.1,
            gpt_prompt: ["prompt"]
        }]

        const result = await keywords(triggers)(makeTestMessage({ message: { text: "word" } }), testSettings);
        expect(sendMessage).toHaveBeenCalledWith({
            api_key: testSettings.telegram_api_key,
            payload: expect.objectContaining({
                text: "gpt response"
            })
        });
    })
})