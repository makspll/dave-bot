const TRIGGERS = [
    {
        "trigger": ["what", "do", "you", "think", "of" ,"me" ,"dave"],
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
      "chance" : 0.3,
      "pos_sent_variations": ["actual zombie"],
      "neg_sent_variations": ["actual zombie"],
    },
    {
      "trigger": ["google", "en", "passant"],
      "chance" : 0.3,
      "pos_sent_variations": ["holy hell"],
      "neg_sent_variations": ["holy hell"],
    },
    {
      "trigger": ["weed", "wassim"],
      "chance" : 0.3,
      "pos_sent_variations": ["Weed Wassim"],
      "neg_sent_variations": ["Weed Wassim"],
      "gpt_prompt": [
        "tell wassim to do weed"
      ],
    },
    {
      "trigger": ["holy","hell"],
      "chance" : 0.3,
      "pos_sent_variations": ["new response just dropped"],
      "neg_sent_variations": ["new response just dropped"],
    },
    {
      "trigger": ["dehumidifier"],
      "chance" : 0.3,
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
        "gpt_chance" : 0,
        "pos_sent_variations": ["USA"],
        "neg_sent_variations": ["USA"]
    },
    {
        "trigger": ["single"],
        "chance": 0.3,
        "gpt_chance" : 0.3,
        "pos_sent_variations": ["have you tried polyamory?"],
        "neg_sent_variations": ["have you tried polyamory?"],
        "gpt_prompt":[
            "Ask the user if they tried polyamory, and explain it's very economical in TWO SENTENCES"
        ]
    },
    {
      "trigger": ["blahaj"],
      "chance" : 0.2,
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

module.exports = {
  TRIGGERS
}
