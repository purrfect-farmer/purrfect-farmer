import { areDeepEqual } from '../../util/areDeepEqual';
import { getCurrentTabId } from '../../util/establishMultitabRole';
import { omit, omitUndefined, unique } from '../../util/iteratees';
import { MEMO_EMPTY_ARRAY } from '../../util/memo';
import { selectTabState } from '../selectors';
import { updateTabState } from './tabs';
export function replaceUsers(global, newById) {
    return {
        ...global,
        users: {
            ...global.users,
            byId: newById,
        },
    };
}
function updateContactList(global, updatedUsers) {
    const { userIds: contactUserIds } = global.contactList || {};
    if (!contactUserIds)
        return global;
    const contactUserIdsFromUpdate = updatedUsers
        .filter((user) => user?.isContact)
        .map((user) => user.id);
    if (contactUserIdsFromUpdate.length === 0)
        return global;
    return {
        ...global,
        contactList: {
            userIds: unique([
                ...contactUserIdsFromUpdate,
                ...contactUserIds,
            ]),
        },
    };
}
export function updateUser(global, userId, userUpdate) {
    const { byId } = global.users;
    const updatedUser = getUpdatedUser(global, userId, userUpdate);
    if (!updatedUser) {
        return global;
    }
    global = updateContactList(global, [updatedUser]);
    return replaceUsers(global, {
        ...byId,
        [userId]: updatedUser,
    });
}
export function updateUsers(global, newById) {
    const updatedById = Object.keys(newById).reduce((acc, id) => {
        const updatedUser = getUpdatedUser(global, id, newById[id]);
        if (updatedUser) {
            acc[id] = updatedUser;
        }
        return acc;
    }, {});
    global = replaceUsers(global, {
        ...global.users.byId,
        ...updatedById,
    });
    global = updateContactList(global, Object.values(updatedById));
    return global;
}
// @optimization Allows to avoid redundant updates which cause a lot of renders
export function addUsers(global, newById) {
    const { byId } = global.users;
    let isUpdated = false;
    const addedById = Object.keys(newById).reduce((acc, id) => {
        const existingUser = byId[id];
        const newUser = newById[id];
        if (existingUser && !existingUser.isMin && (newUser.isMin || existingUser.accessHash === newUser.accessHash)) {
            return acc;
        }
        const updatedUser = getUpdatedUser(global, id, newUser);
        if (updatedUser) {
            acc[id] = updatedUser;
            if (!isUpdated) {
                isUpdated = true;
            }
        }
        return acc;
    }, {});
    if (!isUpdated) {
        return global;
    }
    global = replaceUsers(global, {
        ...byId,
        ...addedById,
    });
    global = updateContactList(global, Object.values(addedById));
    return global;
}
// @optimization Don't spread/unspread global for each element, do it in a batch
function getUpdatedUser(global, userId, userUpdate) {
    const { byId } = global.users;
    const user = byId[userId];
    const omitProps = [];
    if (userUpdate.isMin && user && !user.isMin) {
        return undefined; // Do not apply updates from min constructor
    }
    if (areDeepEqual(user?.usernames, userUpdate.usernames)) {
        omitProps.push('usernames');
    }
    const updatedUser = {
        ...user,
        ...omit(userUpdate, omitProps),
    };
    if (!updatedUser.id || !updatedUser.type) {
        return undefined;
    }
    return omitUndefined(updatedUser);
}
export function deleteContact(global, userId) {
    const { byId } = global.users;
    const { userIds } = global.contactList || {};
    global = {
        ...global,
        contactList: {
            userIds: userIds ? userIds.filter((id) => id !== userId) : MEMO_EMPTY_ARRAY,
        },
    };
    global = replaceUsers(global, {
        ...byId,
        [userId]: {
            ...byId[userId],
            isContact: undefined,
        },
    });
    global = {
        ...global,
        stories: {
            ...global.stories,
            orderedPeerIds: {
                active: global.stories.orderedPeerIds.active.filter((id) => id !== userId),
                archived: global.stories.orderedPeerIds.archived.filter((id) => id !== userId),
            },
        },
    };
    return updateUserFullInfo(global, userId, {
        settings: undefined,
    });
}
export function updateUserSearch(global, searchStatePartial, ...[tabId = getCurrentTabId()]) {
    return updateTabState(global, {
        userSearch: {
            ...selectTabState(global, tabId).userSearch,
            ...searchStatePartial,
        },
    }, tabId);
}
export function updateUserSearchFetchingStatus(global, newState, ...[tabId = getCurrentTabId()]) {
    return updateUserSearch(global, {
        fetchingStatus: newState,
    }, tabId);
}
export function updateUserBlockedState(global, userId, isBlocked) {
    const { fullInfoById } = global.users;
    const fullInfo = fullInfoById[userId];
    if (!fullInfo) {
        return global;
    }
    return updateUserFullInfo(global, userId, { isBlocked });
}
export function replaceUserStatuses(global, newById) {
    return {
        ...global,
        users: {
            ...global.users,
            statusesById: newById,
        },
    };
}
export function updateUserFullInfo(global, userId, fullInfo) {
    const userFullInfo = global.users.fullInfoById[userId];
    return {
        ...global,
        users: {
            ...global.users,
            fullInfoById: {
                ...global.users.fullInfoById,
                [userId]: {
                    ...userFullInfo,
                    ...fullInfo,
                },
            },
        },
    };
}
export function updateUserCommonChats(global, userId, commonChats) {
    return {
        ...global,
        users: {
            ...global.users,
            commonChatsById: {
                ...global.users.commonChatsById,
                [userId]: commonChats,
            },
        },
    };
}
// @optimization Allows to avoid redundant updates which cause a lot of renders
export function addUserStatuses(global, newById) {
    const { statusesById } = global.users;
    global = replaceUserStatuses(global, {
        ...statusesById,
        ...newById,
    });
    return global;
}
export function closeNewContactDialog(global, ...[tabId = getCurrentTabId()]) {
    return updateTabState(global, {
        newContact: undefined,
    }, tabId);
}
export function updateMissingInvitedUsers(global, chatId, missingUsers, ...[tabId = getCurrentTabId()]) {
    if (!missingUsers.length) {
        return updateTabState(global, {
            inviteViaLinkModal: undefined,
        }, tabId);
    }
    return updateTabState(global, {
        inviteViaLinkModal: {
            missingUsers,
            chatId,
        },
    }, tabId);
}
export function updateBotAppPermissions(global, botId, permissions) {
    const { botAppPermissionsById } = global.users;
    return {
        ...global,
        users: {
            ...global.users,
            botAppPermissionsById: {
                ...botAppPermissionsById,
                [botId]: {
                    ...botAppPermissionsById[botId],
                    ...permissions,
                },
            },
        },
    };
}
export function replacePeerSavedGifts(global, peerId, gifts, nextOffset, ...[tabId = getCurrentTabId()]) {
    const tabState = selectTabState(global, tabId);
    return updateTabState(global, {
        savedGifts: {
            ...tabState.savedGifts,
            giftsByPeerId: {
                ...tabState.savedGifts.giftsByPeerId,
                [peerId]: {
                    gifts,
                    nextOffset,
                },
            },
        },
    }, tabId);
}
