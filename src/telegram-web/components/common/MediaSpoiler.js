import { memo, useRef } from '../../lib/teact/teact';
import { requestMutation } from '../../lib/fasterdom/fasterdom';
import buildClassName from '../../util/buildClassName';
import useCanvasBlur from '../../hooks/useCanvasBlur';
import useLastCallback from '../../hooks/useLastCallback';
import useShowTransitionDeprecated from '../../hooks/useShowTransitionDeprecated';
import styles from './MediaSpoiler.module.scss';
const BLUR_RADIUS = 25;
const ANIMATION_DURATION = 500;
const MediaSpoiler = ({ isVisible, withAnimation, thumbDataUri, className, width, height, }) => {
    const ref = useRef();
    const { shouldRender, transitionClassNames } = useShowTransitionDeprecated(isVisible, undefined, true, withAnimation ? false : undefined, undefined, ANIMATION_DURATION);
    const canvasRef = useCanvasBlur(thumbDataUri, !shouldRender, undefined, BLUR_RADIUS, width, height);
    const handleClick = useLastCallback((e) => {
        if (!ref.current)
            return;
        const el = ref.current;
        const rect = e.currentTarget.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        const shiftX = x - (rect.width / 2);
        const shiftY = y - (rect.height / 2);
        requestMutation(() => {
            el.setAttribute('style', `--click-shift-x: ${shiftX}px; --click-shift-y: ${shiftY}px`);
        });
    });
    if (!shouldRender) {
        return undefined;
    }
    return (<div className={buildClassName(styles.root, transitionClassNames, className, withAnimation && styles.maskAnimation)} ref={ref} onClick={withAnimation ? handleClick : undefined}>
      <canvas ref={canvasRef} className={styles.canvas} width={width} height={height}/>
      <div className={styles.dots}/>
    </div>);
};
export default memo(MediaSpoiler);
