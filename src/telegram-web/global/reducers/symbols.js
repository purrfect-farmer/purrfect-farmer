import { getCurrentTabId } from '../../util/establishMultitabRole';
import { buildCollectionByKey, unique } from '../../util/iteratees';
import { selectCustomEmojiForEmoji, selectStickersForEmoji, selectTabState } from '../selectors';
import { updateTabState } from './tabs';
export function updateStickerSearch(global, hash, resultIds, ...[tabId = getCurrentTabId()]) {
    return updateTabState(global, {
        stickerSearch: {
            ...selectTabState(global, tabId).stickerSearch,
            hash,
            resultIds,
        },
    }, tabId);
}
export function updateStickerSets(global, category, hash, sets) {
    const updatedSets = sets.map((stickerSet) => {
        const existing = global.stickers.setsById[stickerSet.id];
        if (!existing) {
            return stickerSet;
        }
        return {
            ...existing,
            ...stickerSet,
        };
    });
    const regularSetIds = sets.map((set) => set.id);
    if (category === 'search') {
        return {
            ...global,
            stickers: {
                ...global.stickers,
                setsById: {
                    ...global.stickers.setsById,
                    ...buildCollectionByKey(updatedSets, 'id'),
                },
            },
        };
    }
    return {
        ...global,
        stickers: {
            ...global.stickers,
            setsById: {
                ...global.stickers.setsById,
                ...buildCollectionByKey(updatedSets, 'id'),
            },
            [category]: {
                ...global.stickers[category],
                hash,
                setIds: [
                    ...(global.stickers[category].setIds || []),
                    ...regularSetIds,
                ],
            },
        },
    };
}
export function updateCustomEmojiSets(global, hash, sets) {
    const updatedSets = sets.map((stickerSet) => {
        const existing = global.stickers.setsById[stickerSet.id];
        if (!existing) {
            return stickerSet;
        }
        return {
            ...existing,
            ...stickerSet,
        };
    });
    const customEmojis = sets.map((set) => set.stickers).flat().filter(Boolean);
    const addedSetIds = sets.map((set) => set.id);
    return {
        ...global,
        stickers: {
            ...global.stickers,
            setsById: {
                ...global.stickers.setsById,
                ...buildCollectionByKey(updatedSets, 'id'),
            },
        },
        customEmojis: {
            ...global.customEmojis,
            added: {
                ...global.customEmojis.added,
                hash,
                setIds: [
                    ...(global.customEmojis.added.setIds || []),
                    ...addedSetIds,
                ],
            },
            byId: {
                ...global.customEmojis.byId,
                ...buildCollectionByKey(customEmojis, 'id'),
            },
        },
    };
}
export function updateStickerSet(global, stickerSetId, update) {
    const currentStickerSet = global.stickers.setsById[stickerSetId] || {};
    const isCustomEmoji = update.isEmoji || currentStickerSet.isEmoji;
    const addedSets = (isCustomEmoji ? global.customEmojis.added.setIds : global.stickers.added.setIds) || [];
    let setIds = addedSets;
    if (update.installedDate && !update.isArchived && addedSets && !addedSets.includes(stickerSetId)) {
        setIds = [stickerSetId, ...setIds];
    }
    if (!update.installedDate && addedSets?.includes(stickerSetId)) {
        setIds = setIds.filter((id) => id !== stickerSetId);
    }
    const customEmojiById = isCustomEmoji && update.stickers && buildCollectionByKey(update.stickers, 'id');
    return {
        ...global,
        stickers: {
            ...global.stickers,
            added: {
                ...global.stickers.added,
                ...(!isCustomEmoji && { setIds }),
            },
            setsById: {
                ...global.stickers.setsById,
                [stickerSetId]: {
                    ...currentStickerSet,
                    ...update,
                },
            },
        },
        customEmojis: {
            ...global.customEmojis,
            byId: {
                ...global.customEmojis.byId,
                ...customEmojiById,
            },
            added: {
                ...global.customEmojis.added,
                ...(isCustomEmoji && { setIds }),
            },
        },
    };
}
export function updateGifSearch(global, isNew, results, nextOffset, ...[tabId = getCurrentTabId()]) {
    const { results: currentResults } = selectTabState(global, tabId).gifSearch;
    let newResults;
    if (isNew || !currentResults) {
        newResults = results;
    }
    else {
        const currentIds = new Set(currentResults.map((gif) => gif.id));
        newResults = [
            ...currentResults,
            ...results.filter((gif) => !currentIds.has(gif.id)),
        ];
    }
    return updateTabState(global, {
        gifSearch: {
            ...selectTabState(global, tabId).gifSearch,
            offset: nextOffset,
            results: newResults,
        },
    }, tabId);
}
export function replaceAnimatedEmojis(global, stickerSet) {
    return {
        ...global,
        animatedEmojis: stickerSet,
    };
}
export function updateStickersForEmoji(global, emoji, remoteStickers, hash) {
    const localStickers = selectStickersForEmoji(global, emoji);
    const allStickers = [...localStickers, ...(remoteStickers || [])];
    const uniqueIds = unique(allStickers.map(({ id }) => id));
    const byId = buildCollectionByKey(allStickers, 'id');
    const stickers = uniqueIds.map((id) => byId[id]);
    return {
        ...global,
        stickers: {
            ...global.stickers,
            forEmoji: {
                emoji,
                stickers,
                hash,
            },
        },
    };
}
export function updateCustomEmojiForEmoji(global, emoji) {
    const localStickers = selectCustomEmojiForEmoji(global, emoji);
    const uniqueIds = unique(localStickers.map(({ id }) => id));
    const byId = buildCollectionByKey(localStickers, 'id');
    const stickers = uniqueIds.map((id) => byId[id]);
    return {
        ...global,
        customEmojis: {
            ...global.customEmojis,
            forEmoji: {
                emoji,
                stickers,
            },
        },
    };
}
export function updateRecentStatusCustomEmojis(global, hash, emojis) {
    return {
        ...global,
        customEmojis: {
            ...global.customEmojis,
            statusRecent: {
                ...global.customEmojis.statusRecent,
                hash,
                emojis,
            },
        },
    };
}
export function rebuildStickersForEmoji(global) {
    if (global.stickers.forEmoji) {
        const { emoji, stickers, hash } = global.stickers.forEmoji;
        if (!emoji) {
            return global;
        }
        return updateStickersForEmoji(global, emoji, stickers, hash);
    }
    if (global.customEmojis.forEmoji) {
        const { emoji } = global.customEmojis.forEmoji;
        if (!emoji) {
            return global;
        }
        return updateCustomEmojiForEmoji(global, emoji);
    }
    return global;
}
