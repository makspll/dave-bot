import { SocialScore } from "./types/social_score.js";

export const SOCIAL_SCORE_REGEX = /([\w\s]+?)\s*socialscore\s*(-?\d+(?:\.\d+)?)(?:\.\s+|\s+)(.*)/i;

export function parse_social_score(entry: string): SocialScore | null {
    // the 3rd word
    const regex = SOCIAL_SCORE_REGEX;
    const match = regex.exec(entry);

    if (!match) {
        return null
    }
    const user = match[1];
    const score = Math.round(Number.parseFloat(match[2]));
    const reason = match[3];

    return {
        'user': user,
        'score': score,
        'reason': reason
    };
}