export function selectTopicsInfo(global, chatId) {
    return global.chats.topicsInfoById[chatId];
}
export function selectTopics(global, chatId) {
    return selectTopicsInfo(global, chatId)?.topicsById;
}
export function selectTopic(global, chatId, threadId) {
    return selectTopicsInfo(global, chatId)?.topicsById?.[threadId];
}
