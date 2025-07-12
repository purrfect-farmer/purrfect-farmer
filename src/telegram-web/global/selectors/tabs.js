import { getCurrentTabId } from '../../util/establishMultitabRole';
export function selectTabState(global, ...[tabId = getCurrentTabId()]) {
    return global.byTabId[tabId];
}
