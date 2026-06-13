import axios from 'axios';
import { escapeMarkdown } from './markdown.js';
import { PoopleScore } from './types/poople.js';


// Poople·#302·7/6¶
// ⬜️⬜️⬜️⬜️¶
// ⬜️⬜️⬜️⬜️¶
// 🟫⬜️⬜️⬜️¶
// 🟫🟫⬜️⬜️¶
// ⬜️🟫⬜️⬜️¶
// ⬜️🟫🟫⬜️¶
// ⬜️🟫🟫🟫¶
// 🟫🟫🟫🟫¶
// ¶
// Poople #302 7/6
// ⬜️⬜️⬜️⬜️
// ⬜️⬜️⬜️⬜️
// 🟫⬜️⬜️⬜️
// 🟫🟫⬜️⬜️
// ⬜️🟫⬜️⬜️
// ⬜️🟫🟫⬜️
// ⬜️🟫🟫🟫
// 🟫🟫🟫🟫
// 
// https://poople.io/
export function score_from_poople_shareable(shareable: string): PoopleScore {
    // the 3rd word
    const split = shareable.split(' ');
    const number = parseInt(split[1].replace('#', ''));
    const scores = split[2].split('/');
    const guesses = Math.min(parseInt(scores[0]), 1);
    const best = Math.min(parseInt(scores[1]), 1);

    return {
        'poopleNo': number,
        'score': guesses / best,
    };
}

