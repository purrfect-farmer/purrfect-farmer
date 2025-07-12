import { memo } from '../../lib/teact/teact';
import { withGlobal } from '../../global';
import { getPeerTitle, isApiPeerChat } from '../../global/helpers/peers';
import { selectPeer, selectUser } from '../../global/selectors';
import buildClassName from '../../util/buildClassName';
import { getPeerColorClass } from './helpers/peerColor';
import useOldLang from '../../hooks/useOldLang';
import Avatar from './Avatar';
import FullNameTitle from './FullNameTitle';
import Icon from './icons/Icon';
import styles from './PeerChip.module.scss';
const PeerChip = ({ icon, title, isMinimized, canClose, isCloseNonDestructive, clickArg, peer, mockPeer, customPeer, className, isSavedMessages, withPeerColors, withEmojiStatus, onClick, itemClassName, }) => {
    const lang = useOldLang();
    const apiPeer = mockPeer || peer;
    const anyPeer = customPeer || apiPeer;
    const chat = apiPeer && isApiPeerChat(apiPeer) ? apiPeer : undefined;
    let iconElement;
    let titleElement;
    let titleText;
    if (icon && title) {
        iconElement = (<div className={styles.iconWrapper}>
        <Icon name={icon} style={styles.icon}/>
      </div>);
        titleElement = title;
    }
    else if (anyPeer) {
        iconElement = (<Avatar className={styles.avatar} peer={anyPeer} size="small" isSavedMessages={isSavedMessages}/>);
        titleText = getPeerTitle(lang, anyPeer) || title;
        titleElement = title || (<FullNameTitle peer={anyPeer} isSavedMessages={isSavedMessages} withEmojiStatus={withEmojiStatus}/>);
    }
    const fullClassName = buildClassName(styles.root, (chat?.isForum || customPeer?.isAvatarSquare) && styles.squareAvatar, isMinimized && styles.minimized, canClose && styles.closeable, isCloseNonDestructive && styles.nonDestructive, !onClick && styles.notClickable, withPeerColors && getPeerColorClass(customPeer || peer), className);
    return (<div className={fullClassName} onClick={() => onClick?.(clickArg)} title={isMinimized ? titleText : undefined} dir={lang.isRtl ? 'rtl' : undefined}>
      {iconElement}
      {!isMinimized && (<div className={buildClassName(styles.name, itemClassName)} dir="auto">
          {titleElement}
        </div>)}
      {canClose && (<div className={styles.remove}>
          <Icon name="close"/>
        </div>)}
    </div>);
};
export default memo(withGlobal((global, { peerId, forceShowSelf }) => {
    if (!peerId) {
        return {};
    }
    const peer = selectPeer(global, peerId);
    const user = selectUser(global, peerId);
    const isSavedMessages = !forceShowSelf && user && user.isSelf;
    return {
        peer,
        isSavedMessages,
    };
})(PeerChip));
