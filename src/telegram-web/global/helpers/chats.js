import { MAIN_THREAD_ID } from '../../api/types';
import { ANONYMOUS_USER_ID, ARCHIVED_FOLDER_ID, GENERAL_TOPIC_ID, REPLIES_USER_ID, TME_LINK_PREFIX, VERIFICATION_CODES_USER_ID, } from '../../config';
import { formatDateToString, formatTime } from '../../util/dates/dateFormat';
import { getPeerIdDividend, isUserId } from '../../util/entities/ids';
import { getServerTime } from '../../util/serverTime';
import { getGlobal } from '..';
import { isSystemBot } from './bots';
import { getMainUsername } from './users';
const FOREVER_BANNED_DATE = Date.now() / 1000 + 31622400; // 366 days
export function isChatGroup(chat) {
    return isChatBasicGroup(chat) || isChatSuperGroup(chat);
}
export function isChatBasicGroup(chat) {
    return chat.type === 'chatTypeBasicGroup';
}
export function isChatSuperGroup(chat) {
    return chat.type === 'chatTypeSuperGroup';
}
export function isChatChannel(chat) {
    return chat.type === 'chatTypeChannel';
}
export function isChatMonoforum(chat) {
    return chat.isMonoforum;
}
export function isCommonBoxChat(chat) {
    return chat.type === 'chatTypePrivate' || chat.type === 'chatTypeBasicGroup';
}
export function isChatWithRepliesBot(chatId) {
    return chatId === REPLIES_USER_ID;
}
export function isChatWithVerificationCodesBot(chatId) {
    return chatId === VERIFICATION_CODES_USER_ID;
}
export function isAnonymousForwardsChat(chatId) {
    return chatId === ANONYMOUS_USER_ID;
}
export function getChatTypeString(chat) {
    switch (chat.type) {
        case 'chatTypePrivate':
            return 'PrivateChat';
        case 'chatTypeBasicGroup':
        case 'chatTypeSuperGroup':
            return 'AccDescrGroup';
        case 'chatTypeChannel':
            return 'AccDescrChannel';
        default:
            return 'Chat';
    }
}
export function getPrivateChatUserId(chat) {
    if (chat.type !== 'chatTypePrivate' && chat.type !== 'chatTypeSecret') {
        return undefined;
    }
    return chat.id;
}
export function getChatTitle(lang, chat, isSelf = false) {
    if (isSelf) {
        return lang('SavedMessages');
    }
    return chat.title || lang('HiddenName');
}
export function getChatLink(chat) {
    const activeUsername = getMainUsername(chat);
    return activeUsername ? `${TME_LINK_PREFIX}${activeUsername}` : undefined;
}
export function getChatAvatarHash(owner, size = 'normal', avatarPhotoId = owner.avatarPhotoId) {
    if (!avatarPhotoId) {
        return undefined;
    }
    switch (size) {
        case 'big':
            return `profile${owner.id}?${avatarPhotoId}`;
        default:
            return `avatar${owner.id}?${avatarPhotoId}`;
    }
}
export function isChatAdmin(chat) {
    return Boolean(chat.adminRights || chat.isCreator);
}
export function getHasAdminRight(chat, key) {
    return chat.adminRights?.[key] || false;
}
export function getCanManageTopic(chat, topic) {
    if (topic.id === GENERAL_TOPIC_ID)
        return chat.isCreator;
    return chat.isCreator || getHasAdminRight(chat, 'manageTopics') || topic.isOwner;
}
export function isUserRightBanned(chat, key, chatFullInfo) {
    const unrestrictedByBoosts = chatFullInfo?.boostsToUnrestrict
        && (chatFullInfo.boostsApplied || 0) >= chatFullInfo.boostsToUnrestrict;
    return Boolean((chat.currentUserBannedRights?.[key])
        || (chat.defaultBannedRights?.[key] && !unrestrictedByBoosts));
}
export function getCanPostInChat(chat, topic, isMessageThread, chatFullInfo) {
    if (topic) {
        if (chat.isForum) {
            if (chat.isNotJoined) {
                return false;
            }
            if (topic?.isClosed && !topic.isOwner && !getHasAdminRight(chat, 'manageTopics')) {
                return false;
            }
        }
    }
    if (chat.isRestricted || chat.isForbidden || chat.migratedTo
        || (chat.isNotJoined && !isChatMonoforum(chat) && !isMessageThread)
        || isSystemBot(chat.id) || isAnonymousForwardsChat(chat.id)) {
        return false;
    }
    if (chat.isCreator) {
        return true;
    }
    if (isUserId(chat.id)) {
        return true;
    }
    if (isChatChannel(chat)) {
        return getHasAdminRight(chat, 'postMessages');
    }
    return isChatAdmin(chat) || !isUserRightBanned(chat, 'sendMessages', chatFullInfo);
}
export function getAllowedAttachmentOptions(chat, chatFullInfo, isChatWithBot = false, isSavedMessages = false, isStoryReply = false, paidMessagesStars, isInScheduledList = false) {
    if (!chat || (paidMessagesStars && isInScheduledList)) {
        return {
            canAttachMedia: false,
            canAttachPolls: false,
            canSendStickers: false,
            canSendGifs: false,
            canAttachEmbedLinks: false,
            canSendPhotos: false,
            canSendVideos: false,
            canSendRoundVideos: false,
            canSendAudios: false,
            canSendVoices: false,
            canSendPlainText: false,
            canSendDocuments: false,
            canAttachToDoLists: false,
        };
    }
    const isAdmin = isChatAdmin(chat);
    return {
        canAttachMedia: isAdmin || isStoryReply || !isUserRightBanned(chat, 'sendMedia', chatFullInfo),
        canAttachPolls: !isStoryReply && !chat.isMonoforum
            && (isAdmin || !isUserRightBanned(chat, 'sendPolls', chatFullInfo))
            && (!isUserId(chat.id) || isChatWithBot || isSavedMessages),
        canAttachToDoLists: !isStoryReply && !chat.isMonoforum && !isChatChannel(chat),
        canSendStickers: isAdmin || isStoryReply || !isUserRightBanned(chat, 'sendStickers', chatFullInfo),
        canSendGifs: isAdmin || isStoryReply || !isUserRightBanned(chat, 'sendGifs', chatFullInfo),
        canAttachEmbedLinks: !isStoryReply && (isAdmin || !isUserRightBanned(chat, 'embedLinks', chatFullInfo)),
        canSendPhotos: isAdmin || isStoryReply || !isUserRightBanned(chat, 'sendPhotos', chatFullInfo),
        canSendVideos: isAdmin || isStoryReply || !isUserRightBanned(chat, 'sendVideos', chatFullInfo),
        canSendRoundVideos: isAdmin || isStoryReply || !isUserRightBanned(chat, 'sendRoundvideos', chatFullInfo),
        canSendAudios: isAdmin || isStoryReply || !isUserRightBanned(chat, 'sendAudios', chatFullInfo),
        canSendVoices: isAdmin || isStoryReply || !isUserRightBanned(chat, 'sendVoices', chatFullInfo),
        canSendPlainText: isAdmin || isStoryReply || !isUserRightBanned(chat, 'sendPlain', chatFullInfo),
        canSendDocuments: isAdmin || isStoryReply || !isUserRightBanned(chat, 'sendDocs', chatFullInfo),
    };
}
export function getMessageSendingRestrictionReason(lang, currentUserBannedRights, defaultBannedRights) {
    if (currentUserBannedRights?.sendMessages) {
        const { untilDate } = currentUserBannedRights;
        return untilDate && untilDate < FOREVER_BANNED_DATE
            ? lang('Channel.Persmission.Denied.SendMessages.Until', lang('formatDateAtTime', [formatDateToString(new Date(untilDate * 1000), lang.code), formatTime(lang, untilDate * 1000)]))
            : lang('Channel.Persmission.Denied.SendMessages.Forever');
    }
    if (defaultBannedRights?.sendMessages) {
        return lang('Channel.Persmission.Denied.SendMessages.DefaultRestrictedText');
    }
    return undefined;
}
export function getForumComposerPlaceholder(lang, chat, threadId = MAIN_THREAD_ID, topics, isReplying) {
    if (!chat?.isForum) {
        return undefined;
    }
    if (threadId === MAIN_THREAD_ID) {
        if (isReplying || (topics && !topics[GENERAL_TOPIC_ID]?.isClosed))
            return undefined;
        return lang('lng_forum_replies_only');
    }
    const topic = topics?.[Number(threadId)];
    if (!topic) {
        return undefined;
    }
    if (topic.isClosed && !topic.isOwner && !getHasAdminRight(chat, 'manageTopics')) {
        return lang('TopicClosedByAdmin');
    }
    return undefined;
}
export function isChatArchived(chat) {
    return chat.folderId === ARCHIVED_FOLDER_ID;
}
export function getCanDeleteChat(chat) {
    return isChatBasicGroup(chat) || ((isChatSuperGroup(chat) || isChatChannel(chat)) && chat.isCreator);
}
export function getFolderDescriptionText(lang, folder, chatsCount) {
    const { excludedChatIds, includedChatIds, bots, groups, contacts, nonContacts, channels, } = folder;
    const filters = [bots, groups, contacts, nonContacts, channels];
    // If folder has multiple additive filters or uses include/exclude lists,
    // we display folder chats count
    if (chatsCount !== undefined && (Object.values(filters).filter(Boolean).length > 1
        || (excludedChatIds?.length)
        || (includedChatIds?.length))) {
        return lang('Chats', chatsCount);
    }
    // Otherwise, we return a short description of a single filter
    if (bots) {
        return lang('FilterBots');
    }
    else if (groups) {
        return lang('FilterGroups');
    }
    else if (channels) {
        return lang('FilterChannels');
    }
    else if (contacts) {
        return lang('FilterContacts');
    }
    else if (nonContacts) {
        return lang('FilterNonContacts');
    }
    else {
        return undefined;
    }
}
export function isChatPublic(chat) {
    return chat.hasUsername;
}
export function getOrderedTopics(topics, pinnedOrder, shouldSortByLastMessage = false) {
    if (shouldSortByLastMessage) {
        return topics.sort((a, b) => b.lastMessageId - a.lastMessageId);
    }
    else {
        const pinned = topics.filter((topic) => topic.isPinned);
        const ordered = topics
            .filter((topic) => !topic.isPinned && !topic.isHidden)
            .sort((a, b) => b.lastMessageId - a.lastMessageId);
        const hidden = topics.filter((topic) => !topic.isPinned && topic.isHidden)
            .sort((a, b) => b.lastMessageId - a.lastMessageId);
        const pinnedOrdered = pinnedOrder
            ? pinnedOrder.map((id) => pinned.find((topic) => topic.id === id)).filter(Boolean) : pinned;
        return [...pinnedOrdered, ...ordered, ...hidden];
    }
}
export function getPeerColorKey(peer) {
    if (peer?.color?.color)
        return peer.color.color;
    return peer ? getPeerIdDividend(peer.id) % 7 : 0;
}
export function getPeerColorCount(peer) {
    const key = getPeerColorKey(peer);
    const global = getGlobal();
    return global.peerColors?.general[key].colors?.length || 1;
}
export function getIsSavedDialog(chatId, threadId, currentUserId) {
    return chatId === currentUserId && threadId !== MAIN_THREAD_ID;
}
export function getGroupStatus(lang, chat) {
    const chatTypeString = lang(getChatTypeString(chat));
    const { membersCount } = chat;
    if (chat.isRestricted) {
        return chatTypeString === 'Channel' ? 'channel is inaccessible' : 'group is inaccessible';
    }
    if (!membersCount) {
        return chatTypeString;
    }
    return chatTypeString === 'Channel'
        ? lang('Subscribers', membersCount, 'i')
        : lang('Members', membersCount, 'i');
}
export function getCustomPeerFromInvite(invite) {
    const { title, color, isVerified, isFake, isScam, } = invite;
    return {
        isCustomPeer: true,
        title,
        peerColorId: color,
        isVerified,
        fakeType: isFake ? 'fake' : isScam ? 'scam' : undefined,
    };
}
export function getMockPreparedMessageFromResult(botId, preparedMessage) {
    const { result } = preparedMessage;
    const inlineButtons = result?.sendMessage?.replyMarkup?.inlineButtons;
    return {
        chatId: botId,
        content: result.sendMessage.content,
        date: getServerTime(),
        id: 0,
        isOutgoing: true,
        viaBotId: botId,
        inlineButtons,
    };
}
