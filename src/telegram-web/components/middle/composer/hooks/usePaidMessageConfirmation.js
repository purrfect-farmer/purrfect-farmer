import { useEffect, useRef, useState } from '../../../../lib/teact/teact';
import { getActions, getGlobal } from '../../../../global';
import { PAID_MESSAGES_PURPOSE } from '../../../../config';
import useLastCallback from '../../../../hooks/useLastCallback';
export default function usePaidMessageConfirmation(starsForAllMessages, isStarsBalanceModeOpen, starsBalance) {
    const { shouldPaidMessageAutoApprove, } = getGlobal().settings.byKey;
    const [shouldAutoApprove, setAutoApprove] = useState(Boolean(shouldPaidMessageAutoApprove));
    const [isWaitingStarsTopup, setIsWaitingStarsTopup] = useState(false);
    const confirmPaymentHandlerRef = useRef(undefined);
    const closeConfirmDialog = useLastCallback(() => {
        getActions().closePaymentMessageConfirmDialogOpen();
    });
    useEffect(() => {
        if (isWaitingStarsTopup && !isStarsBalanceModeOpen) {
            setIsWaitingStarsTopup(false);
            if (starsBalance > starsForAllMessages) {
                confirmPaymentHandlerRef?.current?.();
            }
        }
    }, [isWaitingStarsTopup, isStarsBalanceModeOpen, starsBalance, starsForAllMessages]);
    const handleStarsTopup = useLastCallback(() => {
        getActions().openStarsBalanceModal({
            topup: {
                balanceNeeded: starsForAllMessages,
                purpose: PAID_MESSAGES_PURPOSE,
            },
        });
        setIsWaitingStarsTopup(true);
    });
    const dialogHandler = useLastCallback(() => {
        if (starsForAllMessages > starsBalance) {
            handleStarsTopup();
        }
        else {
            confirmPaymentHandlerRef?.current?.();
        }
        getActions().closePaymentMessageConfirmDialogOpen();
        if (shouldAutoApprove)
            getActions().setPaidMessageAutoApprove();
    });
    const handleWithConfirmation = (handler, ...args) => {
        if (starsForAllMessages) {
            confirmPaymentHandlerRef.current = () => handler(...args);
            if (!shouldPaidMessageAutoApprove) {
                getActions().openPaymentMessageConfirmDialogOpen();
                return;
            }
            if (starsForAllMessages > starsBalance) {
                handleStarsTopup();
                return;
            }
        }
        handler(...args);
    };
    return {
        closeConfirmDialog,
        handleWithConfirmation,
        dialogHandler,
        shouldAutoApprove,
        setAutoApprove,
    };
}
