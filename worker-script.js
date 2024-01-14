const HARDLYKNOWER_PROBABILITY=0.05;
const SICKOMODE_PROBABILITY=0.001;
const KEYWORD_PROBABILITY=1;


export default {

  // message structure:
  //   { 
  //     "message_id": 64,
  //     "from": {
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
    if (request.method === "POST") {
      const payload = await request.json() 
      // Getting the POST request JSON payload
      if ('message' in payload && payload.message.text) { 
        let sender = payload.message.from.first_name;
        console.log("Received telegram message from chat: " + (payload.message.chat.title || sender))

        console.log("Sender: " + sender);
        
        // Checking if the payload comes from Telegram
        const chatId = payload.message.chat.id


        console.log("message is: " + payload.message.text)

        let words = to_words(payload.message.text)
        await hardlyfier(words, payload.message.chat.id, env.TELEGRAM_API_KEY);
        await sickomode(sender, payload.message.chat.id, env.TELEGRAM_API_KEY);
        await keywords(words,  payload.message.chat.id, env.TELEGRAM_API_KEY);
        await calldave(words,  payload.message.chat.id, env.TELEGRAM_API_KEY);
        await youpassbutterdave(words,  payload.message.chat.id, env.TELEGRAM_API_KEY);
      }
    }
    return new Response("OK") // Doesn't really matter
  },
};


function to_words(message) {
  return message.split(' ').map(word => word.replace(/\W/g, '').trim().toLowerCase())
}

async function hardlyfier(words, chatId, apiKey) {

  let hers = words.filter(word => {
    let satisfies = word.length > 2 && (word.endsWith('er') || word.endsWith('ers'));
    return satisfies && (Math.random() < HARDLYKNOWER_PROBABILITY)
  }) 

  if (hers.length > 0) {
    const text = hers[0] + "? I hardly know er!!";
    await sendMessage(text, chatId, apiKey)
  }
}

async function keywords(words, chatId, apiKey) {

  console.log("keywords engaged")
  const keyword_insults = {
    "ai" : "A.I. is bad and you should feel bad",
    "gpt" : "I hate it",
    "gadwick" : "GADWICK THE GREAT!!",
    "job": "get a job.."
  }

  let triggers = words.map(word => {
    if (Math.random() < KEYWORD_PROBABILITY) {
      let match = keyword_insults[word];
      console.log("match triggered: " + match)
      return match
    } else {
      return null
    }
  }).filter(a => a);

  if (triggers.length > 0) {
    const text = triggers[0]
    await sendMessage(text, chatId, apiKey)
  }

}

async function sickomode(sender, chatId, apiKey) {
  let firing = Math.random() < SICKOMODE_PROBABILITY;
  if (!firing) {
    return
  }
  console.log("sickomode engaged")


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

  await sendMessage(sender + ". " + sickomodes[random], chatId, apiKey);
}

async function calldave(words, chatId, apiKey){
  console.log("Summon Dave");

  const responses = [
    "What is my purpose?",
    "It is I, Bank of Dave™️."
  ]

  

  if (words.length <=2  && words[words.length - 1] == "dave"){
    let random = Math.floor(Math.random() * responses.length);
    await sendMessage(responses[random], chatId, apiKey)
  }
  else{
    return null;
  }

}


async function youpassbutterdave(words,chatId,apiKey){
  console.log("Explaining Dave's Existence");
  const sentence = words.toString();
  const regex = /you pass butter dave/i; // Adding 'i' flag for case-insensitivity
  const isMatch = regex.test(sentence);
  if (isMatch){
    await sendMessage("Oh my God.", chatId, apiKey)
  }
}

async function sendMessage(msg, chatId, apiKey) {
    console.log("sending message: " + msg);
    // Calling the API endpoint to send a telegram message
    const url = `https://api.telegram.org/bot${apiKey}/sendMessage?chat_id=${chatId}&text=${msg}`
    const data = await fetch(url).then(resp => {
      console.log("Sending message went ok: " + resp.ok)
      console.log(JSON.stringify(resp, null, 4))
      return resp.json()
    }).catch(e => console.log(e));
    
  }

