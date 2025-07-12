import buildClassName from '../../util/buildClassName';
import styles from './BadgeButton.module.scss';
const BadgeButton = ({ children, className, onClick, onMouseDown, }) => {
    return (<div className={buildClassName(styles.root, onClick && styles.clickable, className)} onClick={onClick} onMouseDown={onMouseDown}>
      {children}
    </div>);
};
export default BadgeButton;
