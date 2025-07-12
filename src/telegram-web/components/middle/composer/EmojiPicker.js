import { memo, useEffect, useMemo, useRef, useState, } from '../../../lib/teact/teact';
import { withGlobal } from '../../../global';
import { MENU_TRANSITION_DURATION, RECENT_SYMBOL_SET_ID } from '../../../config';
import animateHorizontalScroll from '../../../util/animateHorizontalScroll';
import animateScroll from '../../../util/animateScroll';
import { IS_TOUCH_ENV } from '../../../util/browser/windowEnvironment';
import buildClassName from '../../../util/buildClassName';
import { uncompressEmoji } from '../../../util/emoji/emoji';
import { pick } from '../../../util/iteratees';
import { MEMO_EMPTY_ARRAY } from '../../../util/memo';
import { REM } from '../../common/helpers/mediaDimensions';
import useAppLayout from '../../../hooks/useAppLayout';
import useHorizontalScroll from '../../../hooks/useHorizontalScroll';
import { useIntersectionObserver } from '../../../hooks/useIntersectionObserver';
import useLastCallback from '../../../hooks/useLastCallback';
import useOldLang from '../../../hooks/useOldLang';
import useScrolledState from '../../../hooks/useScrolledState';
import useAsyncRendering from '../../right/hooks/useAsyncRendering';
import Icon from '../../common/icons/Icon';
import Button from '../../ui/Button';
import Loading from '../../ui/Loading';
import EmojiCategory from './EmojiCategory';
import './EmojiPicker.scss';
const ICONS_BY_CATEGORY = {
    recent: 'recent',
    people: 'smile',
    nature: 'animals',
    foods: 'eats',
    activity: 'sport',
    places: 'car',
    objects: 'lamp',
    symbols: 'language',
    flags: 'flag',
};
const OPEN_ANIMATION_DELAY = 200;
const SMOOTH_SCROLL_DISTANCE = 100;
const FOCUS_MARGIN = 3.25 * REM;
const HEADER_BUTTON_WIDTH = 2.625 * REM; // Includes margins
const INTERSECTION_THROTTLE = 200;
const categoryIntersections = [];
let emojiDataPromise;
let emojiRawData;
let emojiData;
const EmojiPicker = ({ className, recentEmojis, onEmojiSelect, }) => {
    const containerRef = useRef();
    const headerRef = useRef();
    const [categories, setCategories] = useState();
    const [emojis, setEmojis] = useState();
    const [activeCategoryIndex, setActiveCategoryIndex] = useState(0);
    const { isMobile } = useAppLayout();
    const { handleScroll: handleContentScroll, isAtBeginning: shouldHideTopBorder, } = useScrolledState();
    const { observe: observeIntersection } = useIntersectionObserver({
        rootRef: containerRef,
        throttleMs: INTERSECTION_THROTTLE,
    }, (entries) => {
        entries.forEach((entry) => {
            const { id } = entry.target;
            if (!id || !id.startsWith('emoji-category-')) {
                return;
            }
            const index = Number(id.replace('emoji-category-', ''));
            categoryIntersections[index] = entry.isIntersecting;
        });
        const minIntersectingIndex = categoryIntersections.reduce((lowestIndex, isIntersecting, index) => {
            return isIntersecting && index < lowestIndex ? index : lowestIndex;
        }, Infinity);
        if (minIntersectingIndex === Infinity) {
            return;
        }
        setActiveCategoryIndex(minIntersectingIndex);
    });
    const canRenderContents = useAsyncRendering([], MENU_TRANSITION_DURATION);
    const shouldRenderContent = emojis && canRenderContents;
    useHorizontalScroll(headerRef, !(isMobile && shouldRenderContent));
    // Scroll header when active set updates
    useEffect(() => {
        if (!categories) {
            return;
        }
        const header = headerRef.current;
        if (!header) {
            return;
        }
        const newLeft = activeCategoryIndex * HEADER_BUTTON_WIDTH - header.offsetWidth / 2 + HEADER_BUTTON_WIDTH / 2;
        animateHorizontalScroll(header, newLeft);
    }, [categories, activeCategoryIndex]);
    const lang = useOldLang();
    const allCategories = useMemo(() => {
        if (!categories) {
            return MEMO_EMPTY_ARRAY;
        }
        const themeCategories = [...categories];
        if (recentEmojis?.length) {
            themeCategories.unshift({
                id: RECENT_SYMBOL_SET_ID,
                name: lang('RecentStickers'),
                emojis: recentEmojis,
            });
        }
        return themeCategories;
    }, [categories, lang, recentEmojis]);
    // Initialize data on first render.
    useEffect(() => {
        setTimeout(() => {
            const exec = () => {
                setCategories(emojiData.categories);
                setEmojis(emojiData.emojis);
            };
            if (emojiData) {
                exec();
            }
            else {
                ensureEmojiData()
                    .then(exec);
            }
        }, OPEN_ANIMATION_DELAY);
    }, []);
    const selectCategory = useLastCallback((index) => {
        setActiveCategoryIndex(index);
        const categoryEl = containerRef.current.closest('.SymbolMenu-main')
            .querySelector(`#emoji-category-${index}`);
        animateScroll({
            container: containerRef.current,
            element: categoryEl,
            position: 'start',
            margin: FOCUS_MARGIN,
            maxDistance: SMOOTH_SCROLL_DISTANCE,
        });
    });
    const handleEmojiSelect = useLastCallback((emoji, name) => {
        onEmojiSelect(emoji, name);
    });
    function renderCategoryButton(category, index) {
        const icon = ICONS_BY_CATEGORY[category.id];
        return icon && (<Button className={`symbol-set-button ${index === activeCategoryIndex ? 'activated' : ''}`} round faded color="translucent" onClick={() => selectCategory(index)} ariaLabel={category.name}>
        <Icon name={icon}/>
      </Button>);
    }
    const containerClassName = buildClassName('EmojiPicker', className);
    if (!shouldRenderContent) {
        return (<div className={containerClassName}>
        <Loading />
      </div>);
    }
    const headerClassName = buildClassName('EmojiPicker-header', !shouldHideTopBorder && 'with-top-border');
    return (<div className={containerClassName}>
      <div ref={headerRef} className={headerClassName} dir={lang.isRtl ? 'rtl' : undefined}>
        {allCategories.map(renderCategoryButton)}
      </div>
      <div ref={containerRef} onScroll={handleContentScroll} className={buildClassName('EmojiPicker-main', IS_TOUCH_ENV ? 'no-scrollbar' : 'custom-scroll')}>
        {allCategories.map((category, i) => (<EmojiCategory category={category} index={i} allEmojis={emojis} observeIntersection={observeIntersection} shouldRender={activeCategoryIndex >= i - 1 && activeCategoryIndex <= i + 1} onEmojiSelect={handleEmojiSelect}/>))}
      </div>
    </div>);
};
async function ensureEmojiData() {
    if (!emojiDataPromise) {
        emojiDataPromise = import('emoji-data-ios/emoji-data.json');
        emojiRawData = (await emojiDataPromise).default;
        emojiData = uncompressEmoji(emojiRawData);
    }
    return emojiDataPromise;
}
export default memo(withGlobal((global) => pick(global, ['recentEmojis']))(EmojiPicker));
