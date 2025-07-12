import { IS_TEST } from '../../config';
import buildClassName from '../../util/buildClassName';
import useAppLayout from '../../hooks/useAppLayout';
import useLastCallback from '../../hooks/useLastCallback';
import useOldLang from '../../hooks/useOldLang';
import Icon from '../common/icons/Icon';
import './MenuItem.scss';
const MenuItem = (props) => {
    const { icon, isCharIcon, customIcon, className, children, onClick, href, target, download, disabled, destructive, ariaLabel, withWrap, rel = 'noopener noreferrer', onContextMenu, clickArg, withPreventDefaultOnMouseDown, } = props;
    const lang = useOldLang();
    const { isTouchScreen } = useAppLayout();
    const handleClick = useLastCallback((e) => {
        if (disabled || !onClick) {
            e.preventDefault();
            return;
        }
        onClick(e, clickArg);
    });
    const handleKeyDown = useLastCallback((e) => {
        if (e.keyCode !== 13 && e.keyCode !== 32) {
            return;
        }
        if (disabled || !onClick) {
            e.preventDefault();
            return;
        }
        onClick(e, clickArg);
    });
    const handleMouseDown = useLastCallback((e) => {
        if (withPreventDefaultOnMouseDown) {
            e.preventDefault();
        }
    });
    const fullClassName = buildClassName('MenuItem', className, disabled && 'disabled', destructive && 'destructive', !isTouchScreen && 'compact', withWrap && 'wrap');
    const content = (<>
      {!customIcon && icon && (<Icon name={isCharIcon ? 'char' : icon} character={isCharIcon ? icon : undefined}/>)}
      {customIcon}
      {children}
    </>);
    if (href && !disabled) {
        return (<a tabIndex={0} className={fullClassName} href={href} download={download} aria-label={ariaLabel} title={ariaLabel} target={target || (href.startsWith(window.location.origin) || IS_TEST ? '_self' : '_blank')} rel={rel} dir={lang.isRtl ? 'rtl' : undefined} onClick={onClick} onMouseDown={handleMouseDown}>
        {content}
      </a>);
    }
    return (<div role="menuitem" tabIndex={0} className={fullClassName} onClick={handleClick} onKeyDown={handleKeyDown} onMouseDown={handleMouseDown} onContextMenu={onContextMenu} aria-label={ariaLabel} title={ariaLabel} dir={lang.isRtl ? 'rtl' : undefined}>
      {content}
    </div>);
};
export default MenuItem;
