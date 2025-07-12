import { memo } from '../../../lib/teact/teact';
import buildClassName from '../../../util/buildClassName';
import styles from './ChatCallStatus.module.scss';
const ChatCallStatus = ({ isSelected, isActive, isMobile, }) => {
    return (<div className={buildClassName(styles.root, isActive && styles.active, isSelected && !isMobile && styles.selected)}>
      <div className={styles.indicator}>
        <div className={styles.indicatorInner}/>
        <div className={styles.indicatorInner}/>
        <div className={styles.indicatorInner}/>
      </div>
    </div>);
};
export default memo(ChatCallStatus);
