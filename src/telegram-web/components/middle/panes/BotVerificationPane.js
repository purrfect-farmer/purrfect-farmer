import { memo } from '../../../lib/teact/teact';
import { getActions, withGlobal } from '../../../global';
import { selectPeerFullInfo, } from '../../../global/selectors';
import useTimeout from '../../../hooks/schedulers/useTimeout';
import useLastCallback from '../../../hooks/useLastCallback';
import useHeaderPane from '../hooks/useHeaderPane';
import CustomEmoji from '../../common/CustomEmoji';
import styles from './BotVerificationPane.module.scss';
const BOT_VERIFICATION_ICON_SIZE = 16;
const DISPLAY_DURATION_MS = 5000; // 5 sec
const BotVerificationPane = ({ peerId, wasShown, botVerification, onPaneStateChange, }) => {
    const isOpen = Boolean(!wasShown && botVerification);
    const { markBotVerificationInfoShown, } = getActions();
    const { ref, shouldRender } = useHeaderPane({
        isOpen,
        onStateChange: onPaneStateChange,
    });
    const markAsShowed = useLastCallback(() => {
        markBotVerificationInfoShown({ peerId });
    });
    useTimeout(markAsShowed, !wasShown ? DISPLAY_DURATION_MS : undefined);
    if (!shouldRender || !botVerification)
        return undefined;
    return (<div ref={ref} className={styles.root}>
      <span className={styles.icon}>
        <CustomEmoji documentId={botVerification.iconId} size={BOT_VERIFICATION_ICON_SIZE}/>
      </span>
      {botVerification.description}
    </div>);
};
export default memo(withGlobal((global, { peerId }) => {
    const peerFullInfo = selectPeerFullInfo(global, peerId);
    const botVerification = peerFullInfo?.botVerification;
    const wasShown = global.settings.botVerificationShownPeerIds.includes(peerId);
    return {
        botVerification,
        wasShown,
    };
})(BotVerificationPane));
