import { ManyArgs, StringArg } from "dave-bot/dist/src/argparse.js";
import { COMMANDS } from "dave-bot/dist/src/commands.js";
import { setMyCommands, setWebhook } from "dave-bot/dist/src/telegram.js";
import { get_settings } from "dave-bot/dist/src/get_settings.js";
import { Env } from "dave-bot/dist/src/main.js";
import { flush_logs, inject_logger, LogBatcher } from "dave-bot/dist/src/logging.js";
import { ChatbotSettings } from "dave-bot/dist/src/types/settings.js";

async function on_deploy(args: string[], settings: ChatbotSettings) {
    console.log("Running on deploy node hooks");
    await setMyCommands({
        api_key: settings.telegram_api_key,
        payload: COMMANDS.map(command => {
            return {
                command: command.name,
                description: command.description()
            }
        })
    })

    await setWebhook(settings.telegram_api_key, settings.worker_url, settings.telegram_webhook_secret)
}



async function main() {
    const args = process.argv.slice(2);
    let settings = get_settings(process.env as unknown as Env)
    console.log(process.env.TELEGRAM_API_KEY)
    inject_logger(settings, { service: "dave", environment: settings.environment })
    try {
        console.log("Running on deploy node hooks")
        await on_deploy(args, settings)
    } catch (error) {
        console.error("Error running on_deploy", error)
        await flush_logs(settings)
        throw error
    }

    await flush_logs(settings)
}

await main()