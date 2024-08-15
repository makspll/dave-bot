import { COMMANDS, InvalidInputException } from "./commands.js"
import { parseConnectionsScoreFromShareable } from "./connections.js"
import { COMMON_RIPOSTES, HARDLYKNOWER_PROBABILITY, KEYWORD_GPT_CHANCE, SICKOMODE_PROBABILITY, SYSTEM_PROMPT } from "./data.js"
import { get_user_chats, insert_game_submission } from "./data/sql.js"
import { call_gpt } from "./openai.js"
import { sendMessage, setReaction, user_from_message } from "./telegram.js"
import { calculate_sentiment, sample, to_words } from "./utils.js"


export let commands_and_filter_optins: Action = async (message: TelegramMessage, settings: ChatbotSettings) => {
    let chats = await get_user_chats(settings.db, message.message.from.id)
    let opted_in = chats.find(c => message.message.chat.id == c.chat_id) !== undefined

    if (message.message.text.startsWith("/")) {
        console.log("it's a command")
        let split_cmd = message.message.text.split('@')[0].split(' ')
        console.log(split_cmd)
        let cmd_word = split_cmd[0].replace("/", "")
        if (opted_in !== true && !["info", "optin", "optout"].includes(cmd_word)) {
            return false
        }

        let cmd = COMMANDS[cmd_word]
        split_cmd.shift()
        if (cmd) {
            try {
                await cmd(message, settings, split_cmd)
            } catch (e) {
                if (e instanceof InvalidInputException) {
                    await sendMessage({
                        payload: {
                            text: e.message,
                            chat_id: message.message.chat.id,
                            reply_to_message_id: message.message.message_id
                        },
                        api_key: settings.telegram_api_key,
                        open_ai_key: settings.openai_api_key,
                        delay: 0,
                        audio_chance: 0,
                    })
                } else {
                    throw e
                }
            }

            return false
        }

        if (opted_in !== true) {
            console.log("user not in inclusion list, ignoring message");
            return false
        }

        await setReaction({
            api_key: settings.telegram_api_key,
            payload: {
                chat_id: message.message.chat.id,
                message_id: message.message.message_id,
                reaction: [{ type: "emoji", emoji: "🙉" }]
            }
        })

        return false
    } else {
        return true
    }
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
        api_key: settings.telegram_api_key,
        open_ai_key: settings.openai_api_key
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
            open_ai_key: settings.openai_api_key
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
            open_ai_key: settings.openai_api_key,
            audio_chance: 1
        }
        await sendMessage(payload)
        payload.payload.text = "AAAaaa a A A AA  aAAA A A A "
        await sendMessage(payload)
    }
    return true
}

// very funi keyword reactions, scans messages for keywords and replies with pre-set phrases, returns true if the trigger was satisfied, regardless if the action actually fired
export let keywords: (triggers: KeywordTrigger[]) => Action =
    (triggers) => async (message: TelegramMessage, settings: ChatbotSettings) => {
        let words = to_words(message.message.text);
        let trigger = triggers.find(list => {
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

        if (!trigger) { return true }
        if (Math.random() >= trigger.chance) { return true }

        let gpt_chance = trigger.gpt_chance ? trigger.gpt_chance : KEYWORD_GPT_CHANCE
        let text;
        if (trigger.gpt_prompt && (Math.random() < gpt_chance)) {
            text = await call_gpt({
                api_key: settings.openai_api_key,
                payload: {
                    model: "gpt-3.5-turbo",
                    messages: [
                        { role: "system", content: SYSTEM_PROMPT + "." + "RELATIONSHIP_SUMMARY: normal" + ". PROMPT: " + sample(trigger.gpt_prompt) },
                    ]
                }
            });
        } else {
            // analyse sentiment and pick appropriate variation from the sentiment variations
            let sentiment = calculate_sentiment(words)
            text = sentiment >= 0 ? sample(trigger.pos_sent_variations ?? []) : sample(trigger.neg_sent_variations ?? [])
        }

        await sendMessage({
            payload: {
                text,
                chat_id: message.message.chat.id,
                reply_to_message_id: message.message.message_id
            },
            api_key: settings.telegram_api_key,
            open_ai_key: settings.openai_api_key
        })

        return true
    }




export let nyt_games_submission: Action = async (message: TelegramMessage, settings: ChatbotSettings) => {
    // capture group game_id is required
    // capture group game_score is optional (if present the score is processed via callback, and used for immediate feedback)
    // capture group hard_mode is optional (if present the game is in hard mode)
    let regex_and_game_types: [RegExp, GameType][] = [
        [/^Wordle (?<game_id>[\d,\.]+) (?<game_score>[\dX]+\/\d+)(?<hard_mode>\*?)/, "wordle"],
        [/^Connections \nPuzzle #(?<game_id>[\d,.]+)/, "connections"]
    ]

    for (let [regex, game_type] of regex_and_game_types) {
        let match = message.message.text.match(regex)
        if (match) {
            let game_id = parseInt(match.groups!.game_id.replace(/[^\d]/g, ""))

            let user = user_from_message(message)

            await insert_game_submission(settings.db, {
                game_id: game_id,
                game_type: game_type,
                user_id: user.user_id,
                submission: message.message.text,
                submission_date: new Date(),
            })

            // let game_score = match.groups!.game_score
            let hard_mode = match.groups!.hard_mode
            let reaction: TelegramEmoji = hard_mode ? '❤‍🔥' : '👍'
            await setReaction({
                api_key: settings.telegram_api_key,
                payload: {
                    chat_id: message.message.chat.id,
                    message_id: message.message.message_id,
                    reaction: [{ type: "emoji", emoji: reaction }]
                }
            })

        }
    }

    return false
}