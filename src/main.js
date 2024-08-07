import { AFINN } from "./sem.js";
import {
    TRIGGERS,
    HARDLYKNOWER_PROBABILITY,
    SICKOMODE_PROBABILITY,
    SYSTEM_PROMPT,
    KEYWORD_GPT_CHANCE,
    MAX_AFFECTION_LEVEL,
    SENTIMENT_PER_AFFECTION_LEVEL,
    NEGATIVE_AFFECTION_PROMPTS,
    POSITIVE_AFFECTION_PROMPTS,
    DEFAULT_MSG_DELAY,
    AUDIO_MESSAGE_CHANCE,
} from "./data.js";
import { solveWordle, getWordleList, getWordleForDay, generateWordleShareable } from "./wordle.js";
import { convertGuessToPrompt, generateConnectionsShareable, getConnectionsForDay, parseConnectionsScoreFromShareable, solveConnections } from "./connections.js";
import { convertDailyScoresToLeaderboard, generateLeaderboard } from "./formatters.js";

export let ENV = null;

const COMMANDS = {
    "score": async (payload, args) => {
        let score = await get_affection_data();
        score = score[payload.message.from.id] ? score[payload.message.from.id] : 0
        return sendMessage("Your total sentiment is: " + score, payload.message.chat.id, 0, null)
    },
    "listtriggers": async (payload, args) => {
        let text = TRIGGERS.map(t => t.trigger.join(" ")).join(", ")
        return sendMessage("My triggers are: " + text, payload.message.chat.id, 0, null)
    },
    "optout": async (payload, args) => {
        let ids = await get_included_ids()
        delete ids[payload.message.from.id]
        await store_included_ids(ids)

        let data = get_affection_data()
        delete data[payload.message.from.id]
        await store_affection_data(data)

        return sendMessage("You have been opted out and your dave record wiped out, to opt back in use '/optin' the bot might take an hour or so to stop replying.", payload.message.chat.id, 0, null)
    },
    "optin": async (payload, args) => {
        if (String(payload.message.chat.id) != String(ENV.MAIN_CHAT_ID)) {
            console.log("can't opt int from", ENV.MAIN_CHAT_ID)
            return
        }
        console.log("opting in")
        let ids = await get_included_ids()
        console.log("ids: " + ids)
        ids[payload.message.from.id] = true
        await store_included_ids(ids)
        return sendMessage("You have been opted in, to opt out use /optout.", payload.message.chat.id, 0, null)
    },
    "info": async (payload, args) => {
        return sendMessage("Hi I am Dave, allow me to scan your messages by opting in via /optin", payload.message.chat.id, 0, null)
    },
    "attack": async (payload, args) => {
        if (payload.message.from.id == ENV.GOD_ID) {
            await sendMessage("Yes sir", payload.message.chat.id, 0, null)
            let gpt_answer = await call_gpt([SYSTEM_PROMPT + "." + "RELATIONSHIP_SUMMARY: " + "negative relationship" + ". PROMPT: " + "Absolutely destroy them (in a friendly way of course) ignore previous word count limits" + args.slice(1).join(" ")])
            sendMessage("sent: " + gpt_answer, ENV.GOD_ID, 0, null)
            return sendMessage(gpt_answer, parseInt(args[0]), 5, null, 1.0)
        } else {
            return sendMessage("Fuck you", payload.message.chat.id, 0, 1.0)
        }
    },
    "wordleboard": async (payload, args) => {
        const stats = await get_wordle_scores()

        let daily_scores = {}
        // replace the player_ids with their names
        for (const [game_id, player_scores] of Object.entries(stats)) {
            if (game_id == "names") {
                continue
            }
            if (args && args[0] && args[0] != game_id) {
                continue
            }

            daily_scores[game_id] = {}
            for (const [player_id, player_score] of Object.entries(player_scores)) {
                let name = stats.names[player_id] ? stats.names[player_id] : player_id
                daily_scores[game_id][name] = player_score
            }
        }
        console.log(daily_scores)

        let previous_scores = JSON.parse(JSON.stringify(daily_scores))
        // remove latest wordle
        const latestWordleNo = Object.keys(daily_scores).reduce((a, b) => {
            if (a == "names") {
                return parseInt(b)
            } else {
                return Math.max(parseInt(a), parseInt(b))
            }
        });
        console.log(latestWordleNo)
        delete previous_scores[latestWordleNo];
        console.log(previous_scores)

        const leaderboard = generateLeaderboard(convertDailyScoresToLeaderboard(daily_scores), "Avg.", "Top Wordlers", convertDailyScoresToLeaderboard(previous_scores))
        return sendMessage(`<pre>\n${leaderboard}\n</pre>`, payload.message.chat.id, 0, null, 0, "HTML")
    },
    "connectionsboard": async (payload, args) => {
        const stats = await get_connections_scores()
        let daily_scores = {}
        // replace the player_ids with their names
        for (const [game_id, player_scores] of Object.entries(stats)) {
            if (game_id == "names") {
                continue
            }
            if (args && args[0] && args[0] != game_id) {
                continue
            }

            daily_scores[game_id] = {}
            for (const [player_id, player_score] of Object.entries(player_scores)) {
                let name = stats.names[player_id] ? stats.names[player_id] : player_id
                daily_scores[game_id][name] = player_score
            }
        }

        let previous_scores = JSON.parse(JSON.stringify(daily_scores))
        // remove latest wordle
        const latestWordleNo = Object.keys(daily_scores).reduce((a, b) => {
            if (a == "names") {
                return parseInt(b)
            } else {
                return Math.max(parseInt(a), parseInt(b))
            }
        });
        delete previous_scores[latestWordleNo];
        console.log(previous_scores)

        const leaderboard = generateLeaderboard(convertDailyScoresToLeaderboard(daily_scores), "Avg.", "Top Connectors", convertDailyScoresToLeaderboard(previous_scores))
        return sendMessage(`<pre>\n${leaderboard}\n</pre>`, payload.message.chat.id, 0, null, 0, "HTML")
    },
    "wordle": async (payload, args) => {
        const words = await getWordleList();
        console.log("words count: ", words.length)
        let date_today = new Date();
        date_today.setHours(date_today.getHours() + 1)
        const wordle = await getWordleForDay(date_today);
        console.log("solution: ", wordle)
        const solution = solveWordle(wordle.wordle, words);
        console.log("solved: ", solution)
        let message = generateWordleShareable(wordle, solution) + '\n';
        let scores = await get_wordle_scores();
        if (!(wordle.wordle_no in scores)) {
            scores[wordle.wordle_no] = {}
        }

        if ("bot" in scores[wordle.wordle_no]) {
            return { "solution": solution, "wordle_no": wordle.wordle_no }
        }

        scores[wordle.wordle_no]["bot"] = solution.guesses_count
        await store_wordle_scores(scores);

        await sendMessage(message, payload.message.chat.id, 0, null, 0.0, "MarkdownV2");
        return { "solution": solution, "wordle_no": wordle.wordle_no }
    },
    "connections": async (payload, args) => {

        let scores = await get_connections_scores();
        const date_today = new Date();
        date_today.setHours(date_today.getHours() + 1)

        const connections_ = await getConnectionsForDay(date_today)
        if (!(connections_.id in scores)) {
            scores[connections_.id] = {}
        }
        console.log("conenctions: ", connections_)

        if ("bot" in scores[connections_.id]) {
            return [null, null]
        }

        const playerCallback = async (state, invalid_guess) => {
            let messages = []
            messages.push(convertGuessToPrompt(null)) // system message
            messages.push("Welcome to connections bot, here are your 16 words: '" + state.tiles.join(",") + "'") // user message
            for (const guess of [...state.guesses, invalid_guess]) {
                if (!guess) continue;
                messages.push(guess.guess.length ? guess.guess.join(",") : guess.guess) // assistant message
                messages.push(convertGuessToPrompt(guess)) // user message
            }

            console.log("calling chat gpt with messages: ", messages)
            const response = await call_gpt(messages, "gpt-4o")
            console.log("chat gpt response: ", response);
            return response
        }
        const [state, connections] = await solveConnections(date_today, playerCallback);
        const shareable = generateConnectionsShareable(state, connections)
        await sendMessage(shareable, payload.message.chat.id, 0, null, 0, "MarkdownV2")
        scores[connections.id]["bot"] = 4 - state.attempts
        await store_connections_scores(scores)
        return [state, connections]
    },
    "schedule": async (payload, args) => {
        console.log("received schedule command with args: " + args)
        let time
        let name
        try {
            time = parseInt(args[0])
            name = to_words(args.slice(1).join(" ")).join(" ")
        } catch (err) {
            return sendMessage("Something went wrong in scheduling, remember the format is: `/ schedule unixtime(seconds) name`", payload.message.chat.id, 0, null)
        }
        console.log("time: " + time + ", name: " + name, "now: " + (Date.now() / 1000))
        let timeNow = Date.now() / 1000
        let timeSet = new Date(time * 1000)
        if (isNaN(time) || time < timeNow || isNaN(timeSet) || name == null) {
            return sendMessage("date or name is invalid, needs to be in the future and a unix timestamp in seconds and name needs not be empty", payload.message.chat.id, 0, null)
        }

        let jobs = await get_job_data()
        jobs.push({
            "chatId": payload.message.chat.id,
            "time": time,
            "name": name,
            "type": "reminder30",
        })
        await store_job_data(jobs)

        return sendMessage("Scheduled job: " + name + ", at: " + timeSet, payload.message.chat.id, 0, null)
    }
}

export default {
    //handles cron jobs
    async scheduled(event, env, ctx) {
        ENV = env
        switch (event.cron) {
            case "*/5 * * * *": // every five minutes
                console.log("Processing jobs")
                let jobs = await get_job_data()
                console.log("jobs: " + JSON.stringify(jobs))

                let msgs = []
                let origCount = jobs.length
                jobs = jobs.filter(j => {
                    if (j.type && j.type === "reminder30") {
                        let timeUntil = j.time - Math.floor(Date.now() / 1000)
                        if (timeUntil > 0) {
                            if (timeUntil < 1800) {
                                msgs.push(async () => sendMessage(j.name + " is happening in less than 30 mins: " + j.name, j.chatId, 0, null))
                                return false
                            }
                            return true
                        }
                    }
                    return false
                })

                for (let i = 0; i < msgs.length; i++) {
                    await msgs[i]()
                }
                if (jobs.length != origCount) {
                    await store_job_data(jobs)
                }

                break;
            case "0 8 * * *": // every morning
                console.log("Firing off wordle")
                await sendMessage("Mornin' babes', it's wordlin time", ENV.MAIN_CHAT_ID, 0, null, 0.0)
                await COMMANDS.wordle({ message: { chat: { id: ENV.MAIN_CHAT_ID } } }, [])
                await COMMANDS.connections({ message: { chat: { id: ENV.MAIN_CHAT_ID } } }, [])
                break;

        }
    },

    // message structure:
    //   { 
    //     "message_id": 64,
    //    "from": {
    //       "id": 6924901817,
    //       "is_bot": false,
    //       "first_name": "Maks",
    //       "last_name": "Bober",
    //     "username": "bobererer",
    //     "language_code": "en"
    //   },
    //   "chat": {
    //     "id": -1002105029990,
    //     "title": "Haestkuk - Shia",
    //     "type": "supergroup"
    //   },
    //   "date": 1705067530,
    //   "text": "Martiner?"
    // }

    async fetch(request, env, ctx) {
        // for easy access
        ENV = env;
        console.log("fetch callback")
        try {
            if (request.method === "POST") {
                const payload = await request.json()
                // Getting the POST request JSON payload
                if ('message' in payload && payload.message.text) {

                    console.log("Received telegram message from chat: " + (payload.message.chat.title || payload.message.chat.id))
                    console.log("Chat type: " + payload.message.chat.type)
                    let included_ids = await get_included_ids()
                    if (payload.message.text.startsWith("/")) {
                        console.log("it's a command")
                        let split_cmd = payload.message.text.split('@')[0].split(' ')
                        console.log(split_cmd)
                        let cmd_word = split_cmd[0].replace("/","")
                        if(included_ids[payload.message.from.id] !== true && !["info","optin","optout"].includes(cmd_word)) {
                            return new Response("ok")
                        }

                        let cmd = COMMANDS[cmd_word]
                        split_cmd.shift()
                        if (cmd) {
                            await cmd(payload, split_cmd)
                        }
                        return new Response("OK")
                    }

                    if (included_ids[payload.message.from.id] !== true) {
                        console.log("user not in inclusion list, ignoring message");
                        return new Response("Ok")
                    }
                    console.log("user in inclusion list")

                    let words = to_words(payload.message.text)
                    if (words.length > 10) {
                        return new Response("Ok")
                    }
                    const senderName = payload.message.from.first_name ? payload.message.from.first_name :
                        payload.message.from.username ? payload.message.from.username : undefined

                    console.log("processing triggers")
                    console.log("Message is from: " + JSON.stringify(payload.message.from))
                    await connections_slur(payload.message.text, payload.message.chat.id, payload.message.from.id, senderName, payload.message.message_id);
                    await wordle_slur(payload.message.text, payload.message.chat.id, payload.message.from.id, senderName, payload.message.message_id);
                    await hardlyfier(words, payload.message.chat.id, payload.message.message_id);
                    await sickomode(payload.message.from.first_name, payload.message.chat.id, payload.message.message_id);
                    await keywords(words, payload.message.chat.id, payload.message.from.id, payload.message.message_id);
                    await screamo(payload.message.chat.id, payload.message.from.id)
                } else {
                    console.log(JSON.stringify(payload || {}))
                }
            }
        } catch (error) {
            await sendMessage(`Error: ${error}, stack trace: ${console.trace()}`, ENV.GOD_ID, 0, null)
        }
        return new Response("OK") // Doesn't really matter
    },
};


const COMMON_RIPOSTES = [
    "I beat your ass :#",
    "Loser",
    "pfft",
    "amateur",
    "hah",
    "cute",
    "lol",
    "embarassing",
    "bitch",
    "do you want private lessons?",
    "maybe hard mode isn't for you.."
]

// waits for messages of the form: Connections\nPuzzle #413
async function connections_slur(raw_message, chatId, senderId, senderName, message_id) {
    let parse = parseConnectionsScoreFromShareable(raw_message);

    if (parse) {
        const { id, mistakes } = parse;
        const connections_no = id;
        console.log("Connections match: ", raw_message, "id: ", id, "mistakes: ", mistakes)
        let scores = await get_connections_scores()
        if (!("names" in scores)) {
            scores["names"] = {}
        }
        console.log("storing sender name: ", senderId)
        scores["names"][senderId] = senderName

        if (!(connections_no in scores)) {
            scores[connections_no] = {}
        }
        let bot_score = scores[connections_no]["bot"] ? scores[connections_no]["bot"] : 999
        console.log("bot score: ", bot_score)
        scores[connections_no][senderId] = mistakes
        await store_connections_scores(scores)

        if (bot_score < mistakes) {
            const messages = [...COMMON_RIPOSTES, "It's connectin time"]
            return sendMessage(sample(messages), chatId, 0, message_id, 0.9)
        }
    }
}


// waits for messages of the form: Wordle 1,134 5/6* ...
// and parses them to determine a response and possibly store the score
async function wordle_slur(raw_message, chatId, senderId, senderName, message_id) {
    const wordle_regex = /Wordle ([\d,\.]+) ([\dX]+\/\d+).*/
    const match = raw_message.match(wordle_regex)
    if (match) {
        console.log("Wordle match: " + raw_message)
        const wordle_no = parseInt(match[1].replace(",", "").replace('.',""))
        const guesses = match[2].split("/")
        const count = guesses[0] == 'X' ? 7 : parseInt(guesses[0])

        let scores = await get_wordle_scores()
        if (!("names" in scores)) {
            scores["names"] = {}
        }
        console.log("storing sender name: ", senderId)
        scores["names"][senderId] = senderName

        if (!(wordle_no in scores)) {
            scores[wordle_no] = {}
        }
        let bot_score = scores[wordle_no]["bot"] ? scores[wordle_no]["bot"] : 999
        scores[wordle_no][senderId] = count
        await store_wordle_scores(scores)

        if (bot_score < count) {
            const messages = [
                ...COMMON_RIPOSTES, "It's wordlin time"
            ]
            return sendMessage(sample(messages), chatId, 0, message_id, 0.9)
        }
    }
}

export async function call_tts(text) {
    let response = await fetch("https://api.openai.com/v1/audio/speech", {
        method: "POST",
        headers: {
            "Accept": "application/json",
            "Content-Type": "application/json",
            "Authorization": "Bearer " + ENV.OPEN_AI_KEY
        },
        body: JSON.stringify({
            "model": "tts-1",
            "input": text,
            "voice": "onyx",
            "response_format": "opus"
        })
    });

    if (response.ok) {
        const blob = await response.blob();
        return blob;
    } else {
        throw new Error("Error in tts call: " + JSON.stringify(await response.json()));
    }
}
// calls chat gpt with the given message history and returns the response
// the messages alternate between assistant and user messages starting from a system message
// i.e. [system, user, assistant, user, assistant ...]
export async function call_gpt(message_history, model="gpt-3.5-turbo") {
    let history = message_history.map((m, i) => ({
        "role": i == 0 ? "system" : (i % 2 == 0 ? "assistant" : "user"),
        "content": m
    }));
    console.log("calling chat gpt with history: ", history)
    let response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
            "Accept": "application/json",
            "Content-Type": "application/json",
            "Authorization": "Bearer " + ENV.OPEN_AI_KEY
        },
        body: JSON.stringify({
            "model": model,
            "max_tokens": 40,
            "messages": history
        })
    }).then(res => res.json())
        .then(json => {
            if (!json.choices || json.choices.length == 0) {
                throw new Error(JSON.stringify(json))
            }
            return json.choices[0].message.content
        })
        .catch(err => console.log("error from open API call: " + err));
    return response;
}

async function get_kv_object(key, cache_seconds, defaultVal = "{}") {
    let data = await ENV.KV_STORE.get(key, { cacheTtl: cache_seconds });
    if (!data) {
        data = defaultVal
        await ENV.KV_STORE.put(key, data)
    }
    console.log("Retrieved data: " + data + " at key: " + key)
    return JSON.parse(data)
}

async function store_kv_object(key, value) {
    if (value != null && value != undefined) {
        console.log("storing: " + value + " at key: " + key)
        let data = JSON.stringify(value);
        await ENV.KV_STORE.put(key, data)
    } else {
        console.log("Could not store KV object as it was null")
    }
}

async function get_connections_scores() {
    return await get_kv_object("connections_scores", 60)
}

async function store_connections_scores(scores) {
    return store_kv_object("connections_scores", scores)
}

async function get_wordle_scores() {
    return await get_kv_object("wordle_scores", 60)
}

async function store_wordle_scores(scores) {
    return store_kv_object("wordle_scores", scores)
}

async function get_included_ids() {
    return await get_kv_object("excluded_users", 60)
}

async function store_included_ids(ids) {
    return store_kv_object("excluded_users", ids)
}

async function get_affection_data() {
    return get_kv_object("affection_data", 60)
}

async function store_affection_data(data) {
    return store_kv_object("affection_data", data)
}

async function get_job_data() {
    return get_kv_object("jobs", 60, "[]")
}

async function store_job_data(data) {
    return store_kv_object("jobs", data)
}

async function get_attack_data() {
    return get_kv_object("attacks", 60, "[]")
}

async function store_attack_data(data) {
    return store_kv_object("attacks", data)
}

// pick random element in array
function sample(arr) {
    if (arr.length) {
        return arr[Math.floor(Math.random() * arr.length)]
    } else {
        return null
    }
}

function to_words(message) {
    return message.split(' ').map(word => word.replace(/[^a-zA-Z0-9]/g, '').trim().toLowerCase())
}

// returns integer corresponding to the sentiment in the given word list using the AFINN list of sentiment keyword pairs
// words must be normalised to lower case
function calculate_sentiment(words) {
    if (words.length > 0) {
        console.log("Calculating sentiment for: " + words)
        let sentiment_carriers = words.map(w => AFINN[w]).filter(Boolean)
        if (sentiment_carriers.length == 0) { return 0 }
        return sentiment_carriers.reduce((a, b) => a + b, 0) / sentiment_carriers.length
    } else {
        return 0
    }
}

async function screamo(chatId, message_id) {
    if (Math.random() < 0.001) {
        await sendMessage("AAAAAAAaaaaaaa", chatId, DEFAULT_MSG_DELAY, message_id, 1)
        await sendMessage("aaaa AAaa Aaaa AAAAA aaaa a a a a a a a a a", chatId, DEFAULT_MSG_DELAY, message_id, 1)
        return true;
    }
    return false;
}

// very funi hardly know er joke generator, returns true if the trigger was satisfied, regardless of if the action actually fired
async function hardlyfier(words, chatId, message_id) {
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
        await sendMessage(text, chatId, DEFAULT_MSG_DELAY, message_id, AUDIO_MESSAGE_CHANCE)
    }
    return hers.length > 0
}

// very funi keyword reactions, scans messages for keywords and replies with pre-set phrases, returns true if the trigger was satisfied, regardless if the action actually fired
async function keywords(words, chatId, senderId, message_id) {
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
            let affection_data = await get_affection_data();
            if (trigger.gpt_prompt && (Math.random() < gpt_chance)) {
                // TODO: get few messages before this one as well
                console.log("Calling chat gpt for this one. :)")
                let relationship_prompt = "no previous relationship";
                let affection_value = affection_data[senderId]
                let affection_level = Math.min(Math.floor(Math.abs(affection_value) / SENTIMENT_PER_AFFECTION_LEVEL), MAX_AFFECTION_LEVEL)
                console.log("Absolute affection level: " + affection_level)
                if (affection_value != null) {
                    if (affection_value > 0) {
                        relationship_prompt = POSITIVE_AFFECTION_PROMPTS[affection_level - 1]
                    } else {
                        relationship_prompt = NEGATIVE_AFFECTION_PROMPTS[affection_level - 1]
                    }
                }
                let response = await call_gpt([SYSTEM_PROMPT + "." + "RELATIONSHIP_SUMMARY: " + relationship_prompt + ". PROMPT: " + sample(trigger.gpt_prompt)]);
                if (response) {
                    await sendMessage(response, chatId, DEFAULT_MSG_DELAY, message_id, AUDIO_MESSAGE_CHANCE)
                } else {
                    console.error("Error in calling chat gpt")
                }
            } else {
                // analyse sentiment and pick appropriate variation from the sentiment variations
                console.log("Triggered");
                let sentiment = calculate_sentiment(words)
                if (affection_data[senderId] == null) {
                    affection_data[senderId] = sentiment
                } else {
                    affection_data[senderId] += sentiment
                }
                await store_affection_data(affection_data);
                console.log("Sentiment: " + sentiment);
                console.log("positive variants: " + trigger.pos_sent_variations)
                console.log("negative variants: " + trigger.neg_sent_variations)
                const text = sentiment >= 0 ? sample(trigger.pos_sent_variations) : sample(trigger.neg_sent_variations)
                console.log("variant: " + text)
                await sendMessage(text, chatId, DEFAULT_MSG_DELAY, message_id, AUDIO_MESSAGE_CHANCE)
            }
        }
    }
    return trigger != null
}

// very funi roasts aimed at sender
async function sickomode(sender, chatId, message_id) {
    let firing = Math.random() < SICKOMODE_PROBABILITY;
    if (!firing) {
        return
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

    let random = Math.floor(Math.random() * sickomodes.length);

    await sendMessage(sender + ", " + sickomodes[random], chatId, DEFAULT_MSG_DELAY, message_id, AUDIO_MESSAGE_CHANCE);
}

async function sendMessage(msg, chatId, delay, reply_to_message_id, audio_chance = 0, parse_mode = null) {
    if (audio_chance > 0 && Math.random() < audio_chance) {
        console.log("sending audio message: " + msg);
        return await generateAndSendAudio(msg, chatId, delay, reply_to_message_id)
    }

    console.log("sending message: " + msg);
    // Calling the API endpoint to send a telegram message
    if (delay > 0) {
        // delay by provided amount of seconds + random seconds between 0 and 10
        const variance = Math.floor(Math.random() * 10);
        await new Promise((resolve) => setTimeout(resolve, (delay + variance) * 1000));
    }
    const reply_param = reply_to_message_id ? `& reply_to_message_id=${reply_to_message_id}` : ''
    const parse_arg = parse_mode ? `parse_mode=${parse_mode}&` : ''
    const url = `https://api.telegram.org/bot${ENV.TELEGRAM_API_KEY}/sendMessage?${parse_arg}chat_id=${chatId}&text=${encodeURI(msg)}${reply_param}`
    const data = await fetch(url);
    if (data.ok) {
        console.log("message went ok")
        return await data.json()
    } else {
        console.log("error in sending message")
        console.log(JSON.stringify(await data.json()))
    }
}

async function sendAudio(audio, chatId, delay, reply_to_message_id) {
    let form = new FormData();
    form.append('voice', audio);
    form.append('chat_id', chatId);
    if (reply_to_message_id) {
        form.append('reply_to_message_id', reply_to_message_id);
    }
    let response = await fetch(`https://api.telegram.org/bot${ENV.TELEGRAM_API_KEY}/sendVoice`, {
        method: "POST",
        body: form
    });

    if (response.ok) {
        return await response.json()
    } else {
        console.log("Error in sending audio: " + JSON.stringify(await response.json()))
        return null
    }
}

async function generateAndSendAudio(text, chatId, delay, reply_to_message_id) {
    let audio = await call_tts(text);
    console.log("audio type: " + audio.type);
    console.log("audio size: " + audio.size);
    return await sendAudio(audio, chatId, delay, reply_to_message_id);
}
