import { addExtraClass } from '../../lib/teact/teact-dom';
import { requestMutation } from '../../lib/fasterdom/fasterdom';
import { removeVS16s } from '../../lib/twemojiRegex';
import withCache from '../withCache';
// Due to the fact that emoji from Apple do not contain some characters, it is necessary to remove them from emoji-data
// https://github.com/iamcal/emoji-data/issues/136
const EXCLUDE_EMOJIS = ['female_sign', 'male_sign', 'medical_symbol'];
const ISO_FLAGS_OFFSET = 127397;
function unifiedToNative(unified) {
    const unicodes = unified.split('-');
    const codePoints = unicodes.map((i) => parseInt(i, 16));
    return String.fromCodePoint(...codePoints);
}
export const LOADED_EMOJIS = new Set();
export function handleEmojiLoad(event) {
    const emoji = event.currentTarget;
    LOADED_EMOJIS.add(event.currentTarget.dataset.path);
    requestMutation(() => {
        addExtraClass(emoji, 'open');
    });
}
export function nativeToUnified(emoji) {
    let code;
    if (emoji.length === 1) {
        code = emoji.charCodeAt(0).toString(16).padStart(4, '0');
    }
    else {
        const pairs = [];
        for (let i = 0; i < emoji.length; i++) {
            if (emoji.charCodeAt(i) >= 0xd800 && emoji.charCodeAt(i) <= 0xdbff) {
                if (emoji.charCodeAt(i + 1) >= 0xdc00 && emoji.charCodeAt(i + 1) <= 0xdfff) {
                    pairs.push((emoji.charCodeAt(i) - 0xd800) * 0x400
                        + (emoji.charCodeAt(i + 1) - 0xdc00) + 0x10000);
                }
            }
            else if (emoji.charCodeAt(i) < 0xd800 || emoji.charCodeAt(i) > 0xdfff) {
                pairs.push(emoji.charCodeAt(i));
            }
        }
        code = pairs.map((x) => x.toString(16).padStart(4, '0')).join('-');
    }
    return code;
}
function nativeToUnifiedExtended(emoji) {
    return nativeToUnified(removeVS16s(emoji));
}
export const nativeToUnifiedExtendedWithCache = withCache(nativeToUnifiedExtended);
export function uncompressEmoji(data) {
    const emojiData = { categories: [], emojis: {} };
    for (let i = 0; i < data.length; i += 2) {
        const category = {
            id: data[i][0],
            name: data[i][1],
            emojis: [],
        };
        for (let j = 0; j < data[i + 1].length; j++) {
            const emojiRaw = data[i + 1][j];
            if (!EXCLUDE_EMOJIS.includes(emojiRaw[1][0])) {
                category.emojis.push(emojiRaw[1][0]);
                emojiData.emojis[emojiRaw[1][0]] = {
                    id: emojiRaw[1][0],
                    names: emojiRaw[1],
                    native: unifiedToNative(emojiRaw[0]),
                    image: emojiRaw[0].toLowerCase(),
                };
            }
        }
        emojiData.categories.push(category);
    }
    return emojiData;
}
export function isoToEmoji(iso) {
    // Special case for Fragment numbers
    if (iso === 'FT') {
        return '\uD83C\uDFF4\u200D\u2620\uFE0F';
    }
    const code = iso.toUpperCase();
    if (!/^[A-Z]{2}$/.test(code))
        return iso;
    const codePoints = [...code].map((c) => c.codePointAt(0) + ISO_FLAGS_OFFSET);
    return String.fromCodePoint(...codePoints);
}
