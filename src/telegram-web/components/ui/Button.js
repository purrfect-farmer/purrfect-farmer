import { useRef, useState } from '../../lib/teact/teact';
import { IS_TOUCH_ENV, MouseButton } from '../../util/browser/windowEnvironment';
import buildClassName from '../../util/buildClassName';
import buildStyle from '../../util/buildStyle';
import useLastCallback from '../../hooks/useLastCallback';
import useOldLang from '../../hooks/useOldLang';
import Sparkles from '../common/Sparkles';
import RippleEffect from './RippleEffect';
import Spinner from './Spinner';
import './Button.scss';
// Longest animation duration;
const CLICKED_TIMEOUT = 400;
const Button = ({ ref, type = 'button', id, onClick, onContextMenu, onMouseDown, onMouseUp, onMouseEnter, onMouseLeave, onFocus, children, size = 'default', color = 'primary', backgroundImage, className, round, pill, badge, fluid, isText, isLoading, isShiny, withPremiumGradient, withSparkleEffect, onTransitionEnd, ariaLabel, ariaControls, hasPopup, href, download, disabled, nonInteractive, allowDisabledClick, noFastClick = color === 'danger', ripple, faded, tabIndex, isRtl, isRectangular, noPreventDefault, shouldStopPropagation, noForcedUpperCase, style, }) => {
    let elementRef = useRef();
    if (ref) {
        elementRef = ref;
    }
    const lang = useOldLang();
    const [isClicked, setIsClicked] = useState(false);
    const isNotInteractive = disabled || nonInteractive;
    const fullClassName = buildClassName('Button', className, size, color, round && 'round', pill && 'pill', fluid && 'fluid', badge && 'badge', isNotInteractive && 'disabled', nonInteractive && 'non-interactive', allowDisabledClick && 'click-allowed', isText && 'text', isLoading && 'loading', ripple && 'has-ripple', faded && 'faded', isClicked && 'clicked', backgroundImage && 'with-image', isShiny && 'shiny', withPremiumGradient && 'premium', isRectangular && 'rectangular', noForcedUpperCase && 'no-upper-case');
    const handleClick = useLastCallback((e) => {
        if ((allowDisabledClick || !isNotInteractive) && onClick) {
            onClick(e);
        }
        if (shouldStopPropagation)
            e.stopPropagation();
        setIsClicked(true);
        setTimeout(() => {
            setIsClicked(false);
        }, CLICKED_TIMEOUT);
    });
    const handleMouseDown = useLastCallback((e) => {
        if (!noPreventDefault)
            e.preventDefault();
        if ((allowDisabledClick || !isNotInteractive) && onMouseDown) {
            onMouseDown(e);
        }
        if (!IS_TOUCH_ENV && e.button === MouseButton.Main && !noFastClick) {
            handleClick(e);
        }
    });
    const content = (<>
      {withSparkleEffect && <Sparkles preset="button"/>}
      {isLoading ? (<div>
          <span dir={isRtl ? 'auto' : undefined}>{lang('Cache.ClearProgress')}</span>
          <Spinner color={isText ? 'blue' : 'white'}/>
        </div>) : children}
      {!isNotInteractive && ripple && (<RippleEffect />)}
    </>);
    if (href) {
        return (<a ref={elementRef} id={id} className={fullClassName} href={href} title={ariaLabel} download={download} tabIndex={tabIndex} dir={isRtl ? 'rtl' : undefined} aria-label={ariaLabel} aria-controls={ariaControls} style={style} onTransitionEnd={onTransitionEnd} target="_blank" rel="noreferrer">
        {content}
      </a>);
    }
    return (<button ref={elementRef} id={id} type={type} className={fullClassName} onClick={IS_TOUCH_ENV || noFastClick ? handleClick : undefined} onContextMenu={onContextMenu} onMouseDown={handleMouseDown} onMouseUp={onMouseUp} onMouseEnter={onMouseEnter && !isNotInteractive ? onMouseEnter : undefined} onMouseLeave={onMouseLeave && !isNotInteractive ? onMouseLeave : undefined} onTransitionEnd={onTransitionEnd} onFocus={onFocus && !isNotInteractive ? onFocus : undefined} aria-label={ariaLabel} aria-controls={ariaControls} aria-haspopup={hasPopup} title={ariaLabel} tabIndex={tabIndex} dir={isRtl ? 'rtl' : undefined} style={buildStyle(style, backgroundImage && `background-image: url(${backgroundImage})`) || undefined}>
      {content}
    </button>);
};
export default Button;
