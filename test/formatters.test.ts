import { expect } from "chai"
import { convertDailyScoresToLeaderboard, generateLeaderboard } from "../src/formatters.js"

it('correctly generates leaderboard', async () => {
    let leaderboard = {
        scores: new Map(),
        scorekinds: new Map()
    }
    leaderboard.scores.set("apple", { average: 3 })
    leaderboard.scores.set("cherry", { average: 4, games: 1 })
    leaderboard.scorekinds.set("average", { title: "Average", ascending: true })
    leaderboard.scorekinds.set("games", { title: "Games", ascending: false })

    const stats = generateLeaderboard(leaderboard, 'avg', "Leaderboard")

    console.log(stats)
})

it('correctly accounts for delta scores', async () => {
    let leaderboard = {
        scores: new Map(),
        scorekinds: new Map()
    }
    leaderboard.scores.set("apple", { average: 3 })
    leaderboard.scores.set("cherry", { average: 4, games: 1 })
    leaderboard.scores.set("new", { average: 0, games: 1 })
    leaderboard.scorekinds.set("average", { title: "Average", ascending: true })
    leaderboard.scorekinds.set("games", { title: "Games", ascending: false })

    let prev_scores = JSON.parse(JSON.stringify(leaderboard));
    delete prev_scores.scores.new
    const stats = generateLeaderboard(leaderboard, 'avg', "Leaderboard", prev_scores)

    console.log(stats)
})

it('correctly converts daily scores to leaderboard', async () => {
    const stats = convertDailyScoresToLeaderboard(
        {
            "2024-01-01": {
                "3": 3,
                "4": 4,
                "5": 5,
            },
            "2024-01-02": {
                "3": 3,
                "5": 5,
            }
        }
    )

    console.log(stats)

    expect(stats).to.deep.equal({
        "scores": {
            "3": {
                "Avg.": 3.00,
                "Avg. Delta": -1,
                "Games": 2,
                "Games (3+)": 1,
            },
            "4": {
                "Avg.": 4.00,
                "Avg. Delta": 0,
                "Games": 1,
                "Games (3+)": 1,
            },
            "5": {
                "Avg.": 5.00,
                "Avg. Delta": 1,
                "Games": 2,
                "Games (3+)": 1,
            }
        },
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
    })
})