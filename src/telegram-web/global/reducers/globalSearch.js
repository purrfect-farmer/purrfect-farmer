import { getCurrentTabId } from '../../util/establishMultitabRole';
import { areSortedArraysEqual } from '../../util/iteratees';
import { getSearchResultKey } from '../../util/keys/searchResultKey';
import { selectTabState } from '../selectors';
import { updateTabState } from './tabs';
export function updateGlobalSearch(global, searchStatePartial, ...[tabId = getCurrentTabId()]) {
    return updateTabState(global, {
        globalSearch: {
            ...selectTabState(global, tabId).globalSearch,
            ...searchStatePartial,
        },
    }, tabId);
}
export function updateGlobalSearchContent(global, currentContent, ...[tabId = getCurrentTabId()]) {
    return updateGlobalSearch(global, { currentContent }, tabId);
}
export function updateGlobalSearchResults(global, newFoundMessages, totalCount, type, nextOffsetRate, nextOffsetId, nextOffsetPeerId, ...[tabId = getCurrentTabId()]) {
    const { resultsByType } = selectTabState(global, tabId).globalSearch || {};
    const newFoundMessagesById = newFoundMessages.reduce((result, message) => {
        result[getSearchResultKey(message)] = message;
        return result;
    }, {});
    const foundIdsForType = resultsByType?.[type]?.foundIds;
    if (foundIdsForType !== undefined
        && Object.keys(newFoundMessagesById).every((newId) => foundIdsForType.includes(getSearchResultKey(newFoundMessagesById[newId])))) {
        global = updateGlobalSearchFetchingStatus(global, { messages: false }, tabId);
        return updateGlobalSearch(global, {
            resultsByType: {
                ...(selectTabState(global, tabId).globalSearch || {}).resultsByType,
                [type]: {
                    foundIds: foundIdsForType,
                    totalCount,
                    nextOffsetId,
                    nextOffsetRate,
                    nextOffsetPeerId,
                },
            },
        }, tabId);
    }
    const prevFoundIds = foundIdsForType || [];
    const newFoundIds = newFoundMessages
        .map((message) => getSearchResultKey(message))
        .filter((id) => !prevFoundIds.includes(id));
    const foundIds = Array.prototype.concat(prevFoundIds, newFoundIds);
    const foundOrPrevFoundIds = areSortedArraysEqual(prevFoundIds, foundIds) ? prevFoundIds : foundIds;
    global = updateGlobalSearchFetchingStatus(global, { messages: false }, tabId);
    return updateGlobalSearch(global, {
        resultsByType: {
            ...(selectTabState(global, tabId).globalSearch || {}).resultsByType,
            [type]: {
                totalCount,
                nextOffsetId,
                nextOffsetRate,
                nextOffsetPeerId,
                foundIds: foundOrPrevFoundIds,
            },
        },
    }, tabId);
}
export function updateGlobalSearchFetchingStatus(global, newState, ...[tabId = getCurrentTabId()]) {
    return updateGlobalSearch(global, {
        fetchingStatus: {
            ...selectTabState(global, tabId).globalSearch.fetchingStatus,
            ...newState,
        },
    }, tabId);
}
