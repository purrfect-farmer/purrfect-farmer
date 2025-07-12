import { memo } from '../../../../lib/teact/teact';
import useLastCallback from '../../../../hooks/useLastCallback';
import GifButton from '../../../common/GifButton';
const GifResult = ({ inlineResult, isSavedMessages, canSendGifs, observeIntersection, onClick, }) => {
    const { gif } = inlineResult;
    const handleClick = useLastCallback((_gif, isSilent, shouldSchedule) => {
        onClick(inlineResult, isSilent, shouldSchedule);
    });
    if (!gif) {
        return undefined;
    }
    return (<GifButton gif={gif} observeIntersection={observeIntersection} className="chat-item-clickable" onClick={canSendGifs ? handleClick : undefined} isSavedMessages={isSavedMessages}/>);
};
export default memo(GifResult);
