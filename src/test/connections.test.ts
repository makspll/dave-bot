import { printDateToNYTGameId } from "@src/utils.js";
import { generateConnectionsShareable, parseConnectionsScoreFromShareable, solveConnections } from "../connections.js";
import { makeMockServer } from "../server.js";
import { compareMultilineStrings } from "./utils/utils.test.js";


let server = makeMockServer();

beforeEach(() => {
    server = makeMockServer();
    server.listen();
});

afterEach(() => {
    server.close();
});

it("Solves connections for 2024-07-28", async () => {
    // mock open AI 
    const [state, connections] = await solveConnections(new Date("2024-07-28"), async (state, last_guess) => {
        state.tiles.sort()
        const words = state.tiles.slice(0, 4);
        return words;
    })
    const shareable = generateConnectionsShareable(state, connections)
    console.log(shareable)
    compareMultilineStrings(shareable, `
        Connections
        Puzzle 413 
        🟪🟦🟨🟪
        🟪🟦🟨🟪
        🟪🟦🟨🟪
        🟪🟦🟨🟪
    `)
});

it("Parses connections with 4 mistakes correctly", async () => {
    const message = 'Connections\nPuzzle #443\n🟨🟪🟨🟩\n🟪🟨🟨🟦\n🟩🟩🟦🟪\n🟦🟩🟪🟦'

    const { id, mistakes } = parseConnectionsScoreFromShareable(message)!;
    expect(id).toBe(443);
    expect(mistakes).toBe(4);
})

it('print date calculated correctly for years in the future', async () => {
    let currentDate = new Date('2023-06-12')
    let connectionsNumber = 1

    while (connectionsNumber < 4000) {
        let out = printDateToNYTGameId(currentDate, new Date('2023-06-12'))
        expect(out).toBe(connectionsNumber)
        currentDate.setDate(currentDate.getDate() + 1)
        connectionsNumber++;
    }

    expect(413).toBe(printDateToNYTGameId(new Date('2024-07-28'), new Date('2023-06-12')))
})


it('parses shareable score from', async () => {
    let puzzle = "Connections Puzzle #443\n🟨🟪🟨🟩🟪🟨🟨🟦\n🟩🟩🟦🟪\n🟦🟩🟪🟦"
    let score = parseConnectionsScoreFromShareable(puzzle)
    expect(score).toEqual({ id: 443, mistakes: 4 })
})