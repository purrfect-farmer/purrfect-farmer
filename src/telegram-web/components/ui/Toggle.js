import { memo } from '../../lib/teact/teact';
import buildClassName from '../../util/buildClassName';
import styles from './Toggle.module.scss';
function Toggle({ value }) {
    return (<div className={buildClassName(styles.root, 'Toggle')} aria-hidden>
      <i className={buildClassName(styles.filler, styles[value])}/>
      <i className={buildClassName(styles.widget, styles[value])}/>
    </div>);
}
export default memo(Toggle);
