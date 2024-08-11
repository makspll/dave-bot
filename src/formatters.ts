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

function compare_scores(a: MetricBody | undefined, b: MetricBody | undefined, ascending: boolean) {
    let compA = a !== undefined ? a.value : (ascending ? Infinity : -Infinity);
    let compB = b !== undefined ? b.value : (ascending ? Infinity : -Infinity);
    if (ascending) {
        return compA - compB;
    } else {
        return compB - compA;
    }
}

function sort_scores(scores: LeaderboardScores, sort_by_order: MetricId[]) {
    let all_scores = Array.from(scores.scores.entries());
    all_scores.sort(([_a, metricsA], [_b, metricsB]) => {
        for (const sort_metric of sort_by_order) {
            let ascending = scores.scorekinds.get(sort_metric)?.ascending ?? false;
            let diff = compare_scores(metricsA.get(sort_metric), metricsB.get(sort_metric), ascending)

            if (Math.abs(diff) >= 0.01) {
                return diff
            }
        }
        return 0
    });

    all_scores.forEach(([a, b], i) => {
        let m = b.get(sort_by_order[0]);
        if (m) {
            m.rank = i + 1;
        }
    })

    scores.scores = new Map([...all_scores]);
}



export interface LeaderboardScores {
    scores: Map<string, Map<MetricId, MetricBody>>,
    scorekinds: Map<MetricId, MetricDefinition>
}

export function generateLeaderboard(scores: LeaderboardScores, sort_by: MetricId, title = "Leaderboard", previous_scores: LeaderboardScores | null = null) {
    // first of all sort scores by sort_by score kind, depending on the score kind it can be ascending or descending
    // sort scores.scores by sort_by
    sort_scores(scores, [sort_by, "games", "avg_delta"]);
    if (previous_scores) {
        // sort previous_scores.scores by sort_by
        sort_scores(previous_scores, [sort_by, "games", "avg_delta"]);
    }

    // generate leaderboard string, make it aligned and pretty
    let emojis = ['🏆', '🥈', '🥉', '🎖️', '🧻'];
    let change_emojis = ['🔻', '🔺', '✨', '🔴']
    while (emojis.length < scores.scores.size) {
        emojis.push('💩');
    }
    let longest_emoji = Math.max(...emojis.map(x => stringWidth(x)));
    let longest_change_emoji = Math.max(...change_emojis.map(x => stringWidth(x)));
    let longest_name = Math.max(...Object.keys(scores.scores).map(x => stringWidth(x)));
    let title_column_length = Math.max(title.length, longest_name + longest_emoji + longest_change_emoji + 2);
    let missing_score_value = "N/A";

    let score_column_lengths: Map<MetricId, number> = new Map();
    for (const [metricId, definition] of scores.scorekinds) {
        let max = Math.max(stringWidth(definition.title.toString()), 5);
        score_column_lengths.set(metricId, max);
    }

    score_column_lengths.set("games", 2);

    let padded_score_titles = Array.from(scores.scorekinds.entries())
        .map(([k, v]) => stringPad(v.title, score_column_lengths.get(k) ?? 4, ' ', 'center'))
        .join(" | ");

    let headers = `${stringPad(title, title_column_length, ' ', 'center')} | ${padded_score_titles}\n`;
    headers += '-'.repeat(headers.length) + '\n';
    let rows = ''
    for (const [name, user_scores] of scores.scores) {
        let change = '';
        if (previous_scores) {
            let current_metric = user_scores.get(sort_by);
            let previous_user = previous_scores.scores.get(name);
            if (current_metric && previous_user) {
                let previous_metric = previous_user.get(sort_by);
                if (previous_metric) {
                    let rank_change = previous_metric.rank - current_metric.rank;
                    if (rank_change > 0) {
                        change = `🔺${rank_change}`;
                    } else if (rank_change < 0) {
                        change = `🔻${Math.abs(rank_change)}`;
                    }
                }
            } else if (current_metric) {
                change = '💥';
            }
        }

        let name_and_emoji = `${emojis.shift()} ${name}`;
        let name_padding = stringPad(name_and_emoji, title_column_length - stringWidth(change), ' ', 'left');
        let change_padding = stringPad(change, title_column_length - stringWidth(name_padding), ' ', 'right');
        let score_padding = Array.from(scores.scorekinds.keys()).map(metricId => {
            let metricValue = user_scores.get(metricId)
            let metricString;
            if (metricValue === undefined) {
                metricString = missing_score_value
            } else {
                metricString = parseFloat(metricValue.value.toFixed(2)).toString()
            }

            return stringPad(metricString, score_column_lengths.get(metricId) ?? 4, ' ')
        }).join(" | ");
        rows += `${name_padding}${change_padding} | ${score_padding}\n`;
    }
    return headers + rows;
}

// accepts a dictionary from game id to name to score i.e. {game_id: {name: score}}
// and converts it into a leaderboard format by calculating metrics based on the score
// the score must be a number and the larger number is treated as a worse score. a 0 is the perfect score
export function convertDailyScoresToLeaderboard(scores: Scores, show_games_3_plus = false): LeaderboardScores {
    let name_to_metrics: Map<string, Map<MetricId, MetricBody>> = new Map()

    for (const [game_id, player_scores] of Object.entries(scores)) {
        let all_player_daily_average = 0
        const day_players_count = Object.keys(player_scores).filter(x => x != "bot").length
        for (const [player_id, score] of Object.entries(player_scores)) {
            if (!(name_to_metrics.has(player_id))) {
                let player_metrics: Map<MetricId, MetricBody> = new Map()
                player_metrics.set("avg", { value: 0, rank: 0 })
                player_metrics.set("games", { value: 0, rank: 0 })
                player_metrics.set("games_3_plus", { value: 0, rank: 0 })
                player_metrics.set("avg_delta", { value: 0, rank: 0 })
                name_to_metrics.set(player_id, player_metrics)
            }
            let player_metrics = name_to_metrics.get(player_id)!
            player_metrics.get("avg")!.value += score
            player_metrics.get("games")!.value += 1
            if (day_players_count >= 3) {
                player_metrics.get("games_3_plus")!.value += 1
            }
            all_player_daily_average += player_id == "bot" ? 0 : score
        }
        if (day_players_count > 0) {
            all_player_daily_average /= day_players_count
        }

        if (day_players_count < 3) {
            continue // we need at least 3 players to calculate a reasonable delta, so ignore days when not enough players played
        }

        for (const [player_id, score] of Object.entries(player_scores)) {
            let player_metrics = name_to_metrics.get(player_id)!
            player_metrics.get("avg_delta")!.value += score - all_player_daily_average
        }
    }

    // finalize the metrics
    for (const [player_id, metrics] of name_to_metrics.entries()) {
        let avg = metrics.get("avg")!
        let games = metrics.get("games")!
        let games_3_plus = metrics.get("games_3_plus")!
        let avg_delta = metrics.get("avg_delta")!
        avg.value = avg.value / games.value
        if (games_3_plus.value > 0) {
            avg_delta.value = avg_delta.value / games_3_plus.value
        }

        if (!show_games_3_plus) {
            metrics.delete("games_3_plus")
        }
    }

    // generate leaderoard dictionary
    let metric_definitions: Map<MetricId, MetricDefinition> = new Map()
    metric_definitions.set("avg", { title: "Avg", ascending: true })
    metric_definitions.set("games", { title: "N", ascending: false })
    metric_definitions.set("games_3_plus", { title: "Games (3+)", ascending: false })
    metric_definitions.set("avg_delta", { title: "Avg-", ascending: true })

    let leaderboard = {
        "scores": name_to_metrics,
        "scorekinds": metric_definitions
    }

    if (!show_games_3_plus) {
        leaderboard.scorekinds.delete("games_3_plus")
    }

    return leaderboard
}
