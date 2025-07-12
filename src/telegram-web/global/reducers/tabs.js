import { getCurrentTabId } from '../../util/establishMultitabRole';
export function updateTabState(global, tabStatePartial, ...[tabId = getCurrentTabId()]) {
    return {
        ...global,
        byTabId: {
            ...global.byTabId,
            [tabId]: {
                ...global.byTabId[tabId],
                ...tabStatePartial,
            },
        },
    };
}
