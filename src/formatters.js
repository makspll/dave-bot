
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
export function generateLeaderboard(scores, sort_by, title = "Leaderboard") {
    // first of all sort scores by sort_by score kind, depending on the score kind it can be ascending or descending
    let ascending = scores.scorekinds[sort_by].ascending;
    // sort scores.scores by sort_by
    scores.scores = Object.fromEntries(Object.entries(scores.scores).sort((a, b) => {
        let compA = a[1][sort_by] ? a[1][sort_by] : (ascending ? Infinity : -Infinity);
        let compB = b[1][sort_by] ? b[1][sort_by] : (ascending ? Infinity : -Infinity);
        if (ascending) {
            return compA - compB;
        } else {
            return compB - compA;
        }
    }));

    // generate leaderboard string, make it aligned and pretty
    let emojis = ['🥇', '🥈', '🥉', '🏅', '🎖️'];
    while (emojis.length < Object.keys(scores.scores).length) {
        emojis.push('💩');
    }
    let longest_emoji = Math.max(...emojis.map(x => x.length));
    let missing_score_value = "N/A";

    let name_column_length = Math.max(Object.keys(scores.scores).reduce((a, b) => a.length > b.length ? a : b).length + longest_emoji, title.length);
    let score_column_lengths = {};
    for (const scorekind in scores.scorekinds) {
        score_column_lengths[scorekind] = Math.max(...Object.values(scores.scores).map(x => x[scorekind] ? x[scorekind].toString().length : missing_score_value.length), scores.scorekinds[scorekind].title.length);
    }
    console.log(scores.scorekinds)
    let headers = `${title} | ${Object.values(scores.scorekinds).map(k => k.title).join(" | ")}\n`;
    let rows = ''
    for (const [name, user_scores] of Object.entries(scores.scores)) {
        let name_and_emoji = `${emojis.shift()} ${name}`;
        let name_padding = name_and_emoji.padEnd(name_column_length, ' ');
        let score_padding = Object.entries(scores.scorekinds).map(([kind, value]) => (user_scores[kind] ? user_scores[kind] : missing_score_value).toString().padEnd(score_column_lengths[kind], ' ')).join(" | ");
        rows += `${name_padding} | ${score_padding}\n`;
    }
    return headers + rows;
}

// accepts a dictionary from game id to name to score i.e. {game_id: {name: score}}
// and converts it into a leaderboard format by calculating metrics based on the score
// the score must be a number and the larger number is treated as a worse score. a 0 is the perfect score
export function convertDailyScoresToLeaderboard(scores) {
    let name_to_metrics = {}
    for (const [game_id, player_scores] of Object.entries(scores)) {
        let all_player_daily_average = 0
        const day_players_count = Object.keys(player_scores).length
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
            all_player_daily_average += score
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
    }
    
    // generate leaderoard dictionary
    let leaderboard = {
        "scores": name_to_metrics,
        "scorekinds": {
            "Avg.": {
                "title": "Avg.",
                "ascending": true
            },
            "Games": {
                "title": "Games",
                "ascending": true
            },
            "Games (3+)": {
                "title": "Games (3+)",
                "ascending": true
            },
            "Avg. Delta": {
                "title": "Avg. Delta",
                "ascending": true
            }
        }
    }
    
    return leaderboard
}