import { convertDailyScoresToLeaderboard, generateLeaderboard, LeaderboardScores } from "../formatters.js"
import { compareMultilineStrings } from "./utils/utils.test.js"



it('correctly generates leaderboard', async () => {
    let leaderboard: LeaderboardScores = {
        scores: new Map(),
        scorekinds: new Map()
    }
    leaderboard.scores.set("apple", new Map([["avg", { value: 3, rank: 0 }]]))
    leaderboard.scores.set("cherry", new Map([["avg", { value: 4, rank: 0 }], ["games", { value: 1, rank: 0 }]]))
    leaderboard.scorekinds.set("avg", { title: "Average", ascending: true })
    leaderboard.scorekinds.set("games", { title: "Games", ascending: false })

    const stats = generateLeaderboard(leaderboard, 'avg', "Leaderboard")

    compareMultilineStrings(stats, `
        Leaderboard | Average | Games
        --------------------------
        🥇 apple    | 3.00    | N/A  
        🥈 cherry   | 4.00    | 1.00 
    `)
})

it('correctly accounts for delta scores', async () => {
    let leaderboard = {
        scores: new Map(),
        scorekinds: new Map()
    }
    leaderboard.scores.set("apple", new Map([["avg", { value: 3, rank: 0 }]]))
    leaderboard.scores.set("cherry", new Map([["avg", { value: 4, rank: 0 }], ["games", { value: 1, rank: 0 }]]))
    leaderboard.scores.set("new", new Map([["avg", { value: 0, rank: 0 }], ["games", { value: 1, rank: 0 }]]))
    leaderboard.scorekinds.set("avg", { title: "Average", ascending: true })
    leaderboard.scorekinds.set("games", { title: "Games", ascending: false })

    let prev_scores = structuredClone(leaderboard)
    prev_scores.scores.delete("new")
    const stats = generateLeaderboard(leaderboard, 'avg', "Leaderboard", prev_scores)
    compareMultilineStrings(stats, `
    Leaderboard | Average | Games
    --------------------------
    🥇 new  ✨0 | 0.00    | 1.00 
    🥈 apple🔻1 | 3.00    | N/A 
    🥉 cherry🔻1 | 4.00    | 1.00    
    `)
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

    expect(stats).toEqual({
        "scores": new Map([
            ["3", new Map([
                ["avg", { "rank": 0, "value": 3 }],
                ["games", { "rank": 0, "value": 2 }],
                ["avg_delta", { "rank": 0, "value": -1 }]
            ])],
            ["4", new Map([
                ["avg", { "rank": 0, "value": 4 }],
                ["games", { "rank": 0, "value": 1 }],
                ["avg_delta", { "rank": 0, "value": 0 }]
            ])],
            ["5", new Map([
                ["avg", { "rank": 0, "value": 5 }],
                ["games", { "rank": 0, "value": 2 }],
                ["avg_delta", { "rank": 0, "value": 1 }]
            ])]
        ]),
        "scorekinds": new Map([
            ["avg", { "title": "Avg", "ascending": true }],
            ["games", { "title": "N", "ascending": false }],
            ["avg_delta", { "title": "Avg-", "ascending": true }]
        ])
    })
})