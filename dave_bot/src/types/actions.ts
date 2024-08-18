import { ChatbotSettings } from "./settings.js";
import { TelegramMessage } from "./telegram.js";

export interface Action {
    (message: TelegramMessage, settings: ChatbotSettings): Promise<boolean>
}