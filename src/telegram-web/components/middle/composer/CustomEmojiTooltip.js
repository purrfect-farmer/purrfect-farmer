import { memo, useEffect, useRef } from '../../../lib/teact/teact';
import { getActions, withGlobal } from '../../../global';
import { COMPOSER_EMOJI_SIZE_PICKER } from '../../../config';
import { selectIsChatWithSelf, selectIsCurrentUserPremium } from '../../../global/selectors';
import buildClassName from '../../../util/buildClassName';
import captureEscKeyListener from '../../../util/captureEscKeyListener';
import useHorizontalScroll from '../../../hooks/useHorizontalScroll';
import { useIntersectionObserver } from '../../../hooks/useIntersectionObserver';
import useLastCallback from '../../../hooks/useLastCallback';
import usePreviousDeprecated from '../../../hooks/usePreviousDeprecated';
import useShowTransitionDeprecated from '../../../hooks/useShowTransitionDeprecated';
import StickerButton from '../../common/StickerButton';
import Loading from '../../ui/Loading';
import styles from './CustomEmojiTooltip.module.scss';
const INTERSECTION_THROTTLE = 200;
const CustomEmojiTooltip = ({ isOpen, addRecentCustomEmoji, onCustomEmojiSelect, onClose, customEmoji, isSavedMessages, isCurrentUserPremium, noPlay, }) => {
    const { clearCustomEmojiForEmoji } = getActions();
    const containerRef = useRef();
    const { shouldRender, transitionClassNames } = useShowTransitionDeprecated(isOpen, undefined, undefined, false);
    const prevStickers = usePreviousDeprecated(customEmoji, true);
    const displayedStickers = customEmoji || prevStickers;
    useHorizontalScroll(containerRef);
    const { observe: observeIntersection, } = useIntersectionObserver({ rootRef: containerRef, throttleMs: INTERSECTION_THROTTLE, isDisabled: !isOpen });
    useEffect(() => (isOpen ? captureEscKeyListener(onClose) : undefined), [isOpen, onClose]);
    const handleCustomEmojiSelect = useLastCallback((ce) => {
        if (!isOpen)
            return;
        onCustomEmojiSelect(ce);
        addRecentCustomEmoji({
            documentId: ce.id,
        });
        clearCustomEmojiForEmoji();
    });
    const className = buildClassName(styles.root, 'composer-tooltip custom-scroll-x', transitionClassNames, !displayedStickers?.length && styles.hidden);
    return (<div ref={containerRef} className={className}>
      {shouldRender && displayedStickers ? (displayedStickers.map((sticker) => (<StickerButton key={sticker.id} sticker={sticker} className={styles.emojiButton} size={COMPOSER_EMOJI_SIZE_PICKER} observeIntersection={observeIntersection} onClick={handleCustomEmojiSelect} clickArg={sticker} isSavedMessages={isSavedMessages} canViewSet isCurrentUserPremium={isCurrentUserPremium} noPlay={noPlay}/>))) : shouldRender ? (<Loading />) : undefined}
    </div>);
};
export default memo(withGlobal((global, { chatId }) => {
    const { stickers: customEmoji } = global.customEmojis.forEmoji;
    const isSavedMessages = selectIsChatWithSelf(global, chatId);
    const isCurrentUserPremium = selectIsCurrentUserPremium(global);
    return { customEmoji, isSavedMessages, isCurrentUserPremium };
})(CustomEmojiTooltip));
