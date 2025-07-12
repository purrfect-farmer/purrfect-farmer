export function getSearchResultKey(message) {
    const { chatId, id } = message;
    return `${chatId}_${id}`;
}
export function parseSearchResultKey(key) {
    const [chatId, messageId] = key.split('_');
    return [chatId, Number(messageId)];
}
