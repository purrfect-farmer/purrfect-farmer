import { getCurrentTabId } from '../../util/establishMultitabRole';
import { areSortedArraysEqual, areSortedArraysIntersecting, omit, unique, } from '../../util/iteratees';
import { buildChatThreadKey, isMediaLoadableInViewer } from '../helpers';
import { selectTabState } from '../selectors';
import { selectChatMediaSearch } from '../selectors/middleSearch';
import { updateTabState } from './tabs';
function replaceMiddleSearch(global, chatThreadKey, searchParams, ...[tabId = getCurrentTabId()]) {
    const current = selectTabState(global, tabId).middleSearch.byChatThreadKey;
    if (!searchParams) {
        return updateTabState(global, {
            middleSearch: {
                byChatThreadKey: omit(current, [chatThreadKey]),
            },
        }, tabId);
    }
    const { type = 'chat', ...rest } = searchParams;
    return updateTabState(global, {
        middleSearch: {
            byChatThreadKey: {
                ...selectTabState(global, tabId).middleSearch.byChatThreadKey,
                [chatThreadKey]: {
                    type,
                    ...rest,
                },
            },
        },
    }, tabId);
}
export function updateMiddleSearch(global, chatId, threadId, update, ...[tabId = getCurrentTabId()]) {
    const chatThreadKey = buildChatThreadKey(chatId, threadId);
    const currentSearch = selectTabState(global, tabId).middleSearch.byChatThreadKey[chatThreadKey];
    const updated = {
        type: 'chat',
        ...currentSearch,
        ...update,
    };
    if (!updated.isHashtag) {
        updated.type = 'chat';
    }
    if (currentSearch && (currentSearch.type !== updated.type || currentSearch.savedTag !== updated.savedTag)) {
        updated.results = undefined;
    }
    return replaceMiddleSearch(global, chatThreadKey, updated, tabId);
}
export function resetMiddleSearch(global, chatId, threadId, ...[tabId = getCurrentTabId()]) {
    return replaceMiddleSearch(global, buildChatThreadKey(chatId, threadId), {
        type: 'chat',
    }, tabId);
}
function replaceMiddleSearchResults(global, chatId, threadId, results, ...[tabId = getCurrentTabId()]) {
    return updateMiddleSearch(global, chatId, threadId, {
        results,
        fetchingQuery: undefined,
    }, tabId);
}
export function updateMiddleSearchResults(global, chatId, threadId, update, ...[tabId = getCurrentTabId()]) {
    const chatThreadKey = buildChatThreadKey(chatId, threadId);
    const { results } = selectTabState(global, tabId).middleSearch.byChatThreadKey[chatThreadKey] || {};
    const prevQuery = (results?.query) || '';
    if (update.query !== prevQuery) {
        return replaceMiddleSearchResults(global, chatId, threadId, update, tabId);
    }
    const prevFoundIds = (results?.foundIds) || [];
    const { query, foundIds: newFoundIds, totalCount, nextOffsetId, nextOffsetPeerId, nextOffsetRate, } = update;
    const foundIds = unique(Array.prototype.concat(prevFoundIds, newFoundIds));
    const foundOrPrevFoundIds = areSortedArraysEqual(prevFoundIds, foundIds) ? prevFoundIds : foundIds;
    return replaceMiddleSearchResults(global, chatId, threadId, {
        query,
        foundIds: foundOrPrevFoundIds,
        totalCount,
        nextOffsetId,
        nextOffsetRate,
        nextOffsetPeerId,
    }, tabId);
}
export function closeMiddleSearch(global, chatId, threadId, ...[tabId = getCurrentTabId()]) {
    const chatThreadKey = buildChatThreadKey(chatId, threadId);
    return replaceMiddleSearch(global, chatThreadKey, undefined, tabId);
}
function replaceSharedMediaSearch(global, chatId, threadId, searchParams, ...[tabId = getCurrentTabId()]) {
    const chatThreadKey = buildChatThreadKey(chatId, threadId);
    return updateTabState(global, {
        sharedMediaSearch: {
            byChatThreadKey: {
                ...selectTabState(global, tabId).sharedMediaSearch.byChatThreadKey,
                [chatThreadKey]: searchParams,
            },
        },
    }, tabId);
}
export function updateSharedMediaSearchType(global, chatId, threadId, currentType, ...[tabId = getCurrentTabId()]) {
    const chatThreadKey = buildChatThreadKey(chatId, threadId);
    return replaceSharedMediaSearch(global, chatId, threadId, {
        ...selectTabState(global, tabId).sharedMediaSearch.byChatThreadKey[chatThreadKey],
        currentType,
    }, tabId);
}
export function replaceSharedMediaSearchResults(global, chatId, threadId, type, foundIds, totalCount, nextOffsetId, ...[tabId = getCurrentTabId()]) {
    const chatThreadKey = buildChatThreadKey(chatId, threadId);
    return replaceSharedMediaSearch(global, chatId, threadId, {
        ...selectTabState(global, tabId).sharedMediaSearch.byChatThreadKey[chatThreadKey],
        resultsByType: {
            ...(selectTabState(global, tabId).sharedMediaSearch.byChatThreadKey[chatThreadKey] || {}).resultsByType,
            [type]: {
                foundIds,
                totalCount,
                nextOffsetId,
            },
        },
    }, tabId);
}
export function updateSharedMediaSearchResults(global, chatId, threadId, type, newFoundIds, totalCount, nextOffsetId, ...[tabId = getCurrentTabId()]) {
    const chatThreadKey = buildChatThreadKey(chatId, threadId);
    const { resultsByType } = selectTabState(global, tabId).sharedMediaSearch.byChatThreadKey[chatThreadKey] || {};
    const prevFoundIds = resultsByType?.[type] ? resultsByType[type].foundIds : [];
    const foundIds = orderFoundIdsByDescending(unique(Array.prototype.concat(prevFoundIds, newFoundIds)));
    const foundOrPrevFoundIds = areSortedArraysEqual(prevFoundIds, foundIds) ? prevFoundIds : foundIds;
    return replaceSharedMediaSearchResults(global, chatId, threadId, type, foundOrPrevFoundIds, totalCount, nextOffsetId, tabId);
}
function orderFoundIdsByDescending(listedIds) {
    return listedIds.sort((a, b) => b - a);
}
function orderFoundIdsByAscending(array) {
    return array.sort((a, b) => a - b);
}
export function mergeWithChatMediaSearchSegment(foundIds, loadingState, segment) {
    if (!segment) {
        return {
            foundIds,
            loadingState,
        };
    }
    const mergedFoundIds = orderFoundIdsByAscending(unique(Array.prototype.concat(segment.foundIds, foundIds)));
    if (!areSortedArraysEqual(segment.foundIds, foundIds)) {
        segment.foundIds = mergedFoundIds;
    }
    const mergedLoadingState = {
        areAllItemsLoadedForwards: loadingState.areAllItemsLoadedForwards
            || segment.loadingState.areAllItemsLoadedForwards,
        areAllItemsLoadedBackwards: loadingState.areAllItemsLoadedBackwards
            || segment.loadingState.areAllItemsLoadedBackwards,
    };
    segment.loadingState = mergedLoadingState;
    return segment;
}
function mergeChatMediaSearchSegments(currentSegment, segments) {
    return segments.reduce((acc, segment) => {
        const hasIntersection = areSortedArraysIntersecting(segment.foundIds, currentSegment.foundIds);
        if (hasIntersection) {
            currentSegment = mergeWithChatMediaSearchSegment(currentSegment.foundIds, currentSegment.loadingState, segment);
        }
        else {
            acc.push(segment);
        }
        return acc;
    }, []);
}
export function updateChatMediaSearchResults(global, chatId, threadId, currentSegment, searchParams, ...[tabId = getCurrentTabId()]) {
    const segments = mergeChatMediaSearchSegments(currentSegment, searchParams.segments);
    return replaceChatMediaSearchResults(global, chatId, threadId, currentSegment, segments, tabId);
}
function removeIdFromSegment(id, segment) {
    const foundIds = segment.foundIds.filter((foundId) => foundId !== id);
    return {
        ...segment,
        foundIds,
    };
}
function removeIdsFromChatMediaSearchParams(id, searchParams) {
    const currentSegment = removeIdFromSegment(id, searchParams.currentSegment);
    const segments = searchParams.segments.map((segment) => removeIdFromSegment(id, segment));
    return {
        ...searchParams,
        currentSegment,
        segments,
    };
}
export function removeIdFromSearchResults(global, chatId, threadId, id, ...[tabId = getCurrentTabId()]) {
    const searchParams = selectChatMediaSearch(global, chatId, threadId, tabId);
    if (!searchParams)
        return global;
    const updatedSearchParams = removeIdsFromChatMediaSearchParams(id, searchParams);
    return replaceChatMediaSearch(global, chatId, threadId, updatedSearchParams, tabId);
}
function resetForwardsLoadingStateInParams(searchParams) {
    searchParams.currentSegment.loadingState.areAllItemsLoadedForwards = false;
    searchParams.segments.forEach((segment) => {
        segment.loadingState.areAllItemsLoadedForwards = false;
    });
}
export function updateChatMediaLoadingState(global, newMessage, chatId, threadId, ...[tabId = getCurrentTabId()]) {
    if (!isMediaLoadableInViewer(newMessage)) {
        return global;
    }
    const searchParams = selectChatMediaSearch(global, chatId, threadId, tabId);
    if (!searchParams)
        return global;
    resetForwardsLoadingStateInParams(searchParams);
    return replaceChatMediaSearch(global, chatId, threadId, searchParams, tabId);
}
export function initializeChatMediaSearchResults(global, chatId, threadId, ...[tabId = getCurrentTabId()]) {
    const loadingState = {
        areAllItemsLoadedForwards: false,
        areAllItemsLoadedBackwards: false,
    };
    const currentSegment = {
        foundIds: [],
        loadingState,
    };
    const segments = [];
    const isLoading = false;
    return replaceChatMediaSearch(global, chatId, threadId, {
        currentSegment,
        segments,
        isLoading,
    }, tabId);
}
export function setChatMediaSearchLoading(global, chatId, threadId, isLoading, ...[tabId = getCurrentTabId()]) {
    const chatThreadKey = buildChatThreadKey(chatId, threadId);
    const searchParams = selectTabState(global, tabId).chatMediaSearch.byChatThreadKey[chatThreadKey];
    if (!searchParams) {
        return global;
    }
    return replaceChatMediaSearch(global, chatId, threadId, {
        ...searchParams,
        isLoading,
    }, tabId);
}
export function replaceChatMediaSearchResults(global, chatId, threadId, currentSegment, segments, ...[tabId = getCurrentTabId()]) {
    const chatThreadKey = buildChatThreadKey(chatId, threadId);
    return replaceChatMediaSearch(global, chatId, threadId, {
        ...selectTabState(global, tabId).chatMediaSearch.byChatThreadKey[chatThreadKey],
        currentSegment,
        segments,
    }, tabId);
}
function replaceChatMediaSearch(global, chatId, threadId, searchParams, ...[tabId = getCurrentTabId()]) {
    const chatThreadKey = buildChatThreadKey(chatId, threadId);
    return updateTabState(global, {
        chatMediaSearch: {
            byChatThreadKey: {
                ...selectTabState(global, tabId).chatMediaSearch.byChatThreadKey,
                [chatThreadKey]: searchParams,
            },
        },
    }, tabId);
}
