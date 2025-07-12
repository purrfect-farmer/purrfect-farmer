import buildClassName from '../../util/buildClassName';
import useOldLang from '../../hooks/useOldLang';
import Button from './Button';
import './FloatingActionButton.scss';
const FloatingActionButton = ({ isShown, className, color = 'primary', ariaLabel, disabled, onClick, children, }) => {
    const lang = useOldLang();
    const buttonClassName = buildClassName('FloatingActionButton', isShown && 'revealed', className);
    return (<Button className={buttonClassName} color={color} round disabled={disabled} onClick={isShown && !disabled ? onClick : undefined} ariaLabel={ariaLabel} tabIndex={-1} isRtl={lang.isRtl}>
      {children}
    </Button>);
};
export default FloatingActionButton;
