import buildClassName from '../../util/buildClassName';
import styles from './MenuSeparator.module.scss';
const MenuSeparator = ({ className, size = 'thin' }) => {
    return (<div className={buildClassName(styles.root, styles[size], className)}/>);
};
export default MenuSeparator;
