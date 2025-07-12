import { getCurrentTabId } from '../../util/establishMultitabRole';
import { updateTabState } from '../reducers/tabs';
import { addActionHandler } from '..';
export function addTabStateResetterAction(name, key) {
    // @ts-ignore
    addActionHandler(name, (global, actions, payload) => {
        const { tabId = getCurrentTabId() } = payload || {};
        return updateTabState(global, {
            [key]: undefined,
        }, tabId);
    });
}
