import { memo } from '../../../lib/teact/teact';
import buildClassName from '../../../util/buildClassName';
import Icon from '../../common/icons/Icon';
import Button from '../../ui/Button';
import styles from './PhoneCallButton.module.scss';
const PhoneCallButton = ({ onClick, label, customIcon, icon, iconClassName, className, isDisabled, isActive, }) => {
    return (<div className={styles.root}>
      <Button round className={buildClassName(className, styles.button, isActive && styles.active)} onClick={onClick} disabled={isDisabled}>
        {customIcon || <Icon name={icon} className={iconClassName}/>}
      </Button>
      <div className={styles.buttonText}>{label}</div>
    </div>);
};
export default memo(PhoneCallButton);
