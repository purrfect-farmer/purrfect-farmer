import { memo, useRef } from '../../lib/teact/teact';
import buildClassName from '../../util/buildClassName';
import { formatIntegerCompact } from '../../util/textFormat';
import useContextMenuHandlers from '../../hooks/useContextMenuHandlers';
import useLang from '../../hooks/useLang';
import useOldLang from '../../hooks/useOldLang';
import Icon from '../common/icons/Icon';
import Button from '../ui/Button';
import Menu from '../ui/Menu';
import MenuItem from '../ui/MenuItem';
import styles from './ScrollDownButton.module.scss';
const ScrollDownButton = ({ icon, ariaLabelLang, unreadCount, onClick, onReadAll, className, }) => {
    const oldLang = useOldLang();
    const lang = useLang();
    const ref = useRef();
    const { isContextMenuOpen, handleContextMenu, handleContextMenuClose, handleContextMenuHide, } = useContextMenuHandlers(ref, !onReadAll);
    return (<div className={buildClassName(styles.root, className)} ref={ref}>
      <Button color="secondary" round className={styles.button} onClick={onClick} onContextMenu={handleContextMenu} ariaLabel={oldLang(ariaLabelLang)}>
        <Icon name={icon} className={styles.icon}/>
      </Button>
      {Boolean(unreadCount) && <div className={styles.unreadCount}>{formatIntegerCompact(lang, unreadCount)}</div>}
      {onReadAll && (<Menu isOpen={isContextMenuOpen} onClose={handleContextMenuClose} onCloseAnimationEnd={handleContextMenuHide} autoClose positionX="right" positionY="bottom">
          <MenuItem icon="readchats" onClick={onReadAll}>{oldLang('MarkAllAsRead')}</MenuItem>
        </Menu>)}
    </div>);
};
export default memo(ScrollDownButton);
