import { getCurrentTabId } from '../../util/establishMultitabRole';
import { selectTabState } from '../selectors';
import { updateTabState } from './tabs';
export function updateStatistics(global, chatId, statistics, ...[tabId = getCurrentTabId()]) {
    return updateTabState(global, {
        statistics: {
            byChatId: {
                ...selectTabState(global, tabId).statistics.byChatId,
                [chatId]: statistics,
            },
        },
    }, tabId);
}
export function updateMessageStatistics(global, statistics, ...[tabId = getCurrentTabId()]) {
    return updateTabState(global, {
        statistics: {
            ...selectTabState(global, tabId).statistics,
            currentMessage: statistics,
            currentStory: undefined,
        },
    }, tabId);
}
export function updateStoryStatistics(global, statistics, ...[tabId = getCurrentTabId()]) {
    return updateTabState(global, {
        statistics: {
            ...selectTabState(global, tabId).statistics,
            currentStory: statistics,
            currentMessage: undefined,
        },
    }, tabId);
}
export function updateStatisticsGraph(global, chatId, name, update, ...[tabId = getCurrentTabId()]) {
    const { statistics } = selectTabState(global, tabId);
    return updateTabState(global, {
        statistics: {
            ...statistics,
            byChatId: {
                ...statistics.byChatId,
                [chatId]: {
                    ...(statistics.byChatId[chatId] || {}),
                    [name]: update,
                },
            },
        },
    }, tabId);
}
export function updateChannelMonetizationStatistics(global, statistics, ...[tabId = getCurrentTabId()]) {
    return updateTabState(global, {
        statistics: {
            ...selectTabState(global, tabId).statistics,
            monetization: statistics,
        },
    }, tabId);
}
export function updateVerifyMonetizationModal(global, update, ...[tabId = getCurrentTabId()]) {
    const tabState = selectTabState(global, tabId);
    if (!tabState.monetizationVerificationModal) {
        return global;
    }
    return updateTabState(global, {
        monetizationVerificationModal: {
            ...tabState.monetizationVerificationModal,
            ...update,
        },
    }, tabId);
}
