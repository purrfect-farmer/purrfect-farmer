import { DEFAULT_GIFT_PROFILE_FILTER_OPTIONS } from '../../config';
import arePropsShallowEqual from '../../util/arePropsShallowEqual';
import { getCurrentTabId } from '../../util/establishMultitabRole';
import { getHasAdminRight, isChatAdmin, isChatChannel, } from '../helpers';
import { selectChat } from './chats';
import { selectTabState } from './tabs';
import { selectUser } from './users';
export function selectPaymentInputInvoice(global, ...[tabId = getCurrentTabId()]) {
    return selectTabState(global, tabId).payment.inputInvoice;
}
export function selectPaymentForm(global, ...[tabId = getCurrentTabId()]) {
    return selectTabState(global, tabId).payment.form;
}
export function selectStarsPayment(global, ...[tabId = getCurrentTabId()]) {
    return selectTabState(global, tabId).starsPayment;
}
export function selectPaymentRequestId(global, ...[tabId = getCurrentTabId()]) {
    return selectTabState(global, tabId).payment.requestId;
}
export function selectProviderPublishableKey(global, ...[tabId = getCurrentTabId()]) {
    return selectTabState(global, tabId).payment.form?.nativeParams.publishableKey;
}
export function selectProviderPublicToken(global, ...[tabId = getCurrentTabId()]) {
    return selectTabState(global, tabId).payment.form?.nativeParams.publicToken;
}
export function selectStripeCredentials(global, ...[tabId = getCurrentTabId()]) {
    return selectTabState(global, tabId).payment.stripeCredentials;
}
export function selectSmartGlocalCredentials(global, ...[tabId = getCurrentTabId()]) {
    return selectTabState(global, tabId).payment.smartGlocalCredentials;
}
export function selectCanUseGiftProfileAdminFilter(global, peerId) {
    const chat = selectChat(global, peerId);
    const isCurrentUser = global.currentUserId === peerId;
    return isCurrentUser || (chat && isChatChannel(chat) && isChatAdmin(chat) && getHasAdminRight(chat, 'postMessages'));
}
export function selectCanUseGiftProfileFilter(global, peerId) {
    const chat = selectChat(global, peerId);
    const user = selectUser(global, peerId);
    return Boolean(user) || (chat && isChatChannel(chat));
}
export function selectGiftProfileFilter(global, peerId, ...[tabId = getCurrentTabId()]) {
    return selectCanUseGiftProfileFilter(global, peerId) ? selectTabState(global, tabId).savedGifts.filter : undefined;
}
export function selectIsGiftProfileFilterDefault(global, ...[tabId = getCurrentTabId()]) {
    return arePropsShallowEqual(selectTabState(global, tabId).savedGifts.filter, DEFAULT_GIFT_PROFILE_FILTER_OPTIONS);
}
