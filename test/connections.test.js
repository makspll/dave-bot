import { generateConnectionsShareable, solveConnections } from "../src/connections.js";
import { makeMockServer } from "./server.js";

let server = makeMockServer();

beforeEach(() => {
    server = makeMockServer();
    server.listen();
});

afterEach(() => {
    server.close();
});

it("Solves connections for 2024-07-27", async () => {
    const [state, connections] = await solveConnections(new Date("2024-07-27"), async (state) => {
        const words = state.tiles.slice(0, 4);
        return words.join(",");
    })
    console.log(generateConnectionsShareable(state, connections));
});