import buildClassName from '../../util/buildClassName';
import useOldLang from '../../hooks/useOldLang';
import styles from './Separator.module.scss';
function Separator({ children, className }) {
    const lang = useOldLang();
    return (<div dir={lang.isRtl ? 'rtl' : undefined} className={buildClassName(styles.separator, className)}>
      {children}
    </div>);
}
export default Separator;
