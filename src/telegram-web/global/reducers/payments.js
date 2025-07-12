import { getCurrentTabId } from '../../util/establishMultitabRole';
import { selectStarsPayment, selectTabState } from '../selectors';
import { updateTabState } from './tabs';
export function updatePayment(global, update, ...[tabId = getCurrentTabId()]) {
    return updateTabState(global, {
        payment: {
            ...selectTabState(global, tabId).payment,
            ...update,
        },
    }, tabId);
}
export function updateStarsPayment(global, update, ...[tabId = getCurrentTabId()]) {
    const starPayment = selectStarsPayment(global, tabId);
    if (!starPayment) {
        return global;
    }
    return updateTabState(global, {
        starsPayment: {
            ...starPayment,
            ...update,
        },
    }, tabId);
}
export function updateShippingOptions(global, shippingOptions, ...[tabId = getCurrentTabId()]) {
    return updatePayment(global, { shippingOptions }, tabId);
}
export function setRequestInfoId(global, id, ...[tabId = getCurrentTabId()]) {
    return updatePayment(global, { requestId: id }, tabId);
}
export function setPaymentStep(global, step, ...[tabId = getCurrentTabId()]) {
    return updatePayment(global, { step }, tabId);
}
export function setStripeCardInfo(global, cardInfo, ...[tabId = getCurrentTabId()]) {
    return updatePayment(global, { stripeCredentials: { ...cardInfo } }, tabId);
}
export function setSmartGlocalCardInfo(global, cardInfo, ...[tabId = getCurrentTabId()]) {
    return updatePayment(global, { smartGlocalCredentials: { ...cardInfo } }, tabId);
}
export function setConfirmPaymentUrl(global, url, ...[tabId = getCurrentTabId()]) {
    return updatePayment(global, { confirmPaymentUrl: url }, tabId);
}
export function setReceipt(global, receipt, ...[tabId = getCurrentTabId()]) {
    if (!receipt) {
        return updatePayment(global, { receipt: undefined }, tabId);
    }
    return updatePayment(global, {
        receipt,
    }, tabId);
}
export function clearPayment(global, ...[tabId = getCurrentTabId()]) {
    return updateTabState(global, {
        payment: {},
    }, tabId);
}
export function clearStarPayment(global, ...[tabId = getCurrentTabId()]) {
    return updateTabState(global, {
        starsPayment: {},
    }, tabId);
}
export function closeInvoice(global, ...[tabId = getCurrentTabId()]) {
    global = updatePayment(global, {
        isPaymentModalOpen: undefined,
        isExtendedMedia: undefined,
    }, tabId);
    return global;
}
export function updateStarsBalance(global, balance) {
    return {
        ...global,
        stars: {
            ...global.stars,
            balance,
        },
    };
}
export function appendStarsTransactions(global, type, transactions, nextOffset) {
    const history = global.stars?.history;
    if (!history) {
        return global;
    }
    const newTypeObject = {
        transactions: (history[type]?.transactions || []).concat(transactions),
        nextOffset,
    };
    return {
        ...global,
        stars: {
            ...global.stars,
            history: {
                ...history,
                [type]: newTypeObject,
            },
        },
    };
}
export function appendStarsSubscriptions(global, subscriptions, nextOffset) {
    if (!global.stars) {
        return global;
    }
    const newObject = {
        list: (global.stars.subscriptions?.list || []).concat(subscriptions),
        nextOffset,
    };
    return {
        ...global,
        stars: {
            ...global.stars,
            subscriptions: newObject,
        },
    };
}
export function updateStarsSubscriptionLoading(global, isLoading) {
    const subscriptions = global.stars?.subscriptions;
    if (!subscriptions) {
        return global;
    }
    return {
        ...global,
        stars: {
            ...global.stars,
            subscriptions: {
                ...subscriptions,
                isLoading,
            },
        },
    };
}
export function openStarsTransactionModal(global, transaction, ...[tabId = getCurrentTabId()]) {
    return updateTabState(global, {
        starsTransactionModal: {
            transaction,
        },
    }, tabId);
}
export function openStarsTransactionFromReceipt(global, receipt, ...[tabId = getCurrentTabId()]) {
    const transaction = {
        id: receipt.transactionId,
        peer: {
            type: 'peer',
            id: receipt.botId,
        },
        stars: {
            amount: receipt.totalAmount,
            nanos: 0,
        },
        date: receipt.date,
        title: receipt.title,
        description: receipt.description,
        photo: receipt.photo,
    };
    return openStarsTransactionModal(global, transaction, tabId);
}
