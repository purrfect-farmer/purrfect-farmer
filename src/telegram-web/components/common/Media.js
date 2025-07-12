import { memo, useRef } from '../../lib/teact/teact';
import { getMessageHtmlId, getMessageIsSpoiler, getMessageMediaHash, getMessageMediaThumbDataUri, getMessageVideo, } from '../../global/helpers';
import buildClassName from '../../util/buildClassName';
import { formatMediaDuration } from '../../util/dates/dateFormat';
import stopEvent from '../../util/stopEvent';
import useFlag from '../../hooks/useFlag';
import { useIsIntersecting } from '../../hooks/useIntersectionObserver';
import useLastCallback from '../../hooks/useLastCallback';
import useMedia from '../../hooks/useMedia';
import useMediaTransitionDeprecated from '../../hooks/useMediaTransitionDeprecated';
import MediaSpoiler from './MediaSpoiler';
import './Media.scss';
const Media = ({ message, idPrefix = 'shared-media', isProtected, observeIntersection, onClick, }) => {
    const ref = useRef();
    const isIntersecting = useIsIntersecting(ref, observeIntersection);
    const thumbDataUri = getMessageMediaThumbDataUri(message);
    const mediaBlobUrl = useMedia(getMessageMediaHash(message, 'pictogram'), !isIntersecting);
    const transitionClassNames = useMediaTransitionDeprecated(mediaBlobUrl);
    const video = getMessageVideo(message);
    const hasSpoiler = getMessageIsSpoiler(message);
    const [isSpoilerShown, , hideSpoiler] = useFlag(hasSpoiler);
    const handleClick = useLastCallback(() => {
        hideSpoiler();
        onClick(message.id, message.chatId);
    });
    return (<div ref={ref} id={`${idPrefix}${getMessageHtmlId(message.id)}`} className="Media scroll-item" onClick={onClick ? handleClick : undefined}>
      <img src={thumbDataUri} className="media-miniature" alt="" draggable={!isProtected} decoding="async" onContextMenu={isProtected ? stopEvent : undefined}/>
      <img src={mediaBlobUrl} className={buildClassName('full-media', 'media-miniature', transitionClassNames)} alt="" draggable={!isProtected} decoding="async" onContextMenu={isProtected ? stopEvent : undefined}/>
      {hasSpoiler && (<MediaSpoiler thumbDataUri={mediaBlobUrl || thumbDataUri} isVisible={isSpoilerShown} className="media-spoiler"/>)}
      {video && <span className="video-duration">{video.isGif ? 'GIF' : formatMediaDuration(video.duration)}</span>}
      {isProtected && <span className="protector"/>}
    </div>);
};
export default memo(Media);
