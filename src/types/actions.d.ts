
declare global {
    interface Action {
        (message: TelegramMessage, settings: ChatbotSettings): Promise<boolean>
    }
}

export { }
