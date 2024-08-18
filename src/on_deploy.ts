import { ManyArgs, StringArg } from "./argparse.js";
import { COMMANDS } from "./commands.js";
import { setMyCommands } from "./telegram.js";

function on_deploy(args: string[]) {
    console.log("Running on deploy node hooks");
    let argparse = new ManyArgs([
        new StringArg("telegramApiKey", "Telegram API Key"),
    ]);

    const [telegramApiKey] = argparse.get_values(args);
    setMyCommands({
        api_key: telegramApiKey,
        payload: COMMANDS.map(command => {
            return {
                command: command.name,
                description: command.description()
            }
        })
    })
}

const args = process.argv.slice(2);
on_deploy(args)