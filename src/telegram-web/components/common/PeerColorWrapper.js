import { memo } from '../../lib/teact/teact';
import buildClassName from '../../util/buildClassName';
import { getApiPeerColorClass, getPeerColorClass } from './helpers/peerColor';
import EmojiIconBackground from './embedded/EmojiIconBackground';
import styles from './PeerColorWrapper.module.scss';
function PeerColorWrapper({ peer, ref, peerColor, noUserColors, shouldReset, className, emojiIconClassName, children, ...otherProps }) {
    const color = peerColor || peer?.color;
    return (<div ref={ref} className={buildClassName(styles.root, peer && getPeerColorClass(peer, noUserColors, shouldReset), peerColor && getApiPeerColorClass(peerColor), className)} {...otherProps}>
      {color?.backgroundEmojiId && (<EmojiIconBackground className={emojiIconClassName} emojiDocumentId={color.backgroundEmojiId}/>)}
      {children}
    </div>);
}
export default memo(PeerColorWrapper);
