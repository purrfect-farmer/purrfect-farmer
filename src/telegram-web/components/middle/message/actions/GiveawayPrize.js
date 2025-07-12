import { memo, useMemo, useRef } from '../../../../lib/teact/teact';
import { withGlobal } from '../../../../global';
import { getPeerTitle } from '../../../../global/helpers/peers';
import { selectCanPlayAnimatedEmojis, selectChat, selectGiftStickerForDuration, selectGiftStickerForStars, } from '../../../../global/selectors';
import { renderPeerLink, translateWithYou } from '../helpers/messageActions';
import useLang from '../../../../hooks/useLang';
import Sparkles from '../../../common/Sparkles';
import StickerView from '../../../common/StickerView';
import styles from '../ActionMessage.module.scss';
const STICKER_SIZE = 150;
const GiveawayPrizeAction = ({ currentUserId, action, sender, sticker, canPlayAnimatedEmojis, channel, onClick, observeIntersectionForLoading, observeIntersectionForPlaying, }) => {
    const stickerRef = useRef();
    const lang = useLang();
    const channelLink = useMemo(() => {
        const channelTitle = channel && getPeerTitle(lang, channel);
        const channelFallbackText = lang('ActionFallbackChannel');
        return renderPeerLink(channel?.id, channelTitle || channelFallbackText);
    }, [channel, lang]);
    const peerLink = useMemo(() => {
        const peer = channel || sender;
        const peerTitle = peer && getPeerTitle(lang, peer);
        const peerFallbackText = lang('ActionFallbackChat');
        return renderPeerLink(peer?.id, peerTitle || peerFallbackText);
    }, [channel, sender, lang]);
    return (<div className={styles.contentBox} tabIndex={0} role="button" onClick={onClick}>
      <div ref={stickerRef} className={styles.stickerWrapper} style={`width: ${STICKER_SIZE}px; height: ${STICKER_SIZE}px`}>
        {sticker && (<StickerView containerRef={stickerRef} sticker={sticker} size={STICKER_SIZE} observeIntersectionForLoading={observeIntersectionForLoading} observeIntersectionForPlaying={observeIntersectionForPlaying} noLoad={!canPlayAnimatedEmojis}/>)}
      </div>
      <div>
        <h3 className={styles.title}>
          {lang(action.type !== 'giftCode' || action.isViaGiveaway
            ? 'ActionGiveawayResultTitle' : 'GiftInfoTitle')}
        </h3>
        <div>
          {action.type === 'giftCode' && (action.isViaGiveaway ? lang('ActionGiveawayResultPremiumText', { channel: channelLink, months: action.months }, {
            withNodes: true,
            withMarkdown: true,
            pluralValue: action.months,
            renderTextFilters: ['br'],
        })
            : translateWithYou(lang, 'ActionGiftCodeSubscriptionText', sender?.id === currentUserId, { peer: peerLink, months: action.months }, {
                pluralValue: action.months,
                renderTextFilters: ['br'],
            }))}
          {action.type === 'prizeStars' && (lang('ActionGiveawayResultStarsText', { amount: action.stars, channel: channelLink }, {
            withNodes: true,
            withMarkdown: true,
            pluralValue: action.stars,
            renderTextFilters: ['br'],
        }))}
        </div>
      </div>
      <div className={styles.actionButton}>
        <Sparkles preset="button"/>
        {lang(action.type === 'giftCode' ? 'ActionOpenGiftButton' : 'ActionViewButton')}
      </div>
    </div>);
};
export default memo(withGlobal((global, { action }) => {
    const currentUserId = global.currentUserId;
    const sticker = action.type === 'giftCode'
        ? selectGiftStickerForDuration(global, action.months)
        : selectGiftStickerForStars(global, action.stars);
    const canPlayAnimatedEmojis = selectCanPlayAnimatedEmojis(global);
    const channel = action.boostPeerId ? selectChat(global, action.boostPeerId) : undefined;
    return {
        currentUserId,
        sticker,
        canPlayAnimatedEmojis,
        channel,
    };
})(GiveawayPrizeAction));
