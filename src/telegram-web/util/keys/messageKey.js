export function getMessageKey(message) {
    const { chatId, } = message;
    if ('randomId' in message) {
        return buildMessageKey(chatId, Number(message.randomId));
    }
    return buildMessageKey(chatId, message.previousLocalId || message.id);
}
export function getMessageServerKey(message) {
    if (isLocalMessageId(message.id)) {
        return undefined;
    }
    const { chatId, id } = message;
    return buildMessageKey(chatId, id);
}
export function buildMessageKey(chatId, msgId) {
    return `msg${chatId}-${msgId}`;
}
export function parseMessageKey(key) {
    const match = key.match(/^msg(-?\d+)-(\d+)/);
    return { chatId: match[1], messageId: Number(match[2]) };
}
export function isLocalMessageId(id) {
    return !Number.isInteger(id);
}
