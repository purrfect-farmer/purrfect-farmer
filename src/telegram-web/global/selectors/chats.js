import { ALL_FOLDER_ID, ARCHIVED_FOLDER_ID, MEMBERS_LOAD_SLICE, SAVED_FOLDER_ID, SERVICE_NOTIFICATIONS_USER_ID, } from '../../config';
import { IS_TRANSLATION_SUPPORTED } from '../../util/browser/windowEnvironment';
import { isUserId } from '../../util/entities/ids';
import { getCurrentTabId } from '../../util/establishMultitabRole';
import { getHasAdminRight, getPrivateChatUserId, isChatChannel, isChatPublic, isChatSuperGroup, isHistoryClearMessage, isUserBot, isUserOnline, } from '../helpers';
import { selectTabState } from './tabs';
import { selectBot, selectIsCurrentUserPremium, selectUser, selectUserFullInfo, } from './users';
export function selectChat(global, chatId) {
    return global.chats.byId[chatId];
}
export function selectChatFullInfo(global, chatId) {
    return global.chats.fullInfoById[chatId];
}
export function selectPeerFullInfo(global, peerId) {
    if (isUserId(peerId))
        return selectUserFullInfo(global, peerId);
    return selectChatFullInfo(global, peerId);
}
export function selectChatListLoadingParameters(global, listType) {
    return global.chats.loadingParameters[listType];
}
export function selectChatUser(global, chat) {
    const userId = getPrivateChatUserId(chat);
    if (!userId) {
        return false;
    }
    return selectUser(global, userId);
}
export function selectIsChatWithSelf(global, chatId) {
    return chatId === global.currentUserId;
}
export function selectIsChatWithBot(global, chat) {
    const user = selectChatUser(global, chat);
    return user && isUserBot(user);
}
export function selectSupportChat(global) {
    return Object.values(global.chats.byId).find(({ isSupport }) => isSupport);
}
export function selectChatOnlineCount(global, chat) {
    const fullInfo = selectChatFullInfo(global, chat.id);
    if (isUserId(chat.id) || isChatChannel(chat) || !fullInfo) {
        return undefined;
    }
    if (!fullInfo.members || fullInfo.members.length === MEMBERS_LOAD_SLICE) {
        return fullInfo.onlineCount;
    }
    return fullInfo.members.reduce((onlineCount, { userId }) => {
        if (!selectIsChatWithSelf(global, userId)
            && global.users.byId[userId]
            && isUserOnline(global.users.byId[userId], global.users.statusesById[userId])) {
            return onlineCount + 1;
        }
        return onlineCount;
    }, 0);
}
export function selectIsTrustedBot(global, botId) {
    return global.trustedBotIds.includes(botId);
}
export function selectChatType(global, chatId) {
    const bot = selectBot(global, chatId);
    if (bot) {
        return 'bots';
    }
    const user = selectUser(global, chatId);
    if (user) {
        return 'users';
    }
    const chat = selectChat(global, chatId);
    if (!chat)
        return undefined;
    if (isChatChannel(chat)) {
        return 'channels';
    }
    return 'chats';
}
export function selectIsChatBotNotStarted(global, chatId) {
    const bot = selectBot(global, chatId);
    if (!bot) {
        return false;
    }
    const lastMessage = selectChatLastMessage(global, chatId);
    if (lastMessage && isHistoryClearMessage(lastMessage)) {
        return true;
    }
    return Boolean(!lastMessage);
}
export function selectAreActiveChatsLoaded(global) {
    return Boolean(global.chats.listIds.active);
}
export function selectIsChatListed(global, chatId, type) {
    const { listIds } = global.chats;
    if (type) {
        const targetList = listIds[type];
        return Boolean(targetList && targetList.includes(chatId));
    }
    return Object.values(listIds).some((list) => list && list.includes(chatId));
}
export function selectChatListType(global, chatId) {
    const chat = selectChat(global, chatId);
    if (!chat || !selectIsChatListed(global, chatId)) {
        return undefined;
    }
    return chat.folderId === ARCHIVED_FOLDER_ID ? 'archived' : 'active';
}
export function selectChatFolder(global, folderId) {
    return global.chatFolders.byId[folderId];
}
export function selectTotalChatCount(global, listType) {
    const { totalCount } = global.chats;
    const allChatsCount = totalCount.all;
    const archivedChatsCount = totalCount.archived || 0;
    if (listType === 'archived') {
        return archivedChatsCount;
    }
    return allChatsCount ? allChatsCount - archivedChatsCount : 0;
}
export function selectIsChatPinned(global, chatId, folderId = ALL_FOLDER_ID) {
    const { active, archived, saved } = global.chats.orderedPinnedIds;
    if (folderId === ALL_FOLDER_ID) {
        return Boolean(active?.includes(chatId));
    }
    if (folderId === ARCHIVED_FOLDER_ID) {
        return Boolean(archived?.includes(chatId));
    }
    if (folderId === SAVED_FOLDER_ID) {
        return Boolean(saved?.includes(chatId));
    }
    const { byId: chatFoldersById } = global.chatFolders;
    const { pinnedChatIds } = chatFoldersById[folderId] || {};
    return Boolean(pinnedChatIds?.includes(chatId));
}
// Slow, not to be used in `withGlobal`
export function selectChatByUsername(global, username) {
    const usernameLowered = username.toLowerCase();
    return Object.values(global.chats.byId).find((chat) => chat.usernames?.some((c) => c.username.toLowerCase() === usernameLowered));
}
export function selectIsServiceChatReady(global) {
    return Boolean(selectChat(global, SERVICE_NOTIFICATIONS_USER_ID));
}
export function selectSendAs(global, chatId) {
    const chat = selectChat(global, chatId);
    if (!chat)
        return undefined;
    const id = selectChatFullInfo(global, chatId)?.sendAsId;
    if (!id)
        return undefined;
    return selectUser(global, id) || selectChat(global, id);
}
export function selectRequestedDraft(global, chatId, ...[tabId = getCurrentTabId()]) {
    const { requestedDraft } = selectTabState(global, tabId);
    if (requestedDraft?.chatId === chatId && !requestedDraft.files?.length) {
        return requestedDraft.text;
    }
    return undefined;
}
export function selectRequestedDraftFiles(global, chatId, ...[tabId = getCurrentTabId()]) {
    const { requestedDraft } = selectTabState(global, tabId);
    if (requestedDraft?.chatId === chatId) {
        return requestedDraft.files;
    }
    return undefined;
}
export function filterChatIdsByType(global, chatIds, filter) {
    return chatIds.filter((id) => {
        const type = selectChatType(global, id);
        if (!type) {
            return false;
        }
        return filter.includes(type);
    });
}
export function selectCanInviteToChat(global, chatId) {
    const chat = selectChat(global, chatId);
    if (!chat)
        return false;
    // https://github.com/TelegramMessenger/Telegram-iOS/blob/5126be83b3b9578fb014eb52ca553da9e7a8b83a/submodules/TelegramCore/Sources/TelegramEngine/Peers/Communities.swift#L6
    return !chat.migratedTo && Boolean(!isUserId(chatId) && ((isChatChannel(chat) || isChatSuperGroup(chat)) ? (chat.isCreator || getHasAdminRight(chat, 'inviteUsers')
        || (isChatPublic(chat) && !chat.isJoinRequest)) : (chat.isCreator || getHasAdminRight(chat, 'inviteUsers'))));
}
export function selectCanShareFolder(global, folderId) {
    const folder = selectChatFolder(global, folderId);
    if (!folder)
        return false;
    const { bots, groups, channels, contacts, nonContacts, includedChatIds, pinnedChatIds, excludeArchived, excludeMuted, excludeRead, excludedChatIds, } = folder;
    return !bots && !groups && !channels && !contacts && !nonContacts
        && !excludeArchived && !excludeMuted && !excludeRead && !excludedChatIds?.length
        && (pinnedChatIds?.length || includedChatIds.length)
        && folder.includedChatIds.concat(folder.pinnedChatIds || []).some((chatId) => {
            return selectCanInviteToChat(global, chatId);
        });
}
export function selectShouldDetectChatLanguage(global, chatId) {
    const chat = selectChat(global, chatId);
    if (!chat)
        return false;
    if (chat.hasAutoTranslation)
        return true;
    const { canTranslateChats } = global.settings.byKey;
    const isPremium = selectIsCurrentUserPremium(global);
    const isSavedMessages = selectIsChatWithSelf(global, chatId);
    return IS_TRANSLATION_SUPPORTED && canTranslateChats && isPremium && !isSavedMessages;
}
export function selectCanTranslateChat(global, chatId, ...[tabId = getCurrentTabId()]) {
    const chat = selectChat(global, chatId);
    if (!chat)
        return false;
    const requestedTranslation = selectRequestedChatTranslationLanguage(global, chatId, tabId);
    if (requestedTranslation)
        return true; // Prevent translation dropping on reevaluation
    const isLanguageDetectable = selectShouldDetectChatLanguage(global, chatId);
    const detectedLanguage = chat.detectedLanguage;
    const { doNotTranslate } = global.settings.byKey;
    return Boolean(isLanguageDetectable && detectedLanguage && !doNotTranslate.includes(detectedLanguage));
}
export function selectRequestedChatTranslationLanguage(global, chatId, ...[tabId = getCurrentTabId()]) {
    const { requestedTranslations } = selectTabState(global, tabId);
    return requestedTranslations.byChatId[chatId]?.toLanguage;
}
export function selectSimilarChannelIds(global, chatId) {
    return global.chats.similarChannelsById[chatId];
}
export function selectSimilarBotsIds(global, chatId) {
    return global.chats.similarBotsById[chatId];
}
export function selectChatLastMessageId(global, chatId, listType = 'all') {
    return global.chats.lastMessageIds[listType]?.[chatId];
}
export function selectChatLastMessage(global, chatId, listType = 'all') {
    const id = selectChatLastMessageId(global, chatId, listType);
    if (!id)
        return undefined;
    const realChatId = listType === 'saved' ? global.currentUserId : chatId;
    return global.messages.byChatId[realChatId]?.byId[id];
}
export function selectIsMonoforumAdmin(global, chatId) {
    const chat = selectChat(global, chatId);
    if (!chat?.isMonoforum)
        return;
    const channel = selectMonoforumChannel(global, chatId);
    if (!channel)
        return;
    return Boolean(chat.isCreator || chat.adminRights || channel.isCreator || channel.adminRights);
}
/**
 * Only selects monoforum channel for monoforum chats.
 * Returns `undefined` for other chats, including channels that have linked monoforum.
 */
export function selectMonoforumChannel(global, chatId) {
    const chat = selectChat(global, chatId);
    if (!chat)
        return;
    return chat.isMonoforum ? selectChat(global, chat.linkedMonoforumId) : undefined;
}
