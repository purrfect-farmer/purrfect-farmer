import { memo, useMemo, useRef } from '../../lib/teact/teact';
import useBuffering from '../../hooks/useBuffering';
import useLastCallback from '../../hooks/useLastCallback';
import useSyncEffect from '../../hooks/useSyncEffect';
import useVideoCleanup from '../../hooks/useVideoCleanup';
import useVideoAutoPause from '../middle/message/hooks/useVideoAutoPause';
function OptimizedVideo({ ref, isPriority, canPlay, children, onReady, onBroken, onTimeUpdate, ...restProps }) {
    const localRef = useRef();
    if (!ref) {
        ref = localRef;
    }
    const { handlePlaying: handlePlayingForAutoPause } = useVideoAutoPause(ref, canPlay, isPriority);
    const isReadyRef = useRef(false);
    const handleReady = useLastCallback(() => {
        if (!isReadyRef.current) {
            onReady?.();
            isReadyRef.current = true;
        }
    });
    // This is only needed for browsers not allowing autoplay
    const { isBuffered, bufferingHandlers } = useBuffering(true, onTimeUpdate, onBroken);
    const { onPlaying: handlePlayingForBuffering, ...otherBufferingHandlers } = bufferingHandlers;
    useSyncEffect(([prevIsBuffered]) => {
        if (prevIsBuffered === undefined) {
            return;
        }
        handleReady();
    }, [isBuffered, handleReady]);
    const handlePlaying = useLastCallback((e) => {
        handlePlayingForAutoPause();
        handlePlayingForBuffering(e);
        handleReady();
        restProps.onPlaying?.(e);
    });
    const mergedOtherBufferingHandlers = useMemo(() => {
        const mergedHandlers = {};
        Object.keys(otherBufferingHandlers).forEach((keyString) => {
            const key = keyString;
            mergedHandlers[key] = (event) => {
                restProps[key]?.(event);
                otherBufferingHandlers[key]?.(event);
            };
        });
        return mergedHandlers;
    }, [otherBufferingHandlers, restProps]);
    useVideoCleanup(ref, mergedOtherBufferingHandlers);
    return (<video ref={ref} autoPlay {...restProps} {...mergedOtherBufferingHandlers} onPlaying={handlePlaying}>
      {children}
    </video>);
}
export default memo(OptimizedVideo);
