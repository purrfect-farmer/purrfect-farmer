import { memo } from '../../../lib/teact/teact';
import { withGlobal } from '../../../global';
import { selectAnimatedEmojiEffect, selectAnimatedEmojiSound, selectCanPlayAnimatedEmojis, } from '../../../global/selectors';
import buildClassName from '../../../util/buildClassName';
import { LIKE_STICKER_ID } from '../../common/helpers/mediaDimensions';
import { getCustomEmojiSize } from '../composer/helpers/customEmoji';
import useAnimatedEmoji from '../../common/hooks/useAnimatedEmoji';
import CustomEmoji from '../../common/CustomEmoji';
import './AnimatedEmoji.scss';
const AnimatedCustomEmoji = ({ isOwn, customEmojiId, messageId, chatId, activeEmojiInteractions, sticker, effect, soundId, noPlay, observeIntersection, }) => {
    const { ref, size, style, handleClick, } = useAnimatedEmoji(chatId, messageId, soundId, activeEmojiInteractions, isOwn, effect?.emoji, getCustomEmojiSize(1));
    return (<CustomEmoji ref={ref} documentId={customEmojiId} className={buildClassName('AnimatedEmoji media-inner', sticker?.id === LIKE_STICKER_ID && 'like-sticker-thumb')} style={style} size={size} isBig noPlay={noPlay} withSharedAnimation forceOnHeavyAnimation={Boolean(effect && activeEmojiInteractions?.length)} observeIntersectionForLoading={observeIntersection} onClick={handleClick}/>);
};
export default memo(withGlobal((global, { customEmojiId, withEffects }) => {
    const sticker = global.customEmojis.byId[customEmojiId];
    return {
        sticker,
        effect: sticker?.emoji && withEffects ? selectAnimatedEmojiEffect(global, sticker.emoji) : undefined,
        soundId: sticker?.emoji && selectAnimatedEmojiSound(global, sticker.emoji),
        noPlay: !selectCanPlayAnimatedEmojis(global),
    };
})(AnimatedCustomEmoji));
