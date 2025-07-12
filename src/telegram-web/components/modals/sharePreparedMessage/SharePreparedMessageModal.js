import { memo, useEffect, } from '../../../lib/teact/teact';
import { getActions, getGlobal, withGlobal, } from '../../../global';
import { MAIN_THREAD_ID } from '../../../api/types';
import { getPeerTitle } from '../../../global/helpers/peers';
import { selectPeer, selectTabState, } from '../../../global/selectors';
import useFlag from '../../../hooks/useFlag';
import useLastCallback from '../../../hooks/useLastCallback';
import useOldLang from '../../../hooks/useOldLang';
import usePaidMessageConfirmation from '../../middle/composer/hooks/usePaidMessageConfirmation';
import PaymentMessageConfirmDialog from '../../common/PaymentMessageConfirmDialog';
import RecipientPicker from '../../common/RecipientPicker';
const SharePreparedMessageModal = ({ modal, isPaymentMessageConfirmDialogOpen, isStarsBalanceModalOpen, starsBalance, }) => {
    const { closeSharePreparedMessageModal, sendInlineBotResult, sendWebAppEvent, showNotification, updateSharePreparedMessageModalSendArgs, } = getActions();
    const lang = useOldLang();
    const isOpen = Boolean(modal);
    const [isShown, markIsShown, unmarkIsShown] = useFlag();
    useEffect(() => {
        if (isOpen) {
            markIsShown();
        }
    }, [isOpen, markIsShown]);
    const { message, filter, webAppKey, pendingSendArgs, } = modal || {};
    const { starsForSendMessage, } = pendingSendArgs || {};
    const { closeConfirmDialog: closeConfirmModalPayForMessage, dialogHandler: paymentMessageConfirmDialogHandler, shouldAutoApprove: shouldPaidMessageAutoApprove, setAutoApprove: setShouldPaidMessageAutoApprove, handleWithConfirmation: handleActionWithPaymentConfirmation, } = usePaidMessageConfirmation(starsForSendMessage || 0, isStarsBalanceModalOpen, starsBalance);
    const handleClose = useLastCallback(() => {
        closeSharePreparedMessageModal();
        if (webAppKey) {
            sendWebAppEvent({
                webAppKey,
                event: {
                    eventType: 'prepared_message_failed',
                    eventData: { error: 'USER_DECLINED' },
                },
            });
        }
    });
    const handleSend = useLastCallback((id, threadId) => {
        if (message && webAppKey) {
            const global = getGlobal();
            const peer = selectPeer(global, id);
            sendInlineBotResult({
                chatId: id,
                threadId: threadId || MAIN_THREAD_ID,
                id: message.result.id,
                queryId: message.result.queryId,
            });
            if (!starsForSendMessage) {
                showNotification({
                    message: lang('BotSharedToOne', getPeerTitle(lang, peer)),
                });
            }
            sendWebAppEvent({
                webAppKey,
                event: {
                    eventType: 'prepared_message_sent',
                },
            });
            closeSharePreparedMessageModal();
            updateSharePreparedMessageModalSendArgs({ args: undefined });
        }
    });
    const handleSelectRecipient = useLastCallback((id, threadId) => {
        updateSharePreparedMessageModalSendArgs({ args: { peerId: id, threadId } });
    });
    const handleSendWithPaymentConfirmation = useLastCallback(() => {
        if (pendingSendArgs) {
            handleActionWithPaymentConfirmation(handleSend, pendingSendArgs.peerId, pendingSendArgs.threadId);
        }
    });
    const handleClosePaymentMessageConfirmDialog = useLastCallback(() => {
        closeConfirmModalPayForMessage();
        updateSharePreparedMessageModalSendArgs({ args: undefined });
    });
    useEffect(() => {
        if (pendingSendArgs) {
            handleSendWithPaymentConfirmation();
        }
    }, [pendingSendArgs]);
    const global = getGlobal();
    const peer = pendingSendArgs ? selectPeer(global, pendingSendArgs.peerId) : undefined;
    const peerName = peer ? getPeerTitle(lang, peer) : undefined;
    if (!isOpen && !isShown) {
        return undefined;
    }
    return (<>
      <RecipientPicker isOpen={isOpen} searchPlaceholder={lang('Search')} filter={filter} onSelectRecipient={handleSelectRecipient} onClose={handleClose} onCloseAnimationEnd={unmarkIsShown} isLowStackPriority/>
      <PaymentMessageConfirmDialog isOpen={isPaymentMessageConfirmDialogOpen} onClose={handleClosePaymentMessageConfirmDialog} userName={peerName} messagePriceInStars={starsForSendMessage || 0} messagesCount={1} shouldAutoApprove={shouldPaidMessageAutoApprove} setAutoApprove={setShouldPaidMessageAutoApprove} confirmHandler={paymentMessageConfirmDialogHandler}/>
    </>);
};
export default memo(withGlobal((global) => {
    const tabState = selectTabState(global);
    const { isPaymentMessageConfirmDialogOpen } = tabState;
    const starsBalance = global.stars?.balance.amount || 0;
    const isStarsBalanceModalOpen = Boolean(tabState.starsBalanceModal);
    return {
        isPaymentMessageConfirmDialogOpen,
        starsBalance,
        isStarsBalanceModalOpen,
    };
})(SharePreparedMessageModal));
