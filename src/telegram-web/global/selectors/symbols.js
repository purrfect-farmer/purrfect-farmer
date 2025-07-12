import { RESTRICTED_EMOJI_SET_ID } from '../../config';
import { getCurrentTabId } from '../../util/establishMultitabRole';
import { selectTabState } from './tabs';
import { selectIsCurrentUserPremium } from './users';
// https://github.com/DrKLO/Telegram/blob/c319639e9a4dff2f22da6762dcebd12d49f5afa1/TMessagesProj/src/main/java/org/telegram/ui/Components/Premium/boosts/cells/msg/GiveawayMessageCell.java#L59
const MONTH_EMOTICON = {
    1: `${1}\u{FE0F}\u20E3`,
    3: `${2}\u{FE0F}\u20E3`,
    6: `${3}\u{FE0F}\u20E3`,
    12: `${4}\u{FE0F}\u20E3`,
    24: `${5}\u{FE0F}\u20E3`,
};
const STAR_EMOTICON = {
    1000: `${2}\u{FE0F}\u20E3`,
    2500: `${3}\u{FE0F}\u20E3`,
    5000: `${4}\u{FE0F}\u20E3`,
};
export function selectIsStickerFavorite(global, sticker) {
    const { stickers } = global.stickers.favorite;
    return stickers && stickers.some(({ id }) => id === sticker.id);
}
export function selectCurrentStickerSearch(global, ...[tabId = getCurrentTabId()]) {
    return selectTabState(global, tabId).stickerSearch;
}
export function selectCurrentGifSearch(global, ...[tabId = getCurrentTabId()]) {
    return selectTabState(global, tabId).gifSearch;
}
export function selectStickerSet(global, id) {
    if (typeof id === 'string') {
        return global.stickers.setsById[id];
    }
    if ('id' in id) {
        return global.stickers.setsById[id.id];
    }
    if ('isMissing' in id)
        return undefined;
    return Object.values(global.stickers.setsById).find(({ shortName }) => (shortName.toLowerCase() === id.shortName.toLowerCase()));
}
export function selectStickersForEmoji(global, emoji) {
    const addedSets = global.stickers.added.setIds;
    let stickersForEmoji = [];
    // Favorites
    global.stickers.favorite.stickers.forEach((sticker) => {
        if (sticker.emoji === emoji)
            stickersForEmoji.push(sticker);
    });
    // Added sets
    addedSets?.forEach((id) => {
        const packs = global.stickers.setsById[id].packs;
        if (!packs) {
            return;
        }
        stickersForEmoji = stickersForEmoji.concat(packs[emoji] || [], packs[cleanEmoji(emoji)] || []);
    });
    return stickersForEmoji;
}
export function selectCustomEmojiForEmoji(global, emoji) {
    const isCurrentUserPremium = selectIsCurrentUserPremium(global);
    const addedCustomSets = global.customEmojis.added.setIds;
    let customEmojiForEmoji = [];
    // Added sets
    addedCustomSets?.forEach((id) => {
        const packs = global.stickers.setsById[id].packs;
        if (!packs) {
            return;
        }
        customEmojiForEmoji = customEmojiForEmoji.concat(packs[emoji] || [], packs[cleanEmoji(emoji)] || []);
    });
    return isCurrentUserPremium ? customEmojiForEmoji : customEmojiForEmoji.filter(({ isFree }) => isFree);
}
// Slow, not to be used in `withGlobal`
export function selectCustomEmojiForEmojis(global, emojis) {
    const isCurrentUserPremium = selectIsCurrentUserPremium(global);
    const addedCustomSets = global.customEmojis.added.setIds;
    let customEmojiForEmoji = [];
    // Added sets
    addedCustomSets?.forEach((id) => {
        const packs = global.stickers.setsById[id].packs;
        if (!packs) {
            return;
        }
        const customEmojis = Object.entries(packs).filter(([emoji]) => (emojis.includes(emoji) || emojis.includes(cleanEmoji(emoji)))).flatMap(([, stickers]) => stickers);
        customEmojiForEmoji = customEmojiForEmoji.concat(customEmojis);
    });
    return isCurrentUserPremium ? customEmojiForEmoji : customEmojiForEmoji.filter(({ isFree }) => isFree);
}
export function selectIsSetPremium(stickerSet) {
    return stickerSet.isEmoji && stickerSet.stickers?.some((sticker) => !sticker.isFree);
}
function cleanEmoji(emoji) {
    // Some emojis (❤️ for example) with a service symbol 'VARIATION SELECTOR-16' are not recognized as animated
    return emoji.replace('\ufe0f', '');
}
export function selectAnimatedEmoji(global, emoji) {
    const { animatedEmojis } = global;
    if (!animatedEmojis || !animatedEmojis.stickers) {
        return undefined;
    }
    const cleanedEmoji = cleanEmoji(emoji);
    return animatedEmojis.stickers.find((sticker) => sticker.emoji === emoji || sticker.emoji === cleanedEmoji);
}
export function selectRestrictedEmoji(global, emoji) {
    const { restrictedEmoji } = global;
    if (!restrictedEmoji || !restrictedEmoji.stickers) {
        return undefined;
    }
    const cleanedEmoji = cleanEmoji(emoji);
    return restrictedEmoji.stickers.find((sticker) => {
        if (!sticker.emoji)
            return undefined;
        const cleanedStickerEmoji = cleanEmoji(sticker.emoji);
        return cleanedStickerEmoji === cleanedEmoji;
    });
}
export function selectAnimatedEmojiEffect(global, emoji) {
    const { animatedEmojiEffects } = global;
    if (!animatedEmojiEffects || !animatedEmojiEffects.stickers) {
        return undefined;
    }
    const cleanedEmoji = cleanEmoji(emoji);
    return animatedEmojiEffects.stickers.find((sticker) => sticker.emoji === emoji || sticker.emoji === cleanedEmoji);
}
export function selectAnimatedEmojiSound(global, emoji) {
    return global?.appConfig?.emojiSounds[cleanEmoji(emoji)];
}
export function selectIsAlwaysHighPriorityEmoji(global, stickerSet) {
    if (!('id' in stickerSet))
        return false;
    return stickerSet.id === global.appConfig?.defaultEmojiStatusesStickerSetId
        || stickerSet.id === RESTRICTED_EMOJI_SET_ID;
}
export function selectGiftStickerForDuration(global, duration = 1) {
    const stickers = global.premiumGifts?.stickers;
    if (!stickers)
        return undefined;
    const emoji = MONTH_EMOTICON[duration];
    return stickers.find((sticker) => sticker.emoji === emoji) || stickers[0];
}
export function selectGiftStickerForStars(global, starCount) {
    const stickers = global.premiumGifts?.stickers;
    if (!stickers || !starCount)
        return undefined;
    let emoji;
    if (starCount <= 1000) {
        emoji = STAR_EMOTICON[1000];
    }
    else if (starCount < 2500) {
        emoji = STAR_EMOTICON[2500];
    }
    else {
        emoji = STAR_EMOTICON[5000];
    }
    return stickers.find((sticker) => sticker.emoji === emoji) || stickers[0];
}
