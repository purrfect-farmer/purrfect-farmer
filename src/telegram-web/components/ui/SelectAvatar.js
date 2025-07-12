import { memo, useCallback, useState } from '../../lib/teact/teact';
import { openSystemFilesDialog } from '../../util/systemFilesDialog';
import CropModal from './CropModal';
import styles from './SelectAvatar.module.scss';
const SelectAvatar = ({ onChange, inputRef, }) => {
    const [selectedFile, setSelectedFile] = useState();
    const handleAvatarCrop = useCallback((croppedImg) => {
        setSelectedFile(undefined);
        onChange(croppedImg);
    }, [onChange]);
    const handleModalClose = useCallback(() => {
        setSelectedFile(undefined);
    }, []);
    const handleClick = useCallback(() => {
        openSystemFilesDialog('image/png, image/jpeg', (event) => {
            const target = event.target;
            if (!target?.files?.[0]) {
                return;
            }
            setSelectedFile(target.files[0]);
        }, true);
    }, []);
    return (<>
      <input ref={inputRef} className={styles.input} onClick={handleClick}/>
      <CropModal file={selectedFile} onClose={handleModalClose} onChange={handleAvatarCrop}/>
    </>);
};
export default memo(SelectAvatar);
