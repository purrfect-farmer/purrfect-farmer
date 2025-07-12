import { getCurrentTabId } from '../../util/establishMultitabRole';
import { selectTabState } from '../selectors';
import { updateTabState } from './tabs';
export function updateManagementProgress(global, progress, ...[tabId = getCurrentTabId()]) {
    return updateTabState(global, {
        management: {
            ...selectTabState(global, tabId).management,
            progress,
        },
    }, tabId);
}
export function updateManagement(global, chatId, update, ...[tabId = getCurrentTabId()]) {
    const { management } = selectTabState(global, tabId);
    return updateTabState(global, {
        management: {
            ...management,
            byChatId: {
                ...management.byChatId,
                [chatId]: {
                    ...(management.byChatId[chatId] || {}),
                    ...update,
                },
            },
        },
    }, tabId);
}
