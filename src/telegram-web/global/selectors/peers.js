import { SERVICE_NOTIFICATIONS_USER_ID } from '../../config';
import { isUserId } from '../../util/entities/ids';
import { getCurrentTabId } from '../../util/establishMultitabRole';
import { isChatAdmin, isDeletedUser } from '../helpers';
import { selectChat, selectChatFullInfo } from './chats';
import { selectTabState } from './tabs';
import { selectBot, selectUser, selectUserFullInfo } from './users';
export function selectPeer(global, peerId) {
    return selectUser(global, peerId) || selectChat(global, peerId);
}
export function selectPeerPhotos(global, peerId) {
    return global.peers.profilePhotosById[peerId];
}
export function selectCanGift(global, peerId) {
    const bot = selectBot(global, peerId);
    const user = selectUser(global, peerId);
    if (user) {
        return !bot && peerId !== SERVICE_NOTIFICATIONS_USER_ID && !isDeletedUser(user);
    }
    return selectChatFullInfo(global, peerId)?.areStarGiftsAvailable;
}
export function selectPeerSavedGifts(global, peerId, ...[tabId = getCurrentTabId()]) {
    return selectTabState(global, tabId).savedGifts.giftsByPeerId[peerId];
}
export function selectPeerPaidMessagesStars(global, peerId) {
    const isChatWithUser = isUserId(peerId);
    if (isChatWithUser) {
        const userFullInfo = isChatWithUser ? selectUserFullInfo(global, peerId) : undefined;
        return userFullInfo?.paidMessagesStars;
    }
    const chat = selectChat(global, peerId);
    if (!chat)
        return undefined;
    if (isChatAdmin(chat))
        return undefined;
    return chat.paidMessagesStars;
}
