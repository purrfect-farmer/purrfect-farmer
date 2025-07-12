import { memo } from '../../../../lib/teact/teact';
import { STICKER_SIZE_INLINE_BOT_RESULT } from '../../../../config';
import StickerButton from '../../../common/StickerButton';
const StickerResult = ({ inlineResult, isSavedMessages, observeIntersection, onClick, isCurrentUserPremium, }) => {
    const { sticker } = inlineResult;
    if (!sticker) {
        return undefined;
    }
    return (<StickerButton sticker={sticker} size={STICKER_SIZE_INLINE_BOT_RESULT} observeIntersection={observeIntersection} title={sticker.emoji} className="chat-item-clickable" onClick={onClick} clickArg={inlineResult} isSavedMessages={isSavedMessages} canViewSet noShowPremium isCurrentUserPremium={isCurrentUserPremium}/>);
};
export default memo(StickerResult);
