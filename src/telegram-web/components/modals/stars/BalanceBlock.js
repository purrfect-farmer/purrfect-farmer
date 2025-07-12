import { memo } from '../../../lib/teact/teact';
import { getActions } from '../../../global';
import { formatStarsAmount } from '../../../global/helpers/payments';
import buildClassName from '../../../util/buildClassName';
import useLang from '../../../hooks/useLang';
import BadgeButton from '../../common/BadgeButton';
import Icon from '../../common/icons/Icon';
import StarIcon from '../../common/icons/StarIcon';
import styles from './StarsBalanceModal.module.scss';
const BalanceBlock = ({ balance, className, withAddButton }) => {
    const lang = useLang();
    const { openStarsBalanceModal, } = getActions();
    return (<div className={buildClassName(styles.balanceBlock, className)}>
      <div className={styles.balanceInfo}>
        <span className={styles.smallerText}>{lang('StarsBalance')}</span>
        <div className={styles.balanceBottom}>
          <StarIcon type="gold" size="middle"/>
          {balance !== undefined ? formatStarsAmount(lang, balance) : '…'}
          {withAddButton && (<BadgeButton className={styles.addStarsButton} onClick={() => openStarsBalanceModal({})}>
              <Icon className={styles.addStarsIcon} name="add"/>
            </BadgeButton>)}
        </div>
      </div>
    </div>);
};
export default memo(BalanceBlock);
