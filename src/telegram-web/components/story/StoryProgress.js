import { memo, } from '../../lib/teact/teact';
import buildClassName from '../../util/buildClassName';
import useLastCallback from '../../hooks/useLastCallback';
import styles from './StoryProgress.module.scss';
const DEFAULT_STORY_DURATION_S = 6;
function StoryProgress({ isActive, isViewed, isVideo, duration = DEFAULT_STORY_DURATION_S, isPaused, onImageComplete, }) {
    const handleAnimationEnd = useLastCallback((event) => {
        if (!isVideo && event.animationName === styles.progress) {
            onImageComplete();
        }
    });
    const classNames = buildClassName(styles.root, isViewed && styles.viewed, isActive && styles.active, isPaused && styles.paused);
    return (<span className={classNames} aria-hidden>
      {isActive && (<i style={`--progress-duration: ${duration}s`} className={styles.inner} onAnimationEnd={handleAnimationEnd}/>)}
    </span>);
}
export default memo(StoryProgress);
