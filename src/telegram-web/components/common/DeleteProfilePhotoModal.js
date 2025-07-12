import { memo, useCallback } from '../../lib/teact/teact';
import { getActions } from '../../global';
import { isUserId } from '../../util/entities/ids';
import useOldLang from '../../hooks/useOldLang';
import Button from '../ui/Button';
import Modal from '../ui/Modal';
const DeleteProfilePhotoModal = ({ isOpen, photo, profileId, onClose, onConfirm, }) => {
    const { deleteProfilePhoto, deleteChatPhoto, } = getActions();
    const handleDeletePhoto = useCallback(() => {
        onConfirm?.();
        if (isUserId(profileId)) {
            deleteProfilePhoto({ photo });
        }
        else {
            deleteChatPhoto({
                photo,
                chatId: profileId,
            });
        }
        onClose();
    }, [onConfirm, profileId, onClose, deleteProfilePhoto, photo, deleteChatPhoto]);
    const lang = useOldLang();
    return (<Modal isOpen={isOpen} onClose={onClose} onEnter={handleDeletePhoto} className="delete dialog-buttons-column" title={lang('AreYouSure')}>
      <div className="dialog-buttons mt-2">
        <Button color="danger" className="confirm-dialog-button" isText onClick={handleDeletePhoto}>
          {lang('Preview.DeletePhoto')}
        </Button>
        <Button className="confirm-dialog-button" isText onClick={onClose}>{lang('Cancel')}</Button>
      </div>
    </Modal>);
};
export default memo(DeleteProfilePhotoModal);
