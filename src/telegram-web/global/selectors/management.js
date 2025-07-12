import { isUserId } from '../../util/entities/ids';
import { getCurrentTabId } from '../../util/establishMultitabRole';
import { getCanAddContact, isAnonymousForwardsChat, isChatAdmin, isChatGroup, isUserBot, } from '../helpers';
import { selectChat, selectIsChatWithSelf } from './chats';
import { selectCurrentMessageList } from './messages';
import { selectTabState } from './tabs';
import { selectBot, selectUser } from './users';
export function selectManagement(global, chatId, ...[tabId = getCurrentTabId()]) {
    return selectTabState(global, tabId).management.byChatId[chatId];
}
export function selectCurrentManagement(global, ...[tabId = getCurrentTabId()]) {
    const { chatId, threadId } = selectCurrentMessageList(global, tabId) || {};
    if (!chatId || !threadId) {
        return undefined;
    }
    const currentManagement = selectTabState(global, tabId).management.byChatId[chatId];
    if (!currentManagement?.isActive) {
        return undefined;
    }
    return currentManagement;
}
export function selectCurrentManagementType(global, ...[tabId = getCurrentTabId()]) {
    const { chatId, threadId } = selectCurrentMessageList(global, tabId) || {};
    if (!chatId || !threadId) {
        return undefined;
    }
    const chatBot = selectBot(global, chatId);
    if (chatBot) {
        return 'bot';
    }
    if (isUserId(chatId)) {
        return 'user';
    }
    const chat = selectChat(global, chatId);
    if (!chat) {
        return undefined;
    }
    if (isChatGroup(chat)) {
        return 'group';
    }
    return 'channel';
}
export function selectCanManage(global, chatId) {
    const chat = selectChat(global, chatId);
    if (!chat || chat.isRestricted || chat.isMonoforum)
        return false;
    const isPrivate = isUserId(chat.id);
    const user = isPrivate ? selectUser(global, chatId) : undefined;
    const canAddContact = user && getCanAddContact(user);
    const isBot = user && isUserBot(user);
    return Boolean(!canAddContact
        && chat
        && !selectIsChatWithSelf(global, chat.id)
        && !isAnonymousForwardsChat(chat.id)
        // chat.isCreator is for Basic Groups
        && (isUserId(chat.id) || ((isChatAdmin(chat) || chat.isCreator) && !chat.isNotJoined))
        && !isBot);
}
