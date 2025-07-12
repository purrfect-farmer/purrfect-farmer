import { memo } from '../../../lib/teact/teact';
import buildClassName from '../../../util/buildClassName';
import useLastCallback from '../../../hooks/useLastCallback';
import CustomEmoji from '../../common/CustomEmoji';
import './EmojiButton.scss';
const CUSTOM_EMOJI_SIZE = 32;
const CustomEmojiButton = ({ emoji, focus, onClick, observeIntersection, }) => {
    const handleClick = useLastCallback((e) => {
        // Preventing safari from losing focus on Composer MessageInput
        e.preventDefault();
        onClick?.(emoji);
    });
    const className = buildClassName('EmojiButton', focus && 'focus');
    return (<div className={className} onMouseDown={handleClick} title={emoji.emoji}>
      <CustomEmoji documentId={emoji.id} size={CUSTOM_EMOJI_SIZE} withSharedAnimation shouldPreloadPreview observeIntersectionForPlaying={observeIntersection}/>
    </div>);
};
export default memo(CustomEmojiButton);
