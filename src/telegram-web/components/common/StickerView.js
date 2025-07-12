import { memo, useMemo, useRef } from '../../lib/teact/teact';
import { getGlobal } from '../../global';
import { getStickerMediaHash } from '../../global/helpers';
import { selectIsAlwaysHighPriorityEmoji } from '../../global/selectors';
import { IS_ANDROID, IS_IOS, IS_WEBM_SUPPORTED } from '../../util/browser/windowEnvironment';
import buildClassName from '../../util/buildClassName';
import * as mediaLoader from '../../util/mediaLoader';
import useColorFilter from '../../hooks/stickers/useColorFilter';
import useCoordsInSharedCanvas from '../../hooks/useCoordsInSharedCanvas';
import useFlag from '../../hooks/useFlag';
import { useIsIntersecting } from '../../hooks/useIntersectionObserver';
import useMedia from '../../hooks/useMedia';
import useMediaTransition from '../../hooks/useMediaTransition';
import useMountAfterHeavyAnimation from '../../hooks/useMountAfterHeavyAnimation';
import useThumbnail from '../../hooks/useThumbnail';
import useUniqueId from '../../hooks/useUniqueId';
import useDevicePixelRatio from '../../hooks/window/useDevicePixelRatio';
import OptimizedVideo from '../ui/OptimizedVideo';
import AnimatedSticker from './AnimatedSticker';
import styles from './StickerView.module.scss';
const SHARED_PREFIX = 'shared';
const STICKER_SIZE = 24;
const StickerView = ({ containerRef, sticker, thumbClassName, fullMediaHash, fullMediaClassName, isSmall, size = STICKER_SIZE, customColor, loopLimit, shouldLoop = false, shouldPreloadPreview, forceAlways, forceOnHeavyAnimation, observeIntersectionForLoading, observeIntersectionForPlaying, noLoad, noPlay, noVideoOnMobile, withSharedAnimation, withTranslucentThumb, sharedCanvasRef, onVideoEnded, onAnimatedStickerLoop, }) => {
    const { id, isLottie, stickerSetInfo, emoji, } = sticker;
    const [isVideoBroken, markVideoBroken] = useFlag();
    const isUnsupportedVideo = sticker.isVideo && (!IS_WEBM_SUPPORTED
        || (noVideoOnMobile && (IS_IOS || IS_ANDROID)));
    const isVideo = sticker.isVideo;
    const isStatic = !isLottie && !isVideo;
    const previewMediaHash = getStickerMediaHash(sticker, 'preview');
    const dpr = useDevicePixelRatio();
    const filterStyle = useColorFilter(customColor);
    const isIntersectingForLoading = useIsIntersecting(containerRef, observeIntersectionForLoading);
    const shouldLoad = isIntersectingForLoading && !noLoad;
    const isIntersectingForPlaying = (useIsIntersecting(containerRef, observeIntersectionForPlaying)
        && isIntersectingForLoading);
    const shouldPlay = isIntersectingForPlaying && !noPlay;
    const hasIntersectedForPlayingRef = useRef(isIntersectingForPlaying);
    if (!hasIntersectedForPlayingRef.current && isIntersectingForPlaying) {
        hasIntersectedForPlayingRef.current = true;
    }
    const cachedPreview = mediaLoader.getFromMemory(previewMediaHash);
    const isReadyToMountFullMedia = useMountAfterHeavyAnimation(hasIntersectedForPlayingRef.current);
    const shouldForcePreview = isUnsupportedVideo || (isStatic ? isSmall : noPlay);
    const shouldLoadPreview = !customColor && !cachedPreview && (!isReadyToMountFullMedia || shouldForcePreview);
    const previewMediaData = useMedia(previewMediaHash, !shouldLoadPreview);
    const withPreview = shouldLoadPreview || cachedPreview;
    const shouldSkipLoadingFullMedia = Boolean(shouldForcePreview || (fullMediaHash === previewMediaHash && (cachedPreview || previewMediaData)));
    const fullMediaData = useMedia(fullMediaHash || `sticker${id}`, !shouldLoad || shouldSkipLoadingFullMedia);
    const shouldRenderFullMedia = isReadyToMountFullMedia && fullMediaData && !isVideoBroken;
    const [isPlayerReady, markPlayerReady] = useFlag();
    const isFullMediaReady = shouldRenderFullMedia && (isStatic || isPlayerReady);
    const thumbDataUri = useThumbnail(sticker.thumbnail);
    const thumbData = cachedPreview || previewMediaData || thumbDataUri;
    const isThumbOpaque = sharedCanvasRef && !withTranslucentThumb;
    const noCrossTransition = Boolean(isLottie && withPreview);
    const thumbRef = useMediaTransition(thumbData && !isFullMediaReady, {
        noCloseTransition: noCrossTransition,
    });
    const fullMediaRef = useMediaTransition(isFullMediaReady, {
        noOpenTransition: noCrossTransition,
    });
    const coords = useCoordsInSharedCanvas(containerRef, sharedCanvasRef);
    // Preload preview for Message Input and local message
    useMedia(previewMediaHash, !shouldLoad || !shouldPreloadPreview);
    const randomIdPrefix = useUniqueId();
    const renderId = useMemo(() => ([
        (withSharedAnimation ? SHARED_PREFIX : randomIdPrefix),
        id,
        size,
        (withSharedAnimation ? customColor : undefined),
        dpr,
    ].filter(Boolean).join('_')), [id, size, customColor, dpr, withSharedAnimation, randomIdPrefix]);
    return (<>
      <img ref={thumbRef} src={thumbData} className={buildClassName(styles.thumb, noCrossTransition && styles.noTransition, isThumbOpaque && styles.thumbOpaque, thumbClassName, 'sticker-media')} style={filterStyle} alt="" draggable={false}/>
      {shouldRenderFullMedia && (isLottie ? (<AnimatedSticker ref={fullMediaRef} key={renderId} renderId={renderId} size={size} className={buildClassName(styles.media, (noCrossTransition || isThumbOpaque) && styles.noTransition, fullMediaClassName)} tgsUrl={fullMediaData} play={shouldPlay} noLoop={!shouldLoop} forceOnHeavyAnimation={forceAlways || forceOnHeavyAnimation} forceAlways={forceAlways} isLowPriority={isSmall && !selectIsAlwaysHighPriorityEmoji(getGlobal(), stickerSetInfo)} sharedCanvas={sharedCanvasRef?.current || undefined} sharedCanvasCoords={coords} onLoad={markPlayerReady} onLoop={onAnimatedStickerLoop} onEnded={onAnimatedStickerLoop} color={customColor}/>) : isVideo ? (<OptimizedVideo ref={fullMediaRef} canPlay={shouldPlay} className={buildClassName(styles.media, fullMediaClassName, 'sticker-media')} src={fullMediaData} playsInline muted loop={shouldLoop && !loopLimit} isPriority={forceAlways} disablePictureInPicture onReady={markPlayerReady} onBroken={markVideoBroken} onEnded={onVideoEnded} style={filterStyle}/>) : (<img ref={fullMediaRef} className={buildClassName(styles.media, fullMediaClassName, 'sticker-media')} src={fullMediaData} alt={emoji} style={filterStyle} draggable={false}/>))}
    </>);
};
export default memo(StickerView);
