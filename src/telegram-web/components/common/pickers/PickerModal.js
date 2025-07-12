import { memo } from '../../../lib/teact/teact';
import buildClassName from '../../../util/buildClassName';
import useOldLang from '../../../hooks/useOldLang';
import Button from '../../ui/Button';
import Modal from '../../ui/Modal';
import styles from './PickerModal.module.scss';
const PickerModal = ({ confirmButtonText, isConfirmDisabled, shouldAdaptToSearch, withFixedHeight, onConfirm, withPremiumGradient, ...modalProps }) => {
    const lang = useOldLang();
    const hasButton = Boolean(confirmButtonText || onConfirm);
    return (<Modal {...modalProps} isSlim className={buildClassName(shouldAdaptToSearch && styles.withSearch, withFixedHeight && styles.fixedHeight, modalProps.className)} contentClassName={buildClassName(styles.content, modalProps.contentClassName)} headerClassName={buildClassName(styles.header, modalProps.headerClassName)}>
      {modalProps.children}
      {hasButton && (<div className={styles.buttonWrapper}>
          <Button withPremiumGradient={withPremiumGradient} onClick={onConfirm || modalProps.onClose} color="primary" size="smaller" disabled={isConfirmDisabled}>
            {confirmButtonText || lang('Confirm')}
          </Button>
        </div>)}
    </Modal>);
};
export default memo(PickerModal);
