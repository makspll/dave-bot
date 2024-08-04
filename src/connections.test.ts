import { generateConnectionsShareable, parseConnectionsScoreFromShareable, printDateToConnectionsNumber, solveConnections } from "./connections.js";
import { makeMockServer } from "./server.js";

let server = makeMockServer();

beforeEach(() => {
    server = makeMockServer();
    server.listen();
});

afterEach(() => {
    server.close();
});

it("Solves connections for 2024-07-28", async () => {
    const [state, connections] = await solveConnections(new Date("2024-07-28"), async (state) => {
        const words = state.tiles.slice(0, 4);
        return words.join(",");
    })
    console.log(generateConnectionsShareable(state, connections));
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
        let out = printDateToConnectionsNumber(currentDate)
        expect(out).toBe(connectionsNumber)
        currentDate.setDate(currentDate.getDate() + 1)
        connectionsNumber++;
    }

    expect(413).toBe(printDateToConnectionsNumber(new Date('2024-07-28')))
})
