export function escapeMarkdown(text: string) {
    const specialChars = /[\\`*_{}\[\]()#+\-\.!]/g;
    return text.replace(specialChars, '\\$&');
}