import { useRef } from '../../lib/teact/teact';
import { IS_TOUCH_ENV } from '../../util/browser/windowEnvironment';
import useLastCallback from '../../hooks/useLastCallback';
import Button from './Button';
const BUTTON_ACTIVATE_DELAY = 200;
let openTimeout;
let isFirstTimeActivation = true;
const ResponsiveHoverButton = ({ onActivate, ...buttonProps }) => {
    const isMouseInside = useRef(false);
    const handleMouseEnter = useLastCallback((e) => {
        isMouseInside.current = true;
        // This is used to counter additional delay caused by asynchronous module loading
        if (isFirstTimeActivation) {
            isFirstTimeActivation = false;
            onActivate(e);
            return;
        }
        if (openTimeout) {
            clearTimeout(openTimeout);
            openTimeout = undefined;
        }
        openTimeout = window.setTimeout(() => {
            if (isMouseInside.current) {
                onActivate(e);
            }
        }, BUTTON_ACTIVATE_DELAY);
    });
    const handleMouseLeave = useLastCallback(() => {
        isMouseInside.current = false;
    });
    const handleClick = useLastCallback((e) => {
        isMouseInside.current = true;
        onActivate(e);
    });
    return (<Button {...buttonProps} onMouseEnter={!IS_TOUCH_ENV ? handleMouseEnter : undefined} onMouseLeave={!IS_TOUCH_ENV ? handleMouseLeave : undefined} onClick={!IS_TOUCH_ENV ? onActivate : handleClick}/>);
};
export default ResponsiveHoverButton;
