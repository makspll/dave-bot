import stringWidth from "string-width";
import { stringPad } from "./utils.js";

// expects a dictionary of the form:
// {
//      "scores" : {
//          "name": { 
//              "scorekind": scorevalue
//          }
//      }, 
//      "scorekinds": {
//          "scorekind": {
//              "title": "Title",
//              "ascending": false
//          }
//      }
// }

function sort_scores(scores, sort_by) {
    let ascending = scores.scorekinds[sort_by].ascending;
    scores.scores = Object.fromEntries(Object.entries(scores.scores).sort((a, b) => {
        let compA = a[1][sort_by] !== undefined ? a[1][sort_by] : (ascending ? Infinity : -Infinity);
        let compB = b[1][sort_by] !== undefined ? b[1][sort_by] : (ascending ? Infinity : -Infinity);
        if (ascending) {
            return compA - compB;
        } else {
            return compB - compA;
        }
    }));
    // append `rank` to each score
    for (const [i, [name, user_scores]] of Object.entries(Object.entries(scores.scores))) {
        user_scores.rank = parseInt(i) + 1;
    }
}

export function generateLeaderboard(scores, sort_by, title = "Leaderboard", previous_scores = null) {
    // first of all sort scores by sort_by score kind, depending on the score kind it can be ascending or descending
    let ascending = scores.scorekinds[sort_by].ascending;
    // sort scores.scores by sort_by
    sort_scores(scores, sort_by);
    if (previous_scores) {
        // sort previous_scores.scores by sort_by
        sort_scores(previous_scores, sort_by);
    }

    // generate leaderboard string, make it aligned and pretty
    let emojis = ['🏆', '🥈', '🥉', '🎖️', '🧻'];
    let change_emojis = ['🔻', '🔺', '✨', '🔴']
    while (emojis.length < Object.keys(scores.scores).length) {
        emojis.push('💩');
    }
    let longest_emoji = Math.max(...emojis.map(x => stringWidth(x)));
    let longest_change_emoji = Math.max(...change_emojis.map(x => stringWidth(x)));
    let longest_name = Math.max(...Object.keys(scores.scores).map(x => stringWidth(x)));
    let title_column_length = Math.max(title.length, longest_name + longest_emoji + longest_change_emoji + 2);
    let missing_score_value = "N/A";
    
    let score_column_lengths = {};
    for (const scorekind in scores.scorekinds) {
        score_column_lengths[scorekind] = Math.max(stringWidth(scores.scorekinds[scorekind].title.toString()), 4);
    }

    score_column_lengths["Games"] = 2

    let headers = `${stringPad(title, title_column_length, ' ', 'center')} | ${Object.entries(scores.scorekinds).map(([k,v]) => stringPad(v.title, score_column_lengths[k], ' ', 'center')).join(" | ")}\n`;
    headers += '-'.repeat(headers.length) + '\n';
    let rows = ''
    for (const [name, user_scores] of Object.entries(scores.scores)) {
        let change = '';
        if (previous_scores && name in previous_scores.scores) {
            // find previous rank
            let previous_rank = previous_scores.scores[name].rank;
            let rank_change = previous_rank - user_scores.rank;
            if (rank_change > 0) {
                change = `🔺${rank_change}`;
            } else if (rank_change < 0) {
                change = `🔻${Math.abs(rank_change)}`;
            } else {
                change = ''
            }
        } else if (previous_scores){
            change = '💥';
        }

        let name_and_emoji = `${emojis.shift()} ${name}`;
        let name_padding = stringPad(name_and_emoji, title_column_length - stringWidth(change), ' ', 'left');
        let change_padding = stringPad(change, title_column_length - stringWidth(name_padding), ' ', 'right');
        let score_padding = Object.entries(scores.scorekinds).map(([kind, _]) => {
            let value = user_scores[kind] !== undefined ? parseFloat(user_scores[kind].toFixed(2)) : missing_score_value;
            return stringPad(value.toString(), score_column_lengths[kind], ' ')
        }
        ).join(" | ");
        rows += `${name_padding}${change_padding} | ${score_padding}\n`;
    }
    return headers + rows;
}

// accepts a dictionary from game id to name to score i.e. {game_id: {name: score}}
// and converts it into a leaderboard format by calculating metrics based on the score
// the score must be a number and the larger number is treated as a worse score. a 0 is the perfect score
export function convertDailyScoresToLeaderboard(scores, show_games_3_plus = false) {
    let name_to_metrics = {}
    for (const [game_id, player_scores] of Object.entries(scores)) {
        let all_player_daily_average = 0
        const day_players_count = Object.keys(player_scores).filter(x => x != "bot").length
        for (const [player_id, score] of Object.entries(player_scores)) {
            if(!(player_id in name_to_metrics)) {
                name_to_metrics[player_id] = {}
                name_to_metrics[player_id]["Avg."] = 0
                name_to_metrics[player_id]["Games"] = 0
                name_to_metrics[player_id]["Games (3+)"] = 0
                name_to_metrics[player_id]["Avg. Delta"] = 0
            }
            name_to_metrics[player_id]["Avg."] += score
            name_to_metrics[player_id]["Games"] += 1
            if (day_players_count >= 3) {
                name_to_metrics[player_id]["Games (3+)"] += 1
            }
            all_player_daily_average += player_id == "bot" ? 0 : score
        }
        if (day_players_count > 0) {
            all_player_daily_average /= day_players_count
        }

        if (day_players_count < 3) {
            continue // we need at least 3 players to calculate a reasonable delta, so ignore days when not enough players played
        }

        for(const [player_id, score] of Object.entries(player_scores)) {
            name_to_metrics[player_id]["Avg. Delta"] += score - all_player_daily_average // negative if player is above average (i.e their score is smaller than the average)
        }
    }

    // finalize the metrics
    for (const [player_id, metrics] of Object.entries(name_to_metrics)) {
        metrics["Avg."] = metrics["Avg."] / metrics["Games"]
        if (metrics["Games (3+)"] > 0) {
            metrics["Avg. Delta"] = metrics["Avg. Delta"] / metrics["Games (3+)"]
        }

        if (!show_games_3_plus) {
            delete metrics["Games (3+)"]
        }
    }
    
    // generate leaderoard dictionary
    let leaderboard = {
        "scores": name_to_metrics,
        "scorekinds": {
            "Avg.": {
                "title": "Avg",
                "ascending": true
            },
            "Games": {
                "title": "N",
                "ascending": true
            },
            "Games (3+)": {
                "title": "Games (3+)",
                "ascending": true
            },
            "Avg. Delta": {
                "title": "Avg-",
                "ascending": true
            }
        }
    }

    if (!show_games_3_plus) {
        delete leaderboard.scorekinds["Games (3+)"]
    }
    
    return leaderboard
}
