import { useMemo, useState } from '../lib/teact/teact';
import { areDeepEqual } from '../util/areDeepEqual';
import { isSafariPatchInProgress } from '../util/patchSafariProgressiveAudio';
import { debounce } from '../util/schedulers';
import useLastCallback from './useLastCallback';
const MIN_READY_STATE = 3;
// Avoid flickering when re-mounting previously buffered video
const DEBOUNCE = 200;
const MIN_ALLOWED_MEDIA_DURATION = 0.1; // Some video emojis have weird duration of 0.04 causing extreme amount of events
const useBuffering = (noInitiallyBuffered = false, onTimeUpdate, onBroken) => {
    const [isBuffered, setIsBuffered] = useState(!noInitiallyBuffered);
    const [isReady, setIsReady] = useState(false);
    const [bufferedProgress, setBufferedProgress] = useState(0);
    const [bufferedRanges, setBufferedRanges] = useState([]);
    const setIsBufferedDebounced = useMemo(() => {
        return debounce(setIsBuffered, DEBOUNCE, false, true);
    }, []);
    const handleBuffering = useLastCallback((e) => {
        const media = e.currentTarget;
        if (media.duration < MIN_ALLOWED_MEDIA_DURATION) {
            onBroken?.();
            return;
        }
        if (e.type === 'timeupdate') {
            onTimeUpdate?.(e);
        }
        if (!isSafariPatchInProgress(media)) {
            if (media.buffered.length) {
                const ranges = getTimeRanges(media.buffered, media.duration);
                const bufferedLength = ranges.reduce((acc, { start, end }) => acc + end - start, 0);
                setBufferedProgress(bufferedLength / media.duration);
                setBufferedRanges((currentRanges) => {
                    return areDeepEqual(currentRanges, ranges) ? currentRanges : ranges;
                });
            }
            setIsBufferedDebounced(media.readyState >= MIN_READY_STATE || media.currentTime > 0);
            setIsReady((current) => current || media.readyState > MIN_READY_STATE);
        }
    });
    const bufferingHandlers = {
        onPLay: handleBuffering,
        onLoadedData: handleBuffering,
        onPlaying: handleBuffering,
        onLoadStart: handleBuffering, // Needed for Safari to start
        onPause: handleBuffering, // Needed for Chrome when seeking
        onTimeUpdate: handleBuffering, // Needed for audio buffering progress
        onProgress: handleBuffering, // Needed for video buffering progress
    };
    return {
        isReady,
        isBuffered,
        bufferedProgress,
        bufferedRanges,
        bufferingHandlers,
        checkBuffering(element) {
            setIsBufferedDebounced(element.readyState >= MIN_READY_STATE);
        },
    };
};
function getTimeRanges(ranges, duration) {
    const result = [];
    for (let i = 0; i < ranges.length; i++) {
        result.push({
            start: ranges.start(i) / duration,
            end: ranges.end(i) / duration,
        });
    }
    return result;
}
export default useBuffering;
