import { memo } from '../../../lib/teact/teact';
import { withGlobal } from '../../../global';
import { selectAnimatedEmoji, selectAnimatedEmojiEffect, selectAnimatedEmojiSound, } from '../../../global/selectors';
import buildClassName from '../../../util/buildClassName';
import { LIKE_STICKER_ID } from '../../common/helpers/mediaDimensions';
import { useIsIntersecting } from '../../../hooks/useIntersectionObserver';
import useAnimatedEmoji from '../../common/hooks/useAnimatedEmoji';
import AnimatedIconFromSticker from '../../common/AnimatedIconFromSticker';
import './AnimatedEmoji.scss';
const QUALITY = 1;
const AnimatedEmoji = ({ isOwn, observeIntersection, forceLoadPreview, messageId, chatId, activeEmojiInteractions, sticker, effect, soundId, }) => {
    const { ref, size, style, handleClick, } = useAnimatedEmoji(chatId, messageId, soundId, activeEmojiInteractions, isOwn, effect?.emoji);
    const isIntersecting = useIsIntersecting(ref, observeIntersection);
    return (<AnimatedIconFromSticker sticker={sticker} size={size} quality={QUALITY} noLoad={!isIntersecting} forcePreview={forceLoadPreview} play={isIntersecting} forceAlways ref={ref} className={buildClassName('AnimatedEmoji media-inner', sticker?.id === LIKE_STICKER_ID && 'like-sticker-thumb')} style={style} onClick={handleClick}/>);
};
export default memo(withGlobal((global, { emoji, withEffects }) => {
    return {
        sticker: selectAnimatedEmoji(global, emoji),
        effect: withEffects ? selectAnimatedEmojiEffect(global, emoji) : undefined,
        soundId: selectAnimatedEmojiSound(global, emoji),
    };
})(AnimatedEmoji));
