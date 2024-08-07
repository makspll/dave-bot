// "trigger": ["what", "do", "you", "think", "of", "me", "dave"],
// "chance": 1,
// "gpt_chance": 1,
// "gpt_prompt": [
//   "Tell the user what you think of them based on your previous relationship, be honest, and worry not about swearing or being wholesome, either way.",
//   "Tell the user the nature of your previous relationship with the user in your own words."
// ]
interface KeywordTrigger {
    trigger: string[],
    chance: number,
    gpt_chance?: number,
    gpt_prompt?: string[],
    pos_sent_variations?: string[],
    neg_sent_variations?: string[]
}