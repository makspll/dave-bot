import { ManyArgs, StringArg } from "dave-bot/dist/src/argparse.js";
import { COMMANDS } from "dave-bot/dist/src/commands.js";
import { setMyCommands, setWebhook } from "dave-bot/dist/src/telegram.js";

async function on_deploy(args: string[]) {
    console.log("Running on deploy node hooks");
    let argparse = new ManyArgs([
        new StringArg("telegramApiKey", "Telegram API Key"),
        new StringArg("secretTelegramWebhookToken", "Secret"),
        new StringArg("webhookUrl", "Webhook URL"),
    ]);

    const [telegramApiKey, secretTelegramWebhookToken, webhookUrl] = argparse.get_values(args);
    await setMyCommands({
        api_key: telegramApiKey,
        payload: COMMANDS.map(command => {
            return {
                command: command.name,
                description: command.description()
            }
        })
    })

    await setWebhook(telegramApiKey, webhookUrl, secretTelegramWebhookToken)
}

const args = process.argv.slice(2);
on_deploy(args)