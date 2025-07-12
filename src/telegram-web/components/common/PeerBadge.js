import { memo } from '../../lib/teact/teact';
import buildClassName from '../../util/buildClassName';
import useLang from '../../hooks/useLang';
import Avatar from './Avatar';
import Icon from './icons/Icon';
import styles from './PeerBadge.module.scss';
const PeerBadge = ({ peer: avatarPeer, avatarWebPhoto, avatarSize, text, badgeText, badgeIcon, className, badgeClassName, badgeIconClassName, textClassName, onClick, }) => {
    const lang = useLang();
    return (<div className={buildClassName(styles.root, onClick && styles.clickable, className)} onClick={onClick}>
      <div className={styles.top}>
        <Avatar size={avatarSize} peer={avatarPeer} webPhoto={avatarWebPhoto}/>
        {badgeText && (<div className={buildClassName(styles.badge, badgeClassName)} dir={lang.isRtl ? 'rtl' : 'ltr'}>
            {badgeIcon && <Icon name={badgeIcon} className={badgeIconClassName}/>}
            {badgeText}
          </div>)}
      </div>
      {text && <p className={buildClassName(styles.text, textClassName)}>{text}</p>}
    </div>);
};
export default memo(PeerBadge);
