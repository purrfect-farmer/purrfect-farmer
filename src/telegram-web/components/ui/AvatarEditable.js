import { memo, useCallback, useEffect, useState, } from '../../lib/teact/teact';
import buildClassName from '../../util/buildClassName';
import Icon from '../common/icons/Icon';
import CropModal from './CropModal';
import './AvatarEditable.scss';
const AvatarEditable = ({ title = 'Change your profile picture', disabled, isForForum, currentAvatarBlobUrl, onChange, }) => {
    const [selectedFile, setSelectedFile] = useState();
    const [croppedBlobUrl, setCroppedBlobUrl] = useState(currentAvatarBlobUrl);
    useEffect(() => {
        setCroppedBlobUrl(currentAvatarBlobUrl);
    }, [currentAvatarBlobUrl]);
    function handleSelectFile(event) {
        const target = event.target;
        if (!target?.files?.[0]) {
            return;
        }
        setSelectedFile(target.files[0]);
        target.value = '';
    }
    const handleAvatarCrop = useCallback((croppedImg) => {
        setSelectedFile(undefined);
        onChange(croppedImg);
        if (croppedBlobUrl && croppedBlobUrl !== currentAvatarBlobUrl) {
            URL.revokeObjectURL(croppedBlobUrl);
        }
        setCroppedBlobUrl(URL.createObjectURL(croppedImg));
    }, [croppedBlobUrl, currentAvatarBlobUrl, onChange]);
    const handleModalClose = useCallback(() => {
        setSelectedFile(undefined);
    }, []);
    const labelClassName = buildClassName(croppedBlobUrl && 'filled', disabled && 'disabled', isForForum && 'rounded-square');
    return (<div className="AvatarEditable">
      <label className={labelClassName} role="button" tabIndex={0} title={title}>
        <input type="file" onChange={handleSelectFile} accept="image/png, image/jpeg"/>
        <Icon name="camera-add"/>
        {croppedBlobUrl && <img src={croppedBlobUrl} draggable={false} alt="Avatar"/>}
      </label>
      <CropModal file={selectedFile} onClose={handleModalClose} onChange={handleAvatarCrop}/>
    </div>);
};
export default memo(AvatarEditable);
