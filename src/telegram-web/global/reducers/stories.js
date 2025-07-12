import { isUserId } from '../../util/entities/ids';
import { getCurrentTabId } from '../../util/establishMultitabRole';
import { compareFields, unique } from '../../util/iteratees';
import { getServerTime } from '../../util/serverTime';
import { updateReactionCount } from '../helpers';
import { selectIsChatWithSelf, selectPeer, selectPeerStories, selectPeerStory, selectTabState, selectUser, } from '../selectors';
import { updatePeer } from './peers';
import { updateTabState } from './tabs';
export function addStories(global, newStoriesByPeerId) {
    const updatedByPeerId = Object.entries(newStoriesByPeerId).reduce((acc, [peerId, newPeerStories]) => {
        if (!acc[peerId]) {
            acc[peerId] = newPeerStories;
        }
        else {
            acc[peerId].byId = { ...acc[peerId].byId, ...newPeerStories.byId };
            acc[peerId].orderedIds = unique(newPeerStories.orderedIds.concat(acc[peerId].orderedIds));
            acc[peerId].profileIds = unique(newPeerStories.profileIds.concat(acc[peerId].profileIds)).sort((a, b) => b - a);
            acc[peerId].lastUpdatedAt = newPeerStories.lastUpdatedAt;
            acc[peerId].lastReadId = newPeerStories.lastReadId;
        }
        return acc;
    }, global.stories.byPeerId);
    global = {
        ...global,
        stories: {
            ...global.stories,
            byPeerId: updatedByPeerId,
        },
    };
    return updateOrderedStoriesPeerIds(global, Object.keys(newStoriesByPeerId));
}
export function addStoriesForPeer(global, peerId, newStories, newPinnedIds, addToArchive) {
    const { byId, orderedIds, profileIds, archiveIds, pinnedIds, } = global.stories.byPeerId[peerId] || {};
    const deletedIds = Object.keys(newStories).filter((id) => 'isDeleted' in newStories[Number(id)]).map(Number);
    const updatedById = { ...byId, ...newStories };
    let updatedOrderedIds = [...(orderedIds || [])];
    let updatedArchiveIds = [...(archiveIds || [])];
    const updatedProfileIds = unique([...(profileIds || [])].concat(Object.values(newStories).reduce((ids, story) => {
        if ('isInProfile' in story && story.isInProfile) {
            ids.push(story.id);
        }
        return ids;
    }, []))).sort((a, b) => b - a).filter((storyId) => !deletedIds.includes(storyId));
    updatedOrderedIds = unique(Object.entries(newStories).reduce((acc, [storyId, story]) => {
        if ('expireDate' in story && story.expireDate && story.expireDate > getServerTime()) {
            acc.push(Number(storyId));
        }
        return acc;
    }, updatedOrderedIds)).filter((storyId) => !deletedIds.includes(storyId));
    if (addToArchive && selectIsChatWithSelf(global, peerId)) {
        updatedArchiveIds = unique(updatedArchiveIds.concat(Object.keys(newStories).map(Number)))
            .sort((a, b) => b - a)
            .filter((storyId) => !deletedIds.includes(storyId));
    }
    global = {
        ...global,
        stories: {
            ...global.stories,
            byPeerId: {
                ...global.stories.byPeerId,
                [peerId]: {
                    ...global.stories.byPeerId[peerId],
                    byId: updatedById,
                    orderedIds: updatedOrderedIds,
                    profileIds: updatedProfileIds,
                    pinnedIds: pinnedIds || newPinnedIds,
                    ...(addToArchive && { archiveIds: updatedArchiveIds }),
                },
            },
        },
    };
    if (selectIsChatWithSelf(global, peerId)
        || selectUser(global, peerId)?.isContact
        || peerId === global.appConfig?.storyChangelogUserId) {
        global = updatePeerLastUpdatedAt(global, peerId);
        global = updateOrderedStoriesPeerIds(global, [peerId]);
    }
    return global;
}
export function updateStoriesForPeer(global, peerId, peerStories) {
    return {
        ...global,
        stories: {
            ...global.stories,
            byPeerId: {
                ...global.stories.byPeerId,
                [peerId]: peerStories,
            },
        },
    };
}
export function updatePeerStoriesFullyLoaded(global, peerId, isFullyLoaded, isArchive) {
    return {
        ...global,
        stories: {
            ...global.stories,
            byPeerId: {
                ...global.stories.byPeerId,
                [peerId]: {
                    ...global.stories.byPeerId[peerId],
                    [isArchive ? 'isArchiveFullyLoaded' : 'isFullyLoaded']: isFullyLoaded,
                },
            },
        },
    };
}
export function updateLastReadStoryForPeer(global, peerId, lastReadId) {
    const { orderedIds } = selectPeerStories(global, peerId) || {};
    if (!orderedIds) {
        return global;
    }
    if (lastReadId >= orderedIds[orderedIds.length - 1]) {
        global = updatePeer(global, peerId, {
            hasUnreadStories: false,
        });
    }
    return {
        ...global,
        stories: {
            ...global.stories,
            byPeerId: {
                ...global.stories.byPeerId,
                [peerId]: {
                    ...global.stories.byPeerId[peerId],
                    lastReadId,
                },
            },
        },
    };
}
export function updateLastViewedStoryForPeer(global, peerId, lastViewedId, ...[tabId = getCurrentTabId()]) {
    const { orderedIds } = selectPeerStories(global, peerId) || {};
    if (!orderedIds || !orderedIds.includes(lastViewedId)) {
        return global;
    }
    const { storyViewer } = selectTabState(global, tabId);
    return updateTabState(global, {
        storyViewer: {
            ...storyViewer,
            lastViewedByPeerId: {
                ...storyViewer.lastViewedByPeerId,
                [peerId]: lastViewedId,
            },
        },
    }, tabId);
}
export function updatePeersWithStories(global, storiesByPeerId) {
    Object.entries(storiesByPeerId).forEach(([peerId, { lastReadId, orderedIds }]) => {
        const peer = selectPeer(global, peerId);
        if (!peer)
            return;
        global = updatePeer(global, peerId, {
            hasStories: true,
            hasUnreadStories: !lastReadId
                || Boolean(lastReadId && lastReadId < (peer.maxStoryId || orderedIds[orderedIds.length - 1])),
        });
    });
    return global;
}
export function updateStoryViews(global, storyId, views, nextOffset, ...[tabId = getCurrentTabId()]) {
    const tabState = selectTabState(global, tabId);
    const { viewModal } = tabState.storyViewer;
    const newViews = viewModal?.storyId === storyId && viewModal.views ? [
        ...viewModal.views,
        ...views,
    ] : views;
    global = updateStoryViewsLoading(global, false, tabId);
    return updateTabState(global, {
        storyViewer: {
            ...tabState.storyViewer,
            viewModal: {
                ...viewModal,
                storyId,
                views: newViews,
                nextOffset,
                isLoading: false,
            },
        },
    }, tabId);
}
export function updateStoryViewsLoading(global, isLoading, ...[tabId = getCurrentTabId()]) {
    const tabState = selectTabState(global, tabId);
    const { viewModal } = tabState.storyViewer;
    if (!viewModal)
        return global;
    return updateTabState(global, {
        storyViewer: {
            ...tabState.storyViewer,
            viewModal: {
                ...viewModal,
                isLoading,
            },
        },
    }, tabId);
}
export function removePeerStory(global, peerId, storyId) {
    const { orderedIds, profileIds, lastReadId, byId, } = selectPeerStories(global, peerId) || { orderedIds: [], profileIds: [] };
    const newOrderedIds = orderedIds.filter((id) => id !== storyId);
    const newProfileIds = profileIds.filter((id) => id !== storyId);
    const lastStoryId = newOrderedIds.length ? orderedIds[orderedIds.length - 1] : undefined;
    const previousStoryId = orderedIds[orderedIds.indexOf(storyId) - 1];
    const newLastReadId = lastReadId === storyId ? previousStoryId : lastReadId;
    const newById = {
        ...byId,
        [storyId]: { id: storyId, peerId, isDeleted: true },
    };
    const lastUpdatedAt = lastStoryId ? newById[lastStoryId]?.date : undefined;
    const hasStories = Boolean(newOrderedIds.length);
    global = updatePeer(global, peerId, {
        hasStories,
        hasUnreadStories: Boolean(hasStories && lastReadId && lastStoryId && lastReadId < lastStoryId),
    });
    global = updateStoriesForPeer(global, peerId, {
        byId: newById,
        orderedIds: newOrderedIds,
        profileIds: newProfileIds,
        lastUpdatedAt,
        lastReadId: newLastReadId,
    });
    Object.values(global.byTabId).forEach((tab) => {
        if (tab.storyViewer.lastViewedByPeerId && tab.storyViewer.lastViewedByPeerId[peerId] === storyId) {
            global = updateLastViewedStoryForPeer(global, peerId, previousStoryId, tab.id);
        }
    });
    if (!hasStories) {
        global = {
            ...global,
            stories: {
                ...global.stories,
                orderedPeerIds: {
                    active: global.stories.orderedPeerIds.active.filter((id) => id !== peerId),
                    archived: global.stories.orderedPeerIds.archived.filter((id) => id !== peerId),
                },
            },
        };
    }
    return global;
}
export function updateSentStoryReaction(global, peerId, storyId, reaction) {
    const story = selectPeerStory(global, peerId, storyId);
    if (!story || !('content' in story))
        return global;
    const { views } = story;
    const reactionsCount = views?.reactionsCount || 0;
    const hasReaction = views?.reactions?.some((r) => r.chosenOrder !== undefined);
    const reactions = updateReactionCount(views?.reactions || [], [reaction].filter(Boolean));
    const countDiff = !reaction ? -1 : hasReaction ? 0 : 1;
    const newReactionsCount = reactionsCount + countDiff;
    global = updatePeerStory(global, peerId, storyId, {
        sentReaction: reaction,
        views: {
            ...views,
            reactionsCount: newReactionsCount,
            reactions,
        },
    });
    return global;
}
export function updatePeerStory(global, peerId, storyId, storyUpdate) {
    const peerStories = selectPeerStories(global, peerId) || {
        byId: {}, orderedIds: [], profileIds: [], archiveIds: [],
    };
    return {
        ...global,
        stories: {
            ...global.stories,
            byPeerId: {
                ...global.stories.byPeerId,
                [peerId]: {
                    ...peerStories,
                    byId: {
                        ...peerStories.byId,
                        [storyId]: {
                            ...peerStories.byId[storyId],
                            ...storyUpdate,
                        },
                    },
                },
            },
        },
    };
}
export function updatePeerStoryViews(global, peerId, storyId, viewsUpdate) {
    const story = selectPeerStory(global, peerId, storyId);
    if (!story || !('content' in story))
        return global;
    const { views } = story;
    return updatePeerStory(global, peerId, storyId, {
        views: {
            ...views,
            ...viewsUpdate,
        },
    });
}
export function updatePeerProfileStory(global, peerId, storyId, isInProfile) {
    const peerStories = selectPeerStories(global, peerId) || {
        byId: {}, orderedIds: [], profileIds: [], archiveIds: [],
    };
    const newProfileIds = isInProfile
        ? unique(peerStories.profileIds.concat(storyId)).sort((a, b) => b - a)
        : peerStories.profileIds.filter((id) => storyId !== id);
    return {
        ...global,
        stories: {
            ...global.stories,
            byPeerId: {
                ...global.stories.byPeerId,
                [peerId]: {
                    ...peerStories,
                    profileIds: newProfileIds,
                },
            },
        },
    };
}
export function updatePeerStoriesHidden(global, peerId, areHidden) {
    const peer = selectPeer(global, peerId);
    if (!peer)
        return global;
    const currentState = peer.areStoriesHidden;
    if (currentState === areHidden)
        return global; // `updateOrderedStoriesPeerIds` is computationally expensive
    global = updatePeer(global, peerId, {
        areStoriesHidden: areHidden,
    });
    return updateOrderedStoriesPeerIds(global, [peerId]);
}
function updateOrderedStoriesPeerIds(global, updatePeerIds) {
    const { currentUserId, stories: { byPeerId, orderedPeerIds } } = global;
    const allPeerIds = orderedPeerIds.active.concat(orderedPeerIds.archived).concat(updatePeerIds);
    const newOrderedPeerIds = allPeerIds.reduce((acc, peerId) => {
        if (!byPeerId[peerId]?.orderedIds?.length)
            return acc;
        const peer = selectPeer(global, peerId);
        if (peer?.areStoriesHidden) {
            acc.archived.push(peerId);
        }
        else {
            acc.active.push(peerId);
        }
        return acc;
    }, { active: [], archived: [] });
    function compare(peerIdA, peerIdB) {
        const peerA = selectPeer(global, peerIdA);
        const peerB = selectPeer(global, peerIdB);
        const diffCurrentUser = compareFields(currentUserId === peerIdA, currentUserId === peerIdB);
        if (diffCurrentUser)
            return diffCurrentUser;
        const { lastUpdatedAt: luaA = 0, orderedIds: orderedA, lastReadId: lriA = 0 } = byPeerId[peerIdA] || {};
        const hasUnreadA = lriA < orderedA?.[orderedA.length - 1];
        const { lastUpdatedAt: luaB = 0, orderedIds: orderedB, lastReadId: lriB = 0 } = byPeerId[peerIdB] || {};
        const hasUnreadB = lriB < orderedB?.[orderedB.length - 1];
        const diffUnread = compareFields(hasUnreadA, hasUnreadB);
        if (diffUnread)
            return diffUnread;
        const diffPremium = compareFields('isPremium' in peerA, 'isPremium' in peerB);
        if (diffPremium)
            return diffPremium;
        const diffType = compareFields(isUserId(peerIdA), isUserId(peerIdB));
        if (diffType)
            return diffType;
        return compareFields(luaA, luaB);
    }
    newOrderedPeerIds.archived = unique(newOrderedPeerIds.archived)
        .filter((peerId) => byPeerId[peerId]?.orderedIds?.length)
        .sort(compare);
    newOrderedPeerIds.active = unique(newOrderedPeerIds.active)
        .filter((peerId) => byPeerId[peerId]?.orderedIds?.length)
        .sort(compare);
    return {
        ...global,
        stories: {
            ...global.stories,
            orderedPeerIds: newOrderedPeerIds,
        },
    };
}
function updatePeerLastUpdatedAt(global, peerId) {
    const peerStories = global.stories.byPeerId[peerId];
    const lastUpdatedAt = peerStories.orderedIds.reduce((acc, storyId) => {
        const { date } = peerStories.byId[storyId] || {};
        if (date && (!acc || acc < date)) {
            acc = date;
        }
        return acc;
    }, undefined);
    return {
        ...global,
        stories: {
            ...global.stories,
            byPeerId: {
                ...global.stories.byPeerId,
                [peerId]: {
                    ...peerStories,
                    lastUpdatedAt,
                },
            },
        },
    };
}
export function updateStealthMode(global, stealthMode) {
    return {
        ...global,
        stories: {
            ...global.stories,
            stealthMode,
        },
    };
}
