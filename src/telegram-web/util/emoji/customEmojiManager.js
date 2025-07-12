import { addCallback } from '../../lib/teact/teactn';
import { getGlobal } from '../../global';
import { ApiMediaFormat } from '../../api/types';
import { requestMutation } from '../../lib/fasterdom/fasterdom';
import { getStickerHashById } from '../../global/helpers';
import { selectCanPlayAnimatedEmojis } from '../../global/selectors';
import { IS_WEBM_SUPPORTED } from '../browser/windowEnvironment';
import { createCallbackManager } from '../callbacks';
import generateUniqueId from '../generateUniqueId';
import * as mediaLoader from '../mediaLoader';
import { throttle } from '../schedulers';
import blankSrc from '../../assets/blank.png';
import placeholderSrc from '../../assets/square.svg';
const DOM_PROCESS_THROTTLE = 500;
const INPUT_WAITING_CUSTOM_EMOJI_IDS = new Set();
const handlers = new Map();
const renderCallbacks = createCallbackManager();
let prevGlobal;
addCallback((global) => {
    if (global.customEmojis.byId !== prevGlobal?.customEmojis.byId
        || selectCanPlayAnimatedEmojis(global) !== selectCanPlayAnimatedEmojis(prevGlobal)) {
        for (const entry of handlers) {
            const [handler, id] = entry;
            if (global.customEmojis.byId[id]) {
                handler(global.customEmojis);
            }
        }
        checkInputCustomEmojiLoad(global.customEmojis);
    }
    prevGlobal = global;
});
export function addCustomEmojiCallback(handler, emojiId) {
    handlers.set(handler, emojiId);
}
export function removeCustomEmojiCallback(handler) {
    handlers.delete(handler);
}
export const addCustomEmojiInputRenderCallback = renderCallbacks.addCallback;
const callInputRenderHandlers = throttle(renderCallbacks.runCallbacks, DOM_PROCESS_THROTTLE);
function processDomForCustomEmoji() {
    const emojis = document.querySelectorAll('.custom-emoji.placeholder');
    emojis.forEach((emoji) => {
        const customEmoji = getGlobal().customEmojis.byId[emoji.dataset.documentId];
        if (!customEmoji) {
            INPUT_WAITING_CUSTOM_EMOJI_IDS.add(emoji.dataset.documentId);
            return;
        }
        const [isPlaceholder, src, uniqueId] = getInputCustomEmojiParams(customEmoji);
        if (customEmoji.shouldUseTextColor && !emoji.classList.contains('colorable')) {
            requestMutation(() => {
                emoji.classList.add('colorable');
            });
        }
        if (!isPlaceholder) {
            requestMutation(() => {
                emoji.src = src;
                emoji.classList.remove('placeholder');
                if (uniqueId)
                    emoji.dataset.uniqueId = uniqueId;
                callInputRenderHandlers(customEmoji.id);
            });
        }
    });
}
export const processMessageInputForCustomEmoji = throttle(processDomForCustomEmoji, DOM_PROCESS_THROTTLE);
function checkInputCustomEmojiLoad(customEmojis) {
    const loaded = Array.from(INPUT_WAITING_CUSTOM_EMOJI_IDS).filter((id) => Boolean(customEmojis.byId[id]));
    if (loaded.length) {
        loaded.forEach((id) => INPUT_WAITING_CUSTOM_EMOJI_IDS.delete(id));
        processMessageInputForCustomEmoji();
    }
}
export function getCustomEmojiMediaDataForInput(emojiId, isPreview) {
    const mediaHash = getStickerHashById(emojiId, isPreview);
    const data = mediaLoader.getFromMemory(mediaHash);
    if (data) {
        return data;
    }
    void fetchAndProcess(mediaHash);
    return undefined;
}
function fetchAndProcess(mediaHash) {
    return mediaLoader.fetch(mediaHash, ApiMediaFormat.BlobUrl).then(() => {
        processMessageInputForCustomEmoji();
    });
}
export function getInputCustomEmojiParams(customEmoji) {
    if (!customEmoji)
        return [true, placeholderSrc, undefined];
    const shouldUseStaticFallback = !IS_WEBM_SUPPORTED && customEmoji.isVideo;
    const isUsingSharedCanvas = customEmoji.isLottie || (customEmoji.isVideo && !shouldUseStaticFallback);
    if (isUsingSharedCanvas) {
        void fetchAndProcess(`sticker${customEmoji.id}`);
        return [false, blankSrc, generateUniqueId()];
    }
    const mediaData = getCustomEmojiMediaDataForInput(customEmoji.id, shouldUseStaticFallback);
    return [!mediaData, mediaData || placeholderSrc, undefined];
}
