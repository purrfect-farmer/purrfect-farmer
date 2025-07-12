import { memo } from '../../../lib/teact/teact';
import { getActions } from '../../../global';
import buildClassName from '../../../util/buildClassName';
import useLastCallback from '../../../hooks/useLastCallback';
import Avatar from '../../common/Avatar';
import PeerChip from '../../common/PeerChip';
import Button from '../../ui/Button';
import Modal from '../../ui/Modal';
import styles from './TableInfoModal.module.scss';
const TableInfoModal = ({ isOpen, title, tableData, headerAvatarPeer, header, modalHeader, footer, buttonText, className, hasBackdrop, onClose, onButtonClick, withBalanceBar, isLowStackPriority, }) => {
    const { openChat } = getActions();
    const handleOpenChat = useLastCallback((peerId) => {
        openChat({ id: peerId });
        onClose();
    });
    return (<Modal isOpen={isOpen} hasCloseButton={Boolean(title)} hasAbsoluteCloseButton={!title} absoluteCloseButtonColor={hasBackdrop ? 'translucent-white' : undefined} isSlim header={modalHeader} title={title} className={className} contentClassName={styles.content} onClose={onClose} withBalanceBar={withBalanceBar} isLowStackPriority={isLowStackPriority}>
      {headerAvatarPeer && (<Avatar peer={headerAvatarPeer} size="jumbo" className={styles.avatar}/>)}
      {header}
      <div className={styles.table}>
        {tableData?.map(([label, value]) => (<>
            {Boolean(label) && <div className={buildClassName(styles.cell, styles.title)}>{label}</div>}
            <div className={buildClassName(styles.cell, styles.value, !label && styles.fullWidth)}>
              {typeof value === 'object' && 'chatId' in value ? (<PeerChip peerId={value.chatId} className={styles.chatItem} forceShowSelf withEmojiStatus={value.withEmojiStatus} clickArg={value.chatId} onClick={handleOpenChat}/>) : value}
            </div>
          </>))}
      </div>
      {footer}
      {buttonText && (<Button className={!footer ? styles.noFooter : undefined} size="smaller" onClick={onButtonClick || onClose}>
          {buttonText}
        </Button>)}
    </Modal>);
};
export default memo(TableInfoModal);
