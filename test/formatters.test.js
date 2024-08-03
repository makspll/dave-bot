import { expect } from "chai"
import { convertDailyScoresToLeaderboard, generateLeaderboard } from "../src/formatters.js"

it('correctly generates leaderboard', async () => {
    const stats = generateLeaderboard(
        {
            "scores": {
                "apple": {
                    "average": 3
                },
                "cherry": {
                    "average": 4,
                    "games": 1
                }
            },
            "scorekinds": {
                "average": {
                    "title": "Average",
                    "ascending": true
                },
                "games": {
                    "title": "Games",
                    "ascending": false
                }
            }
        }, 'games', "Leaderboard"
    )

    console.log(stats)
})

it('correctly accounts for delta scores', async () => {
    const scores = {
        "scores": {
            "apple": {
                "average": 3
            },
            "cherry": {
                "average": 4,
                "games": 1
            }
        },
        "scorekinds": {
            "average": {
                "title": "Average",
                "ascending": true
            },
            "games": {
                "title": "Games",
                "ascending": false
            }
        }
    }
    const prev_scores = {...scores}
    prev_scores.scores.new = {
        "average": 0,
        "games": 1
    }


    const stats = generateLeaderboard(
        scores, 'games', "Leaderboard", prev_scores
    )

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