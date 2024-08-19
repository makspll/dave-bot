import { read_raw_args } from "@src/argparse.js"

it("parses various arguments", async () => {

    const args = read_raw_args(`hello "hello" "hello world" hello=world hello="hello world`)
    expect(args).toEqual(["hello", "hello", "hello world", "hello=world", "hello=hello world"])
})