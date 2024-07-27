export function escapeMarkdown(text) {
    const specialChars = /[\\`*_{}\[\]()#+\-\.!]/g;
    return text.replace(specialChars, '\\$&');
}