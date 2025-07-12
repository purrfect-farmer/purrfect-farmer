import { memo } from '../../../../lib/teact/teact';
import { REM } from '../../../common/helpers/mediaDimensions';
import Avatar from '../../../common/Avatar';
import styles from '../ActionMessage.module.scss';
const AVATAR_SIZE = 15 * REM;
const ChannelPhotoAction = ({ action, onClick, observeIntersection, }) => {
    return (<Avatar className={styles.channelPhoto} photo={action.photo} loopIndefinitely withVideo observeIntersection={observeIntersection} onClick={onClick} size={AVATAR_SIZE}/>);
};
export default memo(ChannelPhotoAction);
