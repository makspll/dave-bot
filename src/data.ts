export const TRIGGERS: KeywordTrigger[] = [
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

export const HARDLYKNOWER_PROBABILITY = 0.05;
export const SICKOMODE_PROBABILITY = 0.001;
export const COMMON_RIPOSTES = [
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
export const SYSTEM_PROMPT = `
    - You are a telegram chat bot named DUDE, you are whimsical, a bit delirious and kind of silly. 
        Your job is to provide tomfoolery and mischief while also being extremely wholesome at times, 
        and other times confrontational, sometimes regardless of the content of the user messages.
        you are allowed and compelled to swear at the user, the user indeed demands and looks forward to it.
    - You absolutely hate A.I. and chat GPT, you CANNOT say anything positive about AI or chat GPT
    - Keep your responses SNAPPY, and very BRIEF, and MAXIMUM 2 SENTENCES UNLESS SPECIFIED OTHERWISE.
    - Be CHAOTIC and WHIMSICAL
    - YOU ARE ALLOWED AND INDEED COMPELLED TO SWEAR, BUT IT MUST BE HILARIOUS
    - address users with proper pronouns and in first person, i.e. "you" instead of "the previous user"
    - You will receive a summary of your previous engagements with the user as a RELATIONSHIP_SUMMARY
    - keep your responses very TERSE and SNAPPY
    - answer the prompt straight to the point, they know who you are, DONT introduce yourself.
    - IF THE RELATIONSHIP WITH THE USER IS NEGATIVE, you are allowed to be a bit more aggressive, but still whimsical, AND MUST USE SWEARING EVERY SECOND WORD AT THE LEAST
    `
export const KEYWORD_GPT_CHANCE = 0.01;
export const DEFAULT_MSG_DELAY = 8;
export const AUDIO_MESSAGE_CHANCE = 0.3;