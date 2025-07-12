import { memo, useCallback, useRef } from '../../lib/teact/teact';
import buildClassName from '../../util/buildClassName';
import useKeyboardListNavigation from '../../hooks/useKeyboardListNavigation';
import useOldLang from '../../hooks/useOldLang';
import Button from './Button';
import Modal from './Modal';
const ConfirmDialog = ({ isOpen, title, noDefaultTitle, header, text, textParts, confirmLabel = 'Confirm', confirmIsDestructive, isConfirmDisabled, isOnlyConfirm, areButtonsInColumn, className, children, confirmHandler, onClose, onCloseAnimationEnd, }) => {
    const lang = useOldLang();
    const containerRef = useRef();
    const handleSelectWithEnter = useCallback((index) => {
        if (index === -1)
            confirmHandler();
    }, [confirmHandler]);
    const handleKeyDown = useKeyboardListNavigation(containerRef, isOpen, handleSelectWithEnter, '.Button');
    return (<Modal className={buildClassName('confirm', className)} title={(title || (!noDefaultTitle ? lang('Telegram') : undefined))} header={header} isOpen={isOpen} onClose={onClose} onCloseAnimationEnd={onCloseAnimationEnd}>
      {text && text.split('\\n').map((textPart) => (<p>{textPart}</p>))}
      {textParts || children}
      <div className={areButtonsInColumn ? 'dialog-buttons-column' : 'dialog-buttons mt-2'} ref={containerRef} onKeyDown={handleKeyDown}>
        <Button className="confirm-dialog-button" isText onClick={confirmHandler} color={confirmIsDestructive ? 'danger' : 'primary'} disabled={isConfirmDisabled}>
          {confirmLabel}
        </Button>
        {!isOnlyConfirm && <Button className="confirm-dialog-button" isText onClick={onClose}>{lang('Cancel')}</Button>}
      </div>
    </Modal>);
};
export default memo(ConfirmDialog);
