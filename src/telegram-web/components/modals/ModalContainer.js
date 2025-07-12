import { memo } from '../../lib/teact/teact';
import { withGlobal } from '../../global';
import { selectTabState } from '../../global/selectors';
import { pick } from '../../util/iteratees';
import VerificationMonetizationModal from '../common/VerificationMonetizationModal.async';
import WebAppsCloseConfirmationModal from '../main/WebAppsCloseConfirmationModal.async';
import AboutAdsModal from './aboutAds/AboutAdsModal.async';
import AttachBotInstallModal from './attachBotInstall/AttachBotInstallModal.async';
import BoostModal from './boost/BoostModal.async';
import ChatInviteModal from './chatInvite/ChatInviteModal.async';
import ChatlistModal from './chatlist/ChatlistModal.async';
import CollectibleInfoModal from './collectible/CollectibleInfoModal.async';
import DeleteAccountModal from './deleteAccount/DeleteAccountModal.async';
import EmojiStatusAccessModal from './emojiStatusAccess/EmojiStatusAccessModal.async';
import FrozenAccountModal from './frozenAccount/FrozenAccountModal.async';
import PremiumGiftModal from './gift/GiftModal.async';
import GiftInfoModal from './gift/info/GiftInfoModal.async';
import GiftRecipientPicker from './gift/recipient/GiftRecipientPicker.async';
import GiftResalePriceComposerModal from './gift/resale/GiftResalePriceComposerModal.async';
import GiftStatusInfoModal from './gift/status/GiftStatusInfoModal.async';
import GiftTransferModal from './gift/transfer/GiftTransferModal.async';
import GiftUpgradeModal from './gift/upgrade/GiftUpgradeModal.async';
import GiftWithdrawModal from './gift/withdraw/GiftWithdrawModal.async';
import GiftCodeModal from './giftcode/GiftCodeModal.async';
import InviteViaLinkModal from './inviteViaLink/InviteViaLinkModal.async';
import LocationAccessModal from './locationAccess/LocationAccessModal.async';
import MapModal from './map/MapModal.async';
import OneTimeMediaModal from './oneTimeMedia/OneTimeMediaModal.async';
import PaidReactionModal from './paidReaction/PaidReactionModal.async';
import PreparedMessageModal from './preparedMessage/PreparedMessageModal.async';
import ReportAdModal from './reportAd/ReportAdModal.async';
import ReportModal from './reportModal/ReportModal.async';
import SharePreparedMessageModal from './sharePreparedMessage/SharePreparedMessageModal.async';
import ChatRefundModal from './stars/chatRefund/ChatRefundModal.async';
import StarsGiftModal from './stars/gift/StarsGiftModal.async';
import StarsBalanceModal from './stars/StarsBalanceModal.async';
import StarsPaymentModal from './stars/StarsPaymentModal.async';
import StarsSubscriptionModal from './stars/subscription/StarsSubscriptionModal.async';
import StarsTransactionInfoModal from './stars/transaction/StarsTransactionModal.async';
import SuggestedStatusModal from './suggestedStatus/SuggestedStatusModal.async';
import UrlAuthModal from './urlAuth/UrlAuthModal.async';
import WebAppModal from './webApp/WebAppModal.async';
const MODALS = {
    giftCodeModal: GiftCodeModal,
    boostModal: BoostModal,
    chatlistModal: ChatlistModal,
    urlAuth: UrlAuthModal,
    oneTimeMediaModal: OneTimeMediaModal,
    inviteViaLinkModal: InviteViaLinkModal,
    requestedAttachBotInstall: AttachBotInstallModal,
    reportAdModal: ReportAdModal,
    reportModal: ReportModal,
    webApps: WebAppModal,
    collectibleInfoModal: CollectibleInfoModal,
    mapModal: MapModal,
    starsPayment: StarsPaymentModal,
    starsBalanceModal: StarsBalanceModal,
    starsTransactionModal: StarsTransactionInfoModal,
    chatInviteModal: ChatInviteModal,
    paidReactionModal: PaidReactionModal,
    starsSubscriptionModal: StarsSubscriptionModal,
    starsGiftModal: StarsGiftModal,
    giftModal: PremiumGiftModal,
    isGiftRecipientPickerOpen: GiftRecipientPicker,
    isWebAppsCloseConfirmationModalOpen: WebAppsCloseConfirmationModal,
    giftInfoModal: GiftInfoModal,
    giftResalePriceComposerModal: GiftResalePriceComposerModal,
    suggestedStatusModal: SuggestedStatusModal,
    emojiStatusAccessModal: EmojiStatusAccessModal,
    locationAccessModal: LocationAccessModal,
    aboutAdsModal: AboutAdsModal,
    giftUpgradeModal: GiftUpgradeModal,
    monetizationVerificationModal: VerificationMonetizationModal,
    giftWithdrawModal: GiftWithdrawModal,
    giftStatusInfoModal: GiftStatusInfoModal,
    preparedMessageModal: PreparedMessageModal,
    sharePreparedMessageModal: SharePreparedMessageModal,
    giftTransferModal: GiftTransferModal,
    chatRefundModal: ChatRefundModal,
    isFrozenAccountModalOpen: FrozenAccountModal,
    deleteAccountModal: DeleteAccountModal,
};
const MODAL_KEYS = Object.keys(MODALS);
const MODAL_ENTRIES = Object.entries(MODALS);
const ModalContainer = (modalProps) => {
    return MODAL_ENTRIES.map(([key, ModalComponent]) => (
    // @ts-ignore -- TS does not preserve tuple types in `map` callbacks
    <ModalComponent key={key} modal={modalProps[key]}/>));
};
export default memo(withGlobal((global) => (pick(selectTabState(global), MODAL_KEYS)))(ModalContainer));
