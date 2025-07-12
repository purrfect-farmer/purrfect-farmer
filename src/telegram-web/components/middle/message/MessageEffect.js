import { memo, useEffect, useRef } from '../../../lib/teact/teact';
import buildClassName from '../../../util/buildClassName';
import useFlag from '../../../hooks/useFlag';
import { useIsIntersecting } from '../../../hooks/useIntersectionObserver';
import useLastCallback from '../../../hooks/useLastCallback';
import useMedia from '../../../hooks/useMedia';
import useOverlayPosition from './hooks/useOverlayPosition';
import AnimatedSticker from '../../common/AnimatedSticker';
import Portal from '../../ui/Portal';
import styles from './MessageEffect.module.scss';
const EFFECT_SIZE = 256;
const MessageEffect = ({ messageId, isMirrored, effect, shouldPlay, observeIntersectionForLoading, observeIntersectionForPlaying, onStop, }) => {
    const anchorRef = useRef();
    const ref = useRef();
    const canLoad = useIsIntersecting(anchorRef, observeIntersectionForLoading);
    const canPlay = useIsIntersecting(anchorRef, observeIntersectionForPlaying);
    const [isPlaying, startPlaying, stopPlaying] = useFlag();
    const [isPositionUpdateRequired, requirePositionUpdate, resetPositionUpdate] = useFlag();
    const effectHash = getEffectHash(effect);
    const effectBlob = useMedia(effectHash, !canLoad);
    const handleEnded = useLastCallback(() => {
        stopPlaying();
        onStop?.();
    });
    const updatePosition = useOverlayPosition({
        anchorRef,
        overlayRef: ref,
        isMirrored,
        isDisabled: !isPlaying,
        isForMessageEffect: true,
        id: effect.id,
    });
    useEffect(() => {
        if (isPositionUpdateRequired)
            updatePosition();
        resetPositionUpdate();
    }, [updatePosition, resetPositionUpdate, isPositionUpdateRequired]);
    useEffect(() => {
        if (canPlay && shouldPlay && effectBlob) {
            startPlaying();
            requirePositionUpdate();
        }
    }, [canPlay, effectBlob, shouldPlay, updatePosition]);
    const effectClassName = buildClassName(styles.root, isMirrored && styles.mirror);
    return (<div className={buildClassName(styles.anchor, isMirrored && styles.mirrorAnchor)} ref={anchorRef}>
      {isPlaying && (<Portal>
          <AnimatedSticker ref={ref} key={`effect-${messageId ?? effect.id}`} className={effectClassName} tgsUrl={effectBlob} size={EFFECT_SIZE} play isLowPriority noLoop forceAlways onEnded={handleEnded}/>
        </Portal>)}
    </div>);
};
function getEffectHash(effect) {
    if (effect.effectAnimationId) {
        return `sticker${effect.effectAnimationId}`;
    }
    return `sticker${effect.effectStickerId}?size=f`;
}
export default memo(MessageEffect);
