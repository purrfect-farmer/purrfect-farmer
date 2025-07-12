import { getCurrentTabId } from '../../../util/establishMultitabRole';
import { addTabStateResetterAction } from '../../helpers/meta';
import { addActionHandler } from '../../index';
import { closeNewContactDialog, updateUserSearch } from '../../reducers';
import { updateTabState } from '../../reducers/tabs';
import { selectIsCurrentUserFrozen } from '../../selectors';
addActionHandler('setUserSearchQuery', (global, actions, payload) => {
    const { query, tabId = getCurrentTabId(), } = payload;
    return updateUserSearch(global, {
        globalUserIds: undefined,
        localUserIds: undefined,
        fetchingStatus: Boolean(query),
        query,
    }, tabId);
});
addActionHandler('openAddContactDialog', (global, actions, payload) => {
    const { userId, tabId = getCurrentTabId() } = payload;
    if (selectIsCurrentUserFrozen(global)) {
        actions.openFrozenAccountModal({ tabId });
        return global;
    }
    return updateTabState(global, {
        newContact: { userId },
    }, tabId);
});
addActionHandler('openNewContactDialog', (global, actions, payload) => {
    const { tabId = getCurrentTabId() } = payload || {};
    if (selectIsCurrentUserFrozen(global)) {
        actions.openFrozenAccountModal({ tabId });
        return global;
    }
    return updateTabState(global, {
        newContact: {
            isByPhoneNumber: true,
        },
    }, tabId);
});
addActionHandler('closeNewContactDialog', (global, actions, payload) => {
    const { tabId = getCurrentTabId() } = payload || {};
    return closeNewContactDialog(global, tabId);
});
addActionHandler('closeSuggestedStatusModal', (global, actions, payload) => {
    const { tabId = getCurrentTabId() } = payload || {};
    return updateTabState(global, {
        suggestedStatusModal: undefined,
    }, tabId);
});
addTabStateResetterAction('closeChatRefundModal', 'chatRefundModal');
