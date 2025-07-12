import { memo, useState } from '../../lib/teact/teact';
import buildClassName from '../../util/buildClassName';
import useFlag from '../../hooks/useFlag';
import useLastCallback from '../../hooks/useLastCallback';
import useMediaTransitionDeprecated from '../../hooks/useMediaTransitionDeprecated';
import AnimatedSticker from './AnimatedSticker';
const DEFAULT_SIZE = 150;
function AnimatedIcon(props) {
    const { size = DEFAULT_SIZE, play = true, noLoop = true, className, noTransition, nonInteractive, onLoad, onClick, ...otherProps } = props;
    const [isAnimationLoaded, markAnimationLoaded] = useFlag(false);
    const transitionClassNames = useMediaTransitionDeprecated(noTransition || isAnimationLoaded);
    const handleLoad = useLastCallback(() => {
        markAnimationLoaded();
        onLoad?.();
    });
    const [playKey, setPlayKey] = useState(String(Math.random()));
    const handleClick = useLastCallback(() => {
        if (play === true) {
            setPlayKey(String(Math.random()));
        }
        onClick?.();
    });
    return (<AnimatedSticker className={buildClassName(className, transitionClassNames)} size={size} play={play === true ? playKey : play} noLoop={noLoop} onClick={!nonInteractive ? handleClick : undefined} onLoad={handleLoad} {...otherProps}/>);
}
export default memo(AnimatedIcon);
