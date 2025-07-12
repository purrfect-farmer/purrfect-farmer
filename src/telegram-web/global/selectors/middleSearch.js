import { getCurrentTabId } from '../../util/establishMultitabRole';
import { buildChatThreadKey } from '../helpers/middleSearch';
import { selectCurrentMessageList } from './messages';
import { selectTabState } from './tabs';
export function selectCurrentMiddleSearch(global, ...[tabId = getCurrentTabId()]) {
    const { chatId, threadId } = selectCurrentMessageList(global, tabId) || {};
    if (!chatId || !threadId) {
        return undefined;
    }
    const chatThreadKey = buildChatThreadKey(chatId, threadId);
    return selectTabState(global, tabId).middleSearch.byChatThreadKey[chatThreadKey];
}
export function selectCurrentSharedMediaSearch(global, ...[tabId = getCurrentTabId()]) {
    const { chatId, threadId } = selectCurrentMessageList(global, tabId) || {};
    if (!chatId || !threadId) {
        return undefined;
    }
    const chatThreadKey = buildChatThreadKey(chatId, threadId);
    return selectTabState(global, tabId).sharedMediaSearch.byChatThreadKey[chatThreadKey];
}
export function selectCurrentChatMediaSearch(global, ...[tabId = getCurrentTabId()]) {
    const { chatId, threadId } = selectCurrentMessageList(global, tabId) || {};
    if (!chatId || !threadId) {
        return undefined;
    }
    const chatThreadKey = buildChatThreadKey(chatId, threadId);
    return selectTabState(global, tabId).chatMediaSearch.byChatThreadKey[chatThreadKey];
}
export function selectChatMediaSearch(global, chatId, threadId, ...[tabId = getCurrentTabId()]) {
    if (!chatId || !threadId) {
        return undefined;
    }
    const chatThreadKey = buildChatThreadKey(chatId, threadId);
    return selectTabState(global, tabId).chatMediaSearch.byChatThreadKey[chatThreadKey];
}
