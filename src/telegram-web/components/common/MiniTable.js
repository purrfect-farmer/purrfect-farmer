import { memo } from '../../lib/teact/teact';
import buildClassName from '../../util/buildClassName';
import styles from './MiniTable.module.scss';
const MiniTable = ({ data, style, className, valueClassName, keyClassName, }) => {
    return (<div className={buildClassName(styles.root, className)} style={style}>
      {data.map(([key, value]) => (<>
          <div className={buildClassName(styles.key, keyClassName)}>{key}</div>
          <div className={buildClassName(styles.value, valueClassName)}>{value}</div>
        </>))}
    </div>);
};
export default memo(MiniTable);
