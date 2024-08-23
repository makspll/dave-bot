import { MetricBody, MetricId } from "@src/types/formatters.js"
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


describe('convertDailyScoresToLeaderboard', () => {
    it('should convert scores to leaderboard format correctly', () => {
        // Mock data
        const scores = new Map<number, Map<number, number>>([
            [1, new Map<number, number>([
                [101, 10],
                [102, 20],
                [103, 30]
            ])],
            [2, new Map<number, number>([
                [101, 15],
                [102, 25],
                [103, 35]
            ])]
        ]);

        const bot_ids = new Set<number>([103]);
        const player_names = new Map<number, string>([
            [101, 'Player1'],
            [102, 'Player2'],
            [103, 'Bot1']
        ]);

        // Expected output
        const expectedOutput = new Map<string, Map<MetricId, MetricBody>>([
            ['Player1', new Map<MetricId, MetricBody>([
                ['avg', { value: 12.5, rank: 0 }],
                ['games', { value: 2, rank: 0 }],
                ['avg_delta', { value: 0, rank: 0 }]
            ])],
            ['Player2', new Map<MetricId, MetricBody>([
                ['avg', { value: 22.5, rank: 0 }],
                ['games', { value: 2, rank: 0 }],
                ['avg_delta', { value: 0, rank: 0 }]
            ])],
            ['Bot1', new Map<MetricId, MetricBody>([
                ['avg', { value: 32.5, rank: 0 }],
                ['games', { value: 2, rank: 0 }],
                ['avg_delta', { value: 0, rank: 0 }]
            ])]
        ]);

        // Call the function
        const result = convertDailyScoresToLeaderboard(scores, bot_ids, player_names);


        // Assertions
        expect(result.scores).toEqual(expectedOutput);
    });

});