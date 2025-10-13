import { SocialScore } from "./types/social_score.js";

export const SOCIAL_SCORE_REGEX = /(\w+)\s*([+-])\s*socialscore\s*(-?\d+(?:\.\d+)?)/gi;

export function parse_social_score(entry: string): SocialScore | null {
    // the 3rd word
    const regex = SOCIAL_SCORE_REGEX;
    const match = entry.match(regex);

    if (!match) {
        return null
    }
    const user = match[0];
    const sign = match[1];
    const score = Number.parseInt(match[2]!);

    return {
        'user': user,
        'score': sign == '+' ? + score : - score
    };
}