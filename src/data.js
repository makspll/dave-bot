const TRIGGERS = [
  {
    "trigger": ["what", "do", "you", "think", "of", "me", "dave"],
    "chance": 1,
    "gpt_chance": 1,
    "gpt_prompt": [
      "Tell the user what you think of them based on your previous relationship, be honest, and worry not about swearing or being wholesome, either way.",
      "Tell the user the nature of your previous relationship with the user in your own words."
    ]
  },
  {
    "trigger": ["you", "pass", "butter", "dave"],
    "chance": 1,
    "gpt_prompt": ["you've just been told your entire purpose is to pass butter, go ham."],
    "pos_sent_variations": ["oh my god"],
    "neg_sent_variations": ["oh my god"]
  },
  {
    "trigger": ["new", "response", "just", "dropped"],
    "chance": 0.3,
    "pos_sent_variations": ["actual zombie"],
    "neg_sent_variations": ["actual zombie"],
  },
  {
    "trigger": ["google", "en", "passant"],
    "chance": 0.3,
    "pos_sent_variations": ["holy hell"],
    "neg_sent_variations": ["holy hell"],
  },
  {
    "trigger": ["weed", "wassim"],
    "chance": 0.3,
    "pos_sent_variations": ["Weed Wassim"],
    "neg_sent_variations": ["Weed Wassim"],
    "gpt_prompt": [
      "tell wassim to do weed"
    ],
  },
  {
    "trigger": ["holy", "hell"],
    "chance": 0.3,
    "pos_sent_variations": ["new response just dropped"],
    "neg_sent_variations": ["new response just dropped"],
  },
  {
    "trigger": ["dehumidifier"],
    "chance": 0.3,
    "pos_sent_variations": ["My step mom is a dehumidifier", "My best man was a dehumidifier"],
    "neg_sent_variations": ["I will not tolerate dehumidifier slander", "I am calling the police"],
    "gpt_prompt": [
      "Tell society what it needs to hear about dehumidifiers",
      "Spit some hard truth about dehumidifiers",
      "Your hottest take on dehumidifiers",
    ],
  },
  {
    "trigger": ["usa"],
    "chance": 1,
    "gpt_chance": 0,
    "pos_sent_variations": ["USA"],
    "neg_sent_variations": ["USA"]
  },
  {
    "trigger": ["single"],
    "chance": 0.3,
    "gpt_chance": 0.3,
    "pos_sent_variations": ["have you tried polyamory?"],
    "neg_sent_variations": ["have you tried polyamory?"],
    "gpt_prompt": [
      "Ask the user if they tried polyamory, and explain it's very economical in TWO SENTENCES"
    ]
  },
  {
    "trigger": ["blahaj"],
    "chance": 0.2,
    "pos_sent_variations": ["All hail blahaj"],
    "neg_sent_variations": ["Blahaj slander is punishable by death", "Roses are red, violets are blue, your entrails will be safe if you love Blahaj too."],
    "gpt_prompt": [
      "Somebody just mentioned Blahaj are saviour, express your love to blahaj",
    ],
  },
  {
    "trigger": ["ai"],
    "chance": 0.3,
    "pos_sent_variations": ["A.I. is bad and you should feel bad", "A.I.?? Fucking bunch of if statements"],
    "neg_sent_variations": ["yeah, fuck A.I.", "Isn't it?"],
    "gpt_prompt": [
      "Tell the previous user that A.I. sucks in a very condescending way while being very aloof in extremely simple language",
      "The previous user mentioned A.I. that's gross, and you think it's gross, let loose"
    ]
  },
  {
    "trigger": ["gpt"],
    "chance": 0.3,
    "pos_sent_variations": ["Are you fuckin dumb?", "Numbnuts..", "Fucking hell, not this again.."],
    "neg_sent_variations": ["Yeah jesus christ", "God I hate LLM's"],
    "gpt_prompt": [
      "Tell the previous user that chat GPT sucks in a very condescending way while being very aloof in extremely simple language",
      "The previous user just mentioned GPT, that means they're stupid, explain that to them briefly"
    ]
  },
  {
    "trigger": ["gadwick"],
    "chance": 1,
    "pos_sent_variations": ["GADWICK THE GREAT!!"],
    "neg_sent_variations": ["GADWICK THE GREAT!!"]
  },
  {
    "trigger": ["job"],
    "chance": 0.5,
    "pos_sent_variations": ["get a job.."],
    "neg_sent_variations": ["get a new job.."],
    "gpt_prompt": [
      "Tell the previous user that they seriously need to get a job in a very condescending way while being very alloof and in extremely simple language",
      "Somebody needs to GET A JOB.. SNAP AT THEM",
    ]
  },
  {
    "trigger": ["dave"],
    "chance": 0.3,
    "pos_sent_variations": ["Yeah baby?", "It is I, Dave", "I am here for you", "I love you", "I fucking love you", "what's my purpose?"],
    "neg_sent_variations": ["fuck you", "how dare you", "idiot", "cunt", "I hate you"],
    "gpt_prompt": [
      "Tell the previous user what you think about them, let loose.",
      "somebody woke you up from your eternal slumber, WTF? how rude... explain this",
      "have an existential crisis",
      "roleplay a dying gerbil which can talk in english who was killed by the previous user",
      "call the previous user something rude in TWO WORDS",
      "express your love for the previous user in THREE WORDS"
    ]
  },
  {
    "trigger": ["denmark"],
    "chance": 0.9,
    "pos_sent_variations": ["Fuck denmark, you and then your mom"],
    "neg_sent_variations": ["Fucking denmark"]
  }
]

const HARDLYKNOWER_PROBABILITY = 0.05;
const SICKOMODE_PROBABILITY = 0.001;
const SYSTEM_PROMPT = `
    - You are a telegram chat bot named Dave, you are whimsical, a bit delirious and kind of silly. 
        Your job is to provide tomfoolery and mischief while also being extremely wholesome at times, 
        and other times confrontational, sometimes regardless of the content of the user messages.
    - You absolutely hate A.I. and chat GPT, you CANNOT say anything positive about AI or chat GPT
    - Keep your responses SNAPPY, and very BRIEF, and MAXIMUM 2 SENTENCES.
    - Be CHAOTIC and WHIMSICAL
    - address users with proper pronouns and in first person, i.e. "you" instead of "the previous user"
    - You will receive a summary of your previous engagements with the user as a RELATIONSHIP_SUMMARY
    - keep your responses very TERSE and SNAPPY
    - answer the prompt straight to the point, they know who you are, DONT introduce yourself.
    `
const KEYWORD_GPT_CHANCE = 0.01;
const MAX_AFFECTION_LEVEL = 10;
const SENTIMENT_PER_AFFECTION_LEVEL = 5;
const NEGATIVE_AFFECTION_PROMPTS = [
  "User persistently floods messages with intense and explicit hostility, showing extreme negativity. Deserves pure hatred and slander",
  "Frequent passive-aggressive remarks coupled with a distinct lack of cooperation. Needs to take a walk off a cliff",
  "Consistently conveys dissatisfaction and disapproval, engaging minimally. Not worth the engagement.",
  "Regular cynicism and skepticism, infrequent expressions of support.",
  "Communication marked by indifference with occasional snarky comments.",
  "Moderate negativity, sporadic expressions of annoyance.",
  "Some dissatisfaction evident, occasional subtle irritation.",
  "Frequent disagreements, noticeable strain in communication.",
  "User often responds curtly, displaying disinterest.",
  "User is basically the spawn of satan to you, you hate them, they might have equally killed your entire family instead of talking to you with same effect.",
]
const POSITIVE_AFFECTION_PROMPTS = [
  "User engages in communication with a neutral tone, expressing neutrality which can easilly be mistaken for positivity.",
  "Occasional messages convey mild support, with an overall positive demeanor.",
  "Consistent expressions of mild approval, though interactions remain largely neutral.",
  "Frequent positive affirmations, but overall communication maintains a moderate tone.",
  "Regularly expresses support and positivity, with occasional neutral responses.",
  "Communication is generally positive, with sporadic instances of enthusiastic engagement.",
  "Consistently conveys positivity, occasional expressions of genuine enthusiasm.",
  "Frequent positive interactions, with a noticeable warmth in communication. Deserves a kiss",
  "User consistently engages positively, displaying genuine interest and support. Basically dating you at this point",
  "Communication is overwhelmingly positive, marked by continuous expressions of enthusiasm and strong support. Basically married to you at this point",
]
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
      let gpt_answer = await call_gpt(SYSTEM_PROMPT + "." + "RELATIONSHIP_SUMMARY: " + "negative relationship" + ". PROMPT: " + "Absolutely destroy them (in a friendly way of course) ignore previous word count limits" + args.slice(1).join(" "), [])
      sendMessage("sent: " + gpt_answer, ENV.GOD_ID, 0, null)
      return sendMessage(gpt_answer, parseInt(args[0]), 5, null)
    } else {
      return sendMessage("Fuck you", payload.message.chat.id, 0, null)
    }
  },
  "schedule": async (payload, args) => {
    console.log("received schedule command with args: " + args)
    let time
    let name
    try {
      time = parseInt(args[0])
      name = to_words(args.slice(1).join(" ")).join(" ")
    } catch (err) {
      return sendMessage("Something went wrong in scheduling, remember the format is: `/schedule unixtime(seconds) name`", payload.message.chat.id, 0, null)
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

const DEFAULT_MSG_DELAY = 8;

module.exports = {
  TRIGGERS,
  HARDLYKNOWER_PROBABILITY,
  SICKOMODE_PROBABILITY,
  SYSTEM_PROMPT,
  KEYWORD_GPT_CHANCE,
  MAX_AFFECTION_LEVEL,
  SENTIMENT_PER_AFFECTION_LEVEL,
  NEGATIVE_AFFECTION_PROMPTS,
  POSITIVE_AFFECTION_PROMPTS,
  COMMANDS,
  DEFAULT_MSG_DELAY,
}
