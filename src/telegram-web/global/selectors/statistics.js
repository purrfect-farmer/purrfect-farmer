import { getCurrentTabId } from '../../util/establishMultitabRole';
import { selectChatFullInfo } from './chats';
import { selectCurrentMessageList } from './messages';
import { selectTabState } from './tabs';
export function selectStatistics(global, chatId, ...[tabId = getCurrentTabId()]) {
    return selectTabState(global, tabId).statistics.byChatId[chatId];
}
export function selectIsStatisticsShown(global, ...[tabId = getCurrentTabId()]) {
    if (!selectTabState(global, tabId).isStatisticsShown) {
        return false;
    }
    const { chatId: currentChatId } = selectCurrentMessageList(global, tabId) || {};
    return currentChatId ? selectChatFullInfo(global, currentChatId)?.canViewStatistics : undefined;
}
