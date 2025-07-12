import { getCurrentTabId } from '../../util/establishMultitabRole';
import { selectTabState } from './tabs';
export function selectCurrentGlobalSearchQuery(global, ...[tabId = getCurrentTabId()]) {
    return selectTabState(global, tabId).globalSearch.query;
}
