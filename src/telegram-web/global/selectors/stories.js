import { getCurrentTabId } from '../../util/establishMultitabRole';
import { selectPeer } from './peers';
import { selectTabState } from './tabs';
export function selectCurrentViewedStory(global, ...[tabId = getCurrentTabId()]) {
    const { storyViewer: { peerId, storyId } } = selectTabState(global, tabId);
    return { peerId, storyId };
}
export function selectIsStoryViewerOpen(global, ...[tabId = getCurrentTabId()]) {
    const { peerId, storyId } = selectCurrentViewedStory(global, tabId);
    return Boolean(peerId) && Boolean(storyId);
}
export function selectPeerStories(global, peerId) {
    return global.stories.byPeerId[peerId];
}
export function selectPeerStory(global, peerId, storyId) {
    return selectPeerStories(global, peerId)?.byId[storyId];
}
export function selectPinnedStories(global, peerId) {
    const stories = selectPeerStories(global, peerId);
    if (!stories?.pinnedIds?.length)
        return undefined;
    return stories.pinnedIds.map((id) => stories.byId[id]).filter((s) => (s && 'isInProfile' in s && s.isInProfile));
}
export function selectPeerFirstUnreadStoryId(global, peerId) {
    const peerStories = selectPeerStories(global, peerId);
    if (!peerStories) {
        return undefined;
    }
    if (!peerStories.lastReadId) {
        return peerStories.orderedIds?.[0];
    }
    const lastReadIndex = peerStories.orderedIds.findIndex((id) => id === peerStories.lastReadId);
    return peerStories.orderedIds?.[lastReadIndex + 1];
}
export function selectPeerFirstStoryId(global, peerId) {
    return selectPeerStories(global, peerId)?.orderedIds?.[0];
}
export function selectStoryListForViewer(global, peerId, storyId, isSingleStory, isSinglePeer, isPrivate, isArchive) {
    const currentStoryId = storyId
        || selectPeerFirstUnreadStoryId(global, peerId)
        || selectPeerFirstStoryId(global, peerId);
    if (!currentStoryId) {
        return undefined;
    }
    if (isSingleStory) {
        return {
            peerIds: [peerId],
            storyIdsByPeerId: { [peerId]: [currentStoryId] },
        };
    }
    const peer = selectPeer(global, peerId);
    const story = selectPeerStory(global, peerId, currentStoryId);
    if (!peer || !story) {
        return undefined;
    }
    const isUnread = (global.stories.byPeerId[peerId].lastReadId || 0) < story.id;
    if (isSinglePeer) {
        const storyIds = getPeerStoryIdsForViewer(global, peerId, isUnread, isArchive, isPrivate);
        return storyIds?.length
            ? { peerIds: [peerId], storyIdsByPeerId: { [peerId]: storyIds } }
            : undefined;
    }
    const { orderedPeerIds: { active, archived } } = global.stories;
    const orderedPeerIds = (peer.areStoriesHidden ? archived : active) ?? [];
    const peerIds = [];
    const storyIdsByPeerId = {};
    for (const currentPeerId of orderedPeerIds) {
        const storyIds = getPeerStoryIdsForViewer(global, currentPeerId, isUnread, isArchive, isPrivate);
        if (storyIds?.length) {
            peerIds.push(currentPeerId);
            storyIdsByPeerId[currentPeerId] = storyIds;
        }
    }
    return peerIds.length ? { peerIds, storyIdsByPeerId } : undefined;
}
function getPeerStoryIdsForViewer(global, peerId, isUnread, isArchive, isPrivate) {
    const peerStories = selectPeerStories(global, peerId);
    const storySourceProp = isArchive ? 'archiveIds' : isPrivate ? 'profileIds' : 'orderedIds';
    const storyIds = peerStories?.[storySourceProp];
    if (!peerStories || !storyIds?.length) {
        return undefined;
    }
    if (!peerStories.lastReadId || !isUnread) {
        return storyIds.slice();
    }
    const lastReadIndex = storyIds.indexOf(peerStories.lastReadId);
    return (storyIds.length > lastReadIndex + 1)
        ? storyIds.slice(lastReadIndex + 1)
        : undefined;
}
