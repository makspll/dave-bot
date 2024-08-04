import { COMMANDS } from "./commands.js"
import { parseConnectionsScoreFromShareable } from "./connections.js"
import { COMMON_RIPOSTES, HARDLYKNOWER_PROBABILITY, KEYWORD_GPT_CHANCE, MAX_AFFECTION_LEVEL, NEGATIVE_AFFECTION_PROMPTS, POSITIVE_AFFECTION_PROMPTS, SENTIMENT_PER_AFFECTION_LEVEL, SICKOMODE_PROBABILITY, SYSTEM_PROMPT, TRIGGERS } from "./data.js"
import { get_affection_data, get_connections_scores, get_included_ids, get_wordle_scores, store_affection_data, store_connections_scores, store_wordle_scores } from "./kv_store.js"
import { call_gpt } from "./openai.js"
import { ChatbotSettings } from "./settings.js"
import { sendMessage, TelegramMessage } from "./telegram.js"
import { calculate_sentiment, sample, to_words } from "./utils.js"



interface Action {
    (message: TelegramMessage, settings: ChatbotSettings): Promise<boolean>
}

// very funi roasts aimed at sender
export let sickomode: Action = async (message: TelegramMessage, settings: ChatbotSettings) => {
    let firing = Math.random() < SICKOMODE_PROBABILITY;
    if (!firing) {
        return true
    }

    const sickomodes = [
        "Your favourite programming language is html.",
        "You should try Rust",
        "Get a job",
        "You have an all-powerful monopoly on the Norwegian butter market.",
        "You attained mastery of the Lithuanian language by sacrificing the mortal souls of 4 potatoes and a tablespoon of sour cream.",
        "In your spare time, you kick puppies.",
        "You don't know the difference between Java and JavaScript and are too afraid to ask.",
        "You secretly control the world supply of chickpeas through a Latvian shell corp.",
        "You are the only person in history to buy a sofa from DFS when there wasn't a sale on.",
        "You are yet to spend more than 15 minutes in Appleton Tower productively.",
        "You recently bought a slightly dented Fiat Uno from Prince Philip.",
        "You are just 4 pugs wearing a trench coat, with a mop head on top.",
        "You know two facts about ducks, and both of them are wrong.",
        "If you turn your radio to 88.4, you can hear your thoughts.",
        "You are banned from the Northampton branch of Little Chef.",
        "You are legally not allowed within 50 feet of Don Sannella.",
        "You want to declare Appleton Tower a sovereign monarchy.",
        "You were once involved in a rap battle with Piers Morgan.",
        "You prefer the Star Wars prequels to the originals.",
        "You once ate 19 slices of pizza at a CompSoc event.",
        "You think Fox News is too biased towards the Democrats.",
        "You put milk in before the water when making tea.",
        "When you watch Star Wars, you root for the Sith.",
        "There is an airport in Russia named after you.",
        "You think anti-vaxxers make some good points.",
        "You once won a BAFTA for the best original smell.",
        "You think Ada Lovelace is a type of fabric.",
        "You are banned from the county of Derbyshire.",
        "You use WikiHow instead of Stack Overflow.",
        "You once threw a microwave oven at a tramp.",
        "You have ties to Bolivian llama traffickers.",
        "You once drank milk straight from the cow.",
        "You haven't eaten a vegetable since 2008.",
        "You use proprietary software on Linux.",
        "You once punched a horse to the ground.",
        "You lick doorknobs in AT3 at night.",
        "You unplug DICE computers for fun.",
        "You don't separate your recycling.",
        "You think C is too high level.",
        "You dislike Richard Stallman.",
        "You like The Big Bang Theory.",
        "You use PHP out of choice.",
        "You actually like Brexit.",
        "You use Internet Explorer out of choice.",
        "You even use Vim.",
        "You are secretly English.",
        "You use Bing.",
        "Yeah I am sad. \
     Secretly \
     A \
     Duck",
        "https://www.youtube.com/watch?v=-BD1vHgYRgg&list=LL&index=10",
        "HAWL! I'M OAN THE NIGHT SHIFT!!!!!",
        "Not all who wonder are lost, but i sure am. <3",
        "don't mind me, i am just waiting for my dino nuggets."
    ]

    let text = `${message.message.from.first_name}, ${sample(sickomodes)}`
    await sendMessage({
        payload: {
            text,
            chat_id: message.message.chat.id,
            reply_to_message_id: message.message.message_id
        },
        api_key: settings.telegram_api_key
    });

    return true
}

// very funi hardly know er joke generator, returns true if the trigger was satisfied, regardless of if the action actually fired
export let hardlyfier: Action = async (message: TelegramMessage, settings: ChatbotSettings) => {
    let words: string[] = to_words(message.message.text);
    let hers = words.filter(word => {
        return word.length > 3 && (word.endsWith('er') || word.endsWith('im') || word.endsWith('it') || word.endsWith('ye'));
    })

    // 1 - P(no triggers
    // P(no triggers) = (1 - HARDLYKNOWER_PROBABILITY)^n
    let prob = 1 - ((1 - HARDLYKNOWER_PROBABILITY) ** hers.length);
    console.log("hardly know er probability for message: " + prob);
    if (Math.random() < prob) {
        const target_word = sample(hers);
        const postfix_trigger = target_word.slice(-2);
        const text = target_word + `? I hardly know ${postfix_trigger}!`;
        await sendMessage({
            payload: {
                text,
                chat_id: message.message.chat.id,
                reply_to_message_id: message.message.message_id
            },
            api_key: settings.telegram_api_key,
        })
    }
    return true
}

export let screamo: Action = async (message: TelegramMessage, settings: ChatbotSettings) => {
    if (Math.random() < 0.001) {
        let payload = {
            payload: {
                text: "AAAAAAAaaaaaaa",
                chat_id: message.message.chat.id,
                reply_to_message_id: message.message.message_id
            },
            api_key: settings.telegram_api_key,
            audio_chance: 1
        }
        await sendMessage(payload)
        payload.payload.text = "AAAaaa a A A AA  aAAA A A A "
        await sendMessage(payload)
    }
    return true
}

// very funi keyword reactions, scans messages for keywords and replies with pre-set phrases, returns true if the trigger was satisfied, regardless if the action actually fired
export let keywords: Action = async (message: TelegramMessage, settings: ChatbotSettings) => {
    let words = to_words(message.message.text);
    let trigger = TRIGGERS.find(list => {
        let phrase = list.trigger;
        // find the phrase in sequence in the words
        // if the phrase is just one word it will still work
        let phrase_idx = 0;
        for (let i = 0; i < words.length; i++) {
            if (words[i] == phrase[phrase_idx]) {
                phrase_idx = phrase_idx + 1;
                if (phrase_idx == phrase.length) {
                    return true
                }
            } else {
                phrase_idx = 0;
            }
        }
    })

    if (trigger != null) {
        console.log("keyword probability for random keyword in message: " + trigger.chance);
        if (Math.random() < trigger.chance) {
            let gpt_chance = trigger.gpt_chance ? trigger.gpt_chance : KEYWORD_GPT_CHANCE
            let affection_data = await get_affection_data(settings.kv_namespace);
            if (trigger.gpt_prompt && (Math.random() < gpt_chance)) {
                // TODO: get few messages before this one as well
                console.log("Calling chat gpt for this one. :)")
                let relationship_prompt = "no previous relationship";
                let affection_value = affection_data[message.message.from.id]
                let affection_level = Math.min(Math.floor(Math.abs(affection_value) / SENTIMENT_PER_AFFECTION_LEVEL), MAX_AFFECTION_LEVEL)
                console.log("Absolute affection level: " + affection_level)
                if (affection_value != null) {
                    if (affection_value > 0) {
                        relationship_prompt = POSITIVE_AFFECTION_PROMPTS[affection_level - 1]
                    } else {
                        relationship_prompt = NEGATIVE_AFFECTION_PROMPTS[affection_level - 1]
                    }
                }
                let response = await call_gpt({
                    api_key: settings.openai_api_key,
                    payload: {
                        model: "gpt-3.5-turbo",
                        messages: [
                            { role: "system", content: SYSTEM_PROMPT + "." + "RELATIONSHIP_SUMMARY: " + relationship_prompt + ". PROMPT: " + sample(trigger.gpt_prompt) },
                        ]
                    }
                });

                if (response) {
                    await sendMessage({
                        payload: {
                            text: response,
                            chat_id: message.message.chat.id,
                            reply_to_message_id: message.message.message_id
                        },
                        api_key: settings.telegram_api_key
                    })
                } else {
                    console.error("Error in calling chat gpt")
                }
            } else {
                // analyse sentiment and pick appropriate variation from the sentiment variations
                console.log("Triggered");
                let sentiment = calculate_sentiment(words)
                if (affection_data[message.message.from.id] == null) {
                    affection_data[message.message.from.id] = sentiment
                } else {
                    affection_data[message.message.from.id] += sentiment
                }
                await store_affection_data(settings.kv_namespace, affection_data);
                console.log("Sentiment: " + sentiment);
                console.log("positive variants: " + trigger.pos_sent_variations)
                console.log("negative variants: " + trigger.neg_sent_variations)
                const text = sentiment >= 0 ? sample(trigger.pos_sent_variations ?? []) : sample(trigger.neg_sent_variations ?? [])
                console.log("variant: " + text)
                await sendMessage({
                    payload: {
                        text,
                        chat_id: message.message.chat.id,
                        reply_to_message_id: message.message.message_id
                    },
                    api_key: settings.telegram_api_key
                })
            }
        }
    }
    return true
}


// waits for messages of the form: Connections\nPuzzle #413
export let connections_slur: Action = async (message: TelegramMessage, settings: ChatbotSettings) => {
    let parse = parseConnectionsScoreFromShareable(message.message.text);

    if (parse) {
        const { id, mistakes } = parse;
        const connections_no = id;
        console.log("Connections match: ", message.message.text, "id: ", id, "mistakes: ", mistakes)
        let scores = await get_connections_scores(settings.kv_namespace)
        if (!("names" in scores)) {
            scores["names"] = {}
        }
        scores["names"]![message.message.from.id] = message.message.from.first_name

        if (!(connections_no in scores)) {
            scores[connections_no] = {}
        }
        let bot_score = scores[connections_no]["bot"] ? scores[connections_no]["bot"] : 999
        console.log("bot score: ", bot_score)
        scores[connections_no][message.message.from.id] = mistakes
        await store_connections_scores(settings.kv_namespace, scores)

        if (bot_score < mistakes) {
            await sendMessage({
                payload: {
                    text: sample([...COMMON_RIPOSTES, "It's connectin time"]),
                    chat_id: message.message.chat.id,
                    reply_to_message_id: message.message.message_id
                },
                api_key: settings.telegram_api_key
            })
        }
    }
    return true
}



// waits for messages of the form: Wordle 1,134 5/6* ...
// and parses them to determine a response and possibly store the score
export let wordle_slur: Action = async (message: TelegramMessage, settings: ChatbotSettings) => {
    const wordle_regex = /Wordle ([\d,\.]+) (\d+\/\d+).*/
    const match = message.message.text.match(wordle_regex)
    if (match) {
        console.log("Wordle match: ", message.message.text)
        const wordle_no = parseInt(match[1].replace(",", ""))
        const guesses = match[2].split("/")
        const count = parseInt(guesses[0])

        let scores = await get_wordle_scores(settings.kv_namespace)
        if (!("names" in scores)) {
            scores["names"] = {}
        }
        scores["names"]![message.message.from.id] = message.message.from.first_name

        if (!(wordle_no in scores)) {
            scores[wordle_no] = {}
        }
        let bot_score = scores[wordle_no]["bot"] ? scores[wordle_no]["bot"] : 999
        scores[wordle_no][message.message.from.id] = count
        await store_wordle_scores(settings.kv_namespace, scores)

        if (bot_score < count) {
            await sendMessage({
                payload: {
                    text: sample([...COMMON_RIPOSTES, "It's wordlin time"]),
                    chat_id: message.message.chat.id,
                    reply_to_message_id: message.message.message_id
                },
                api_key: settings.telegram_api_key
            })
        }
    }
    return true
}


export let command_processor: Action = async (message: TelegramMessage, settings: ChatbotSettings) => {
    let included_ids = await get_included_ids(settings.kv_namespace)
    if (message.message.text.startsWith("/")) {
        console.log("it's a command")
        let split_cmd = message.message.text.split('@')[0].split(' ')
        console.log(split_cmd)
        let cmd_word = split_cmd[0].replace("/", "")
        if (included_ids[message.message.from.id] !== true && !["info", "optin", "optout"].includes(cmd_word)) {
            return false
        }

        let cmd = COMMANDS[cmd_word]
        split_cmd.shift()
        if (cmd) {
            await cmd(message, settings, split_cmd)
        }
        return false
    }

    if (included_ids[message.message.from.id] !== true) {
        console.log("user not in inclusion list, ignoring message");
        return false
    }
    return true
}