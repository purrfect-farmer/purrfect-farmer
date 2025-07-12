import buildClassName from '../../util/buildClassName';
import useLastCallback from '../../hooks/useLastCallback';
import styles from './Link.module.scss';
const Link = ({ children, isPrimary, className, isRtl, withMultilineFix, onClick, }) => {
    const handleClick = useLastCallback((e) => {
        e.preventDefault();
        onClick(e);
    });
    return (<a href="#" className={buildClassName('Link', styles.link, className, isPrimary && styles.isPrimary)} dir={!withMultilineFix ? (isRtl ? 'rtl' : 'auto') : undefined} onClick={onClick ? handleClick : undefined}>
      {children}
    </a>);
};
export default Link;
