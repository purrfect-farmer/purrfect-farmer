import { useEffect, useState } from '../../../../lib/teact/teact';
import { getGlobal } from '../../../../global';
import { EDITABLE_INPUT_CSS_SELECTOR, EDITABLE_INPUT_ID } from '../../../../config';
import { requestNextMutation } from '../../../../lib/fasterdom/fasterdom';
import { selectCustomEmojiForEmojis } from '../../../../global/selectors';
import { uncompressEmoji } from '../../../../util/emoji/emoji';
import focusEditableElement from '../../../../util/focusEditableElement';
import { buildCollectionByKey, mapValues, pickTruthy, unique, uniqueByField, } from '../../../../util/iteratees';
import { MEMO_EMPTY_ARRAY } from '../../../../util/memo';
import memoized from '../../../../util/memoized';
import renderText from '../../../common/helpers/renderText';
import { buildCustomEmojiHtml } from '../helpers/customEmoji';
import { prepareForRegExp } from '../helpers/prepareForRegExp';
import { useThrottledResolver } from '../../../../hooks/useAsyncResolvers';
import useDerivedSignal from '../../../../hooks/useDerivedSignal';
import useFlag from '../../../../hooks/useFlag';
import useLastCallback from '../../../../hooks/useLastCallback';
let emojiDataPromise;
let emojiRawData;
let emojiData;
let RE_EMOJI_SEARCH;
let RE_LOWERCASE_TEST;
const EMOJIS_LIMIT = 36;
const FILTER_MIN_LENGTH = 2;
const THROTTLE = 300;
const prepareRecentEmojisMemo = memoized(prepareRecentEmojis);
const prepareLibraryMemo = memoized(prepareLibrary);
const searchInLibraryMemo = memoized(searchInLibrary);
try {
    RE_EMOJI_SEARCH = /(^|\s):(?!\s)[-+_:'\s\p{L}\p{N}]*$/gui;
    RE_LOWERCASE_TEST = /\p{Ll}/u;
}
catch (e) {
    // Support for older versions of firefox
    RE_EMOJI_SEARCH = /(^|\s):(?!\s)[-+_:'\s\d\wа-яёґєії]*$/gi;
    RE_LOWERCASE_TEST = /[a-zяёґєії]/;
}
export default function useEmojiTooltip(isEnabled, getHtml, setHtml, inputId = EDITABLE_INPUT_ID, recentEmojiIds, baseEmojiKeywords, emojiKeywords) {
    const [isManuallyClosed, markManuallyClosed, unmarkManuallyClosed] = useFlag(false);
    const [byId, setById] = useState();
    const [filteredEmojis, setFilteredEmojis] = useState(MEMO_EMPTY_ARRAY);
    const [filteredCustomEmojis, setFilteredCustomEmojis] = useState(MEMO_EMPTY_ARRAY);
    // Initialize data on first render
    useEffect(() => {
        if (!isEnabled)
            return;
        function exec() {
            setById(emojiData.emojis);
        }
        if (emojiData) {
            exec();
        }
        else {
            ensureEmojiData().then(exec);
        }
    }, [isEnabled]);
    const detectEmojiCodeThrottled = useThrottledResolver(() => {
        const html = getHtml();
        return isEnabled && html.includes(':') ? prepareForRegExp(html).match(RE_EMOJI_SEARCH)?.[0].trim() : undefined;
    }, [getHtml, isEnabled], THROTTLE);
    const getEmojiCode = useDerivedSignal(detectEmojiCodeThrottled, [detectEmojiCodeThrottled, getHtml], true);
    const updateFiltered = useLastCallback((emojis) => {
        setFilteredEmojis(emojis);
        if (emojis === MEMO_EMPTY_ARRAY) {
            setFilteredCustomEmojis(MEMO_EMPTY_ARRAY);
            return;
        }
        const nativeEmojis = emojis.map((emoji) => emoji.native);
        const customEmojis = uniqueByField(selectCustomEmojiForEmojis(getGlobal(), nativeEmojis), 'id');
        setFilteredCustomEmojis(customEmojis);
    });
    const insertEmoji = useLastCallback((emoji, isForce = false) => {
        const html = getHtml();
        if (!html)
            return;
        const atIndex = html.lastIndexOf(':', isForce ? html.lastIndexOf(':') - 1 : undefined);
        if (atIndex !== -1) {
            const emojiHtml = typeof emoji === 'string'
                ? renderText(emoji, ['emoji_html'])[0]
                : buildCustomEmojiHtml(emoji);
            setHtml(`${html.substring(0, atIndex)}${emojiHtml}`);
            const messageInput = inputId === EDITABLE_INPUT_ID
                ? document.querySelector(EDITABLE_INPUT_CSS_SELECTOR)
                : document.getElementById(inputId);
            requestNextMutation(() => {
                focusEditableElement(messageInput, true, true);
            });
        }
        updateFiltered(MEMO_EMPTY_ARRAY);
    });
    useEffect(() => {
        const emojiCode = getEmojiCode();
        if (!emojiCode || !byId) {
            updateFiltered(MEMO_EMPTY_ARRAY);
            return;
        }
        const newShouldAutoInsert = emojiCode.length > 2 && emojiCode.endsWith(':');
        const filter = emojiCode.substring(1, newShouldAutoInsert ? 1 + emojiCode.length - 2 : undefined);
        let matched = MEMO_EMPTY_ARRAY;
        if (!filter) {
            matched = prepareRecentEmojisMemo(byId, recentEmojiIds, EMOJIS_LIMIT);
        }
        else if ((filter.length === 1 && RE_LOWERCASE_TEST.test(filter)) || filter.length >= FILTER_MIN_LENGTH) {
            const library = prepareLibraryMemo(byId, baseEmojiKeywords, emojiKeywords);
            matched = searchInLibraryMemo(library, filter.toLowerCase(), EMOJIS_LIMIT);
        }
        if (!matched.length) {
            updateFiltered(MEMO_EMPTY_ARRAY);
            return;
        }
        if (newShouldAutoInsert) {
            insertEmoji(matched[0].native, true);
        }
        else {
            updateFiltered(matched);
        }
    }, [
        baseEmojiKeywords, byId, getEmojiCode, emojiKeywords, insertEmoji, recentEmojiIds, updateFiltered,
    ]);
    useEffect(unmarkManuallyClosed, [unmarkManuallyClosed, getHtml]);
    return {
        isEmojiTooltipOpen: Boolean(filteredEmojis.length || filteredCustomEmojis.length) && !isManuallyClosed,
        closeEmojiTooltip: markManuallyClosed,
        filteredEmojis,
        filteredCustomEmojis,
        insertEmoji,
    };
}
async function ensureEmojiData() {
    if (!emojiDataPromise) {
        emojiDataPromise = import('emoji-data-ios/emoji-data.json');
        emojiRawData = (await emojiDataPromise).default;
        emojiData = uncompressEmoji(emojiRawData);
    }
    return emojiDataPromise;
}
function prepareRecentEmojis(byId, recentEmojiIds, limit) {
    if (!byId || !recentEmojiIds.length) {
        return MEMO_EMPTY_ARRAY;
    }
    return Object.values(pickTruthy(byId, recentEmojiIds)).slice(0, limit);
}
function prepareLibrary(byId, baseEmojiKeywords, emojiKeywords) {
    const emojis = Object.values(byId);
    const byNative = buildCollectionByKey(emojis, 'native');
    const baseEmojisByKeyword = baseEmojiKeywords
        ? mapValues(baseEmojiKeywords, (natives) => {
            return Object.values(pickTruthy(byNative, natives));
        })
        : {};
    const emojisByKeyword = emojiKeywords
        ? mapValues(emojiKeywords, (natives) => {
            return Object.values(pickTruthy(byNative, natives));
        })
        : {};
    const byKeyword = { ...baseEmojisByKeyword, ...emojisByKeyword };
    const keywords = [].concat(Object.keys(baseEmojisByKeyword), Object.keys(emojisByKeyword));
    const byName = emojis.reduce((result, emoji) => {
        emoji.names.forEach((name) => {
            if (!result[name]) {
                result[name] = [];
            }
            result[name].push(emoji);
        });
        return result;
    }, {});
    const names = Object.keys(byName);
    const maxKeyLength = keywords.reduce((max, keyword) => Math.max(max, keyword.length), 0);
    return {
        byKeyword,
        keywords,
        byName,
        names,
        maxKeyLength,
    };
}
function searchInLibrary(library, filter, limit) {
    const { byKeyword, keywords, byName, names, maxKeyLength, } = library;
    let matched = [];
    if (filter.length > maxKeyLength) {
        return MEMO_EMPTY_ARRAY;
    }
    const matchedKeywords = keywords.filter((keyword) => keyword.startsWith(filter)).sort();
    matched = matched.concat(Object.values(pickTruthy(byKeyword, matchedKeywords)).flat());
    // Also search by names, which is useful for non-English languages
    const matchedNames = names.filter((name) => name.startsWith(filter));
    matched = matched.concat(Object.values(pickTruthy(byName, matchedNames)).flat());
    matched = unique(matched);
    if (!matched.length) {
        return MEMO_EMPTY_ARRAY;
    }
    return matched.slice(0, limit);
}
