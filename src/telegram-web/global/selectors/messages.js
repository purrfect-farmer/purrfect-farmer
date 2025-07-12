import { ApiMessageEntityTypes, MAIN_THREAD_ID } from '../../api/types';
import { ANONYMOUS_USER_ID, API_GENERAL_ID_LIMIT, GENERAL_TOPIC_ID, SERVICE_NOTIFICATIONS_USER_ID, SVG_EXTENSIONS, } from '../../config';
import { IS_TRANSLATION_SUPPORTED } from '../../util/browser/windowEnvironment';
import { isUserId } from '../../util/entities/ids';
import { getCurrentTabId } from '../../util/establishMultitabRole';
import { findLast } from '../../util/iteratees';
import { getMessageKey, isLocalMessageId } from '../../util/keys/messageKey';
import { MEMO_EMPTY_ARRAY } from '../../util/memo';
import { getServerTime } from '../../util/serverTime';
import { getDocumentExtension } from '../../components/common/helpers/documentInfo';
import { canSendReaction, getAllowedAttachmentOptions, getCanPostInChat, getHasAdminRight, getIsSavedDialog, getMessageAudio, getMessageDocument, getMessageLink, getMessagePaidMedia, getMessagePhoto, getMessageVideo, getMessageVoice, getMessageWebPagePhoto, getMessageWebPageVideo, getSendingState, getTimestampableMedia, hasMessageTtl, isActionMessage, isChatBasicGroup, isChatChannel, isChatGroup, isChatSuperGroup, isCommonBoxChat, isExpiredMessage, isForwardedMessage, isMessageDocumentSticker, isMessageFailed, isMessageLocal, isMessageTranslatable, isOwnMessage, isServiceNotificationMessage, isUserRightBanned, } from '../helpers';
import { getMessageReplyInfo } from '../helpers/replies';
import { selectChat, selectChatFullInfo, selectChatLastMessageId, selectIsChatWithBot, selectIsChatWithSelf, selectRequestedChatTranslationLanguage, } from './chats';
import { selectPeer, selectPeerPaidMessagesStars } from './peers';
import { selectPeerStory } from './stories';
import { selectIsStickerFavorite } from './symbols';
import { selectTabState } from './tabs';
import { selectTopic } from './topics';
import { selectBot, selectIsCurrentUserPremium, selectUser, selectUserStatus, } from './users';
export function selectCurrentMessageList(global, ...[tabId = getCurrentTabId()]) {
    const { messageLists } = selectTabState(global, tabId);
    if (messageLists.length) {
        return messageLists[messageLists.length - 1];
    }
    return undefined;
}
export function selectCurrentChat(global, ...[tabId = getCurrentTabId()]) {
    const { chatId } = selectCurrentMessageList(global, tabId) || {};
    return chatId ? selectChat(global, chatId) : undefined;
}
export function selectChatMessages(global, chatId) {
    return global.messages.byChatId[chatId]?.byId;
}
export function selectChatScheduledMessages(global, chatId) {
    return global.scheduledMessages.byChatId[chatId]?.byId;
}
export function selectTabThreadParam(global, chatId, threadId, key, ...[tabId = getCurrentTabId()]) {
    return selectTabState(global, tabId).tabThreads[chatId]?.[threadId]?.[key];
}
export function selectThreadParam(global, chatId, threadId, key) {
    return selectThread(global, chatId, threadId)?.[key];
}
export function selectThread(global, chatId, threadId) {
    const messageInfo = global.messages.byChatId[chatId];
    if (!messageInfo) {
        return undefined;
    }
    const thread = messageInfo.threadsById[threadId];
    if (!thread) {
        return undefined;
    }
    return thread;
}
export function selectListedIds(global, chatId, threadId) {
    return selectThreadParam(global, chatId, threadId, 'listedIds');
}
export function selectOutlyingListByMessageId(global, chatId, threadId, messageId) {
    const outlyingLists = selectOutlyingLists(global, chatId, threadId);
    if (!outlyingLists) {
        return undefined;
    }
    return outlyingLists.find((list) => {
        return list[0] <= messageId && list[list.length - 1] >= messageId;
    });
}
export function selectOutlyingLists(global, chatId, threadId) {
    return selectThreadParam(global, chatId, threadId, 'outlyingLists');
}
export function selectCurrentMessageIds(global, chatId, threadId, messageListType, ...[tabId = getCurrentTabId()]) {
    switch (messageListType) {
        case 'thread':
            return selectViewportIds(global, chatId, threadId, tabId);
        case 'pinned':
            return selectPinnedIds(global, chatId, threadId);
        case 'scheduled':
            return selectScheduledIds(global, chatId, threadId);
    }
    return undefined;
}
export function selectViewportIds(global, chatId, threadId, ...[tabId = getCurrentTabId()]) {
    return selectTabThreadParam(global, chatId, threadId, 'viewportIds', tabId);
}
export function selectPinnedIds(global, chatId, threadId) {
    return selectThreadParam(global, chatId, threadId, 'pinnedIds');
}
export function selectScheduledIds(global, chatId, threadId) {
    return selectThreadParam(global, chatId, threadId, 'scheduledIds');
}
export function selectScrollOffset(global, chatId, threadId, ...[tabId = getCurrentTabId()]) {
    return selectTabThreadParam(global, chatId, threadId, 'scrollOffset', tabId);
}
export function selectLastScrollOffset(global, chatId, threadId) {
    return selectThreadParam(global, chatId, threadId, 'lastScrollOffset');
}
export function selectEditingId(global, chatId, threadId) {
    return selectThreadParam(global, chatId, threadId, 'editingId');
}
export function selectEditingDraft(global, chatId, threadId) {
    return selectThreadParam(global, chatId, threadId, 'editingDraft');
}
export function selectEditingScheduledId(global, chatId) {
    return selectThreadParam(global, chatId, MAIN_THREAD_ID, 'editingScheduledId');
}
export function selectEditingScheduledDraft(global, chatId) {
    return selectThreadParam(global, chatId, MAIN_THREAD_ID, 'editingScheduledDraft');
}
export function selectDraft(global, chatId, threadId) {
    return selectThreadParam(global, chatId, threadId, 'draft');
}
export function selectNoWebPage(global, chatId, threadId) {
    return selectThreadParam(global, chatId, threadId, 'noWebPage');
}
export function selectThreadInfo(global, chatId, threadId) {
    return selectThreadParam(global, chatId, threadId, 'threadInfo');
}
export function selectFirstMessageId(global, chatId, threadId) {
    return selectThreadParam(global, chatId, threadId, 'firstMessageId');
}
export function selectReplyStack(global, chatId, threadId, ...[tabId = getCurrentTabId()]) {
    return selectTabThreadParam(global, chatId, threadId, 'replyStack', tabId);
}
export function selectThreadMessagesCount(global, chatId, threadId) {
    const chat = selectChat(global, chatId);
    const threadInfo = selectThreadInfo(global, chatId, threadId);
    if (!chat || !threadInfo || threadInfo.messagesCount === undefined)
        return undefined;
    // In forum topics first message is ignored, but not in General
    if (chat.isForum && threadId !== GENERAL_TOPIC_ID)
        return threadInfo.messagesCount - 1;
    return threadInfo.messagesCount;
}
export function selectThreadByMessage(global, message) {
    const threadId = selectThreadIdFromMessage(global, message);
    if (!threadId || threadId === MAIN_THREAD_ID) {
        return undefined;
    }
    return global.messages.byChatId[message.chatId].threadsById[threadId];
}
export function selectIsMessageInCurrentMessageList(global, chatId, message, ...[tabId = getCurrentTabId()]) {
    const currentMessageList = selectCurrentMessageList(global, tabId);
    if (!currentMessageList) {
        return false;
    }
    const { threadInfo } = selectThreadByMessage(global, message) || {};
    return (chatId === currentMessageList.chatId
        && ((currentMessageList.threadId === MAIN_THREAD_ID)
            || (threadInfo && currentMessageList.threadId === threadInfo.threadId)));
}
export function selectIsViewportNewest(global, chatId, threadId, ...[tabId = getCurrentTabId()]) {
    const viewportIds = selectViewportIds(global, chatId, threadId, tabId);
    if (!viewportIds || !viewportIds.length) {
        return true;
    }
    const isSavedDialog = getIsSavedDialog(chatId, threadId, global.currentUserId);
    let lastMessageId;
    if (threadId === MAIN_THREAD_ID) {
        const id = selectChatLastMessageId(global, chatId);
        if (!id) {
            return true;
        }
        lastMessageId = id;
    }
    else if (isSavedDialog) {
        const id = selectChatLastMessageId(global, String(threadId), 'saved');
        if (!id) {
            return true;
        }
        lastMessageId = id;
    }
    else {
        const threadInfo = selectThreadInfo(global, chatId, threadId);
        if (!threadInfo || !threadInfo.lastMessageId) {
            if (!threadInfo?.threadId)
                return undefined;
            // No messages in thread, except for the thread message itself
            lastMessageId = Number(threadInfo?.threadId);
        }
        else {
            lastMessageId = threadInfo.lastMessageId;
        }
    }
    // Edge case: outgoing `lastMessage` is updated with a delay to optimize animation
    if (isLocalMessageId(lastMessageId) && !selectChatMessage(global, chatId, lastMessageId)) {
        return true;
    }
    return viewportIds[viewportIds.length - 1] >= lastMessageId;
}
export function selectChatMessage(global, chatId, messageId) {
    const chatMessages = selectChatMessages(global, chatId);
    return chatMessages ? chatMessages[messageId] : undefined;
}
export function selectScheduledMessage(global, chatId, messageId) {
    const chatMessages = selectChatScheduledMessages(global, chatId);
    return chatMessages ? chatMessages[messageId] : undefined;
}
export function selectQuickReplyMessage(global, messageId) {
    return global.quickReplies.messagesById[messageId];
}
export function selectEditingMessage(global, chatId, threadId, messageListType) {
    if (messageListType === 'scheduled') {
        const messageId = selectEditingScheduledId(global, chatId);
        return messageId ? selectScheduledMessage(global, chatId, messageId) : undefined;
    }
    else {
        const messageId = selectEditingId(global, chatId, threadId);
        return messageId ? selectChatMessage(global, chatId, messageId) : undefined;
    }
}
export function selectFocusedMessageId(global, chatId, ...[tabId = getCurrentTabId()]) {
    const { chatId: focusedChatId, messageId } = selectTabState(global, tabId).focusedMessage || {};
    return focusedChatId === chatId ? messageId : undefined;
}
export function selectIsMessageFocused(global, message, currentThreadId, ...[tabId = getCurrentTabId()]) {
    const focusedId = selectFocusedMessageId(global, message.chatId, tabId);
    const threadId = selectTabState(global, tabId).focusedMessage?.threadId;
    if (currentThreadId !== threadId)
        return false;
    return focusedId ? focusedId === message.id || focusedId === message.previousLocalId : false;
}
export function selectIsMessageUnread(global, message) {
    const { lastReadOutboxMessageId } = selectChat(global, message.chatId) || {};
    return isMessageLocal(message) || !lastReadOutboxMessageId || lastReadOutboxMessageId < message.id;
}
export function selectOutgoingStatus(global, message, isScheduledList = false) {
    if (!selectIsMessageUnread(global, message) && !isScheduledList) {
        return 'read';
    }
    return getSendingState(message);
}
export function selectSender(global, message) {
    const { senderId } = message;
    const chat = selectChat(global, message.chatId);
    const currentUser = selectUser(global, global.currentUserId);
    if (!senderId) {
        return message.isOutgoing ? currentUser : chat;
    }
    if (chat && isChatChannel(chat) && !chat.areProfilesShown)
        return chat;
    return selectPeer(global, senderId);
}
export function getSendersFromSelectedMessages(global, chatId, messageIds) {
    return messageIds.map((id) => {
        const message = selectChatMessage(global, chatId, id);
        return message && selectSender(global, message);
    }).filter(Boolean);
}
export function selectSenderFromMessage(global, chatId, messageId) {
    const message = selectChatMessage(global, chatId, messageId);
    return message && selectSender(global, message);
}
export function selectSenderFromHeader(global, header) {
    const { fromId } = header;
    if (fromId) {
        return selectPeer(global, fromId);
    }
    return undefined;
}
export function selectForwardedSender(global, message) {
    const isStoryForward = Boolean(message.content.storyData);
    if (isStoryForward) {
        const peerId = message.content.storyData.peerId;
        return selectPeer(global, peerId);
    }
    const { forwardInfo } = message;
    if (!forwardInfo) {
        return undefined;
    }
    if (forwardInfo.isChannelPost && forwardInfo.fromChatId) {
        return selectChat(global, forwardInfo.fromChatId);
    }
    if (forwardInfo.hiddenUserName) {
        return undefined;
    }
    if (forwardInfo.fromId) {
        return selectPeer(global, forwardInfo.fromId);
    }
    if (forwardInfo.savedFromPeerId) {
        return selectPeer(global, forwardInfo.savedFromPeerId);
    }
    return undefined;
}
export function selectPoll(global, pollId) {
    return global.messages.pollById[pollId];
}
export function selectPollFromMessage(global, message) {
    if (!message.content.pollId)
        return undefined;
    return selectPoll(global, message.content.pollId);
}
export function selectTopicFromMessage(global, message) {
    const { chatId } = message;
    const chat = selectChat(global, chatId);
    if (!chat?.isForum)
        return undefined;
    const threadId = selectThreadIdFromMessage(global, message);
    return selectTopic(global, chatId, threadId);
}
const MAX_MESSAGES_TO_DELETE_OWNER_TOPIC = 10;
export function selectCanDeleteOwnerTopic(global, chatId, topicId) {
    const topic = selectTopic(global, chatId, topicId);
    if (topic && !topic.isOwner)
        return false;
    const thread = selectThread(global, chatId, topicId);
    if (!thread)
        return false;
    const { listedIds } = thread;
    if (!listedIds
        // Plus one for root message
        || listedIds.length + 1 >= MAX_MESSAGES_TO_DELETE_OWNER_TOPIC) {
        return false;
    }
    const hasNotOutgoingMessages = listedIds.some((messageId) => {
        const message = selectChatMessage(global, chatId, messageId);
        return !message || !message.isOutgoing;
    });
    return !hasNotOutgoingMessages;
}
export function selectCanDeleteTopic(global, chatId, topicId) {
    const chat = selectChat(global, chatId);
    if (!chat)
        return false;
    if (topicId === GENERAL_TOPIC_ID)
        return false;
    return chat.isCreator
        || getHasAdminRight(chat, 'deleteMessages')
        || (chat.isForum
            && selectCanDeleteOwnerTopic(global, chat.id, topicId));
}
export function selectSavedDialogIdFromMessage(global, message) {
    const { chatId, senderId, forwardInfo, savedPeerId, } = message;
    if (savedPeerId)
        return savedPeerId;
    if (chatId !== global.currentUserId) {
        return undefined;
    }
    if (forwardInfo?.savedFromPeerId) {
        return forwardInfo.savedFromPeerId;
    }
    if (forwardInfo?.fromId) {
        return forwardInfo.fromId;
    }
    if (forwardInfo?.hiddenUserName) {
        return ANONYMOUS_USER_ID;
    }
    return senderId;
}
export function selectThreadIdFromMessage(global, message) {
    const savedDialogId = selectSavedDialogIdFromMessage(global, message);
    if (savedDialogId) {
        return savedDialogId;
    }
    const chat = selectChat(global, message.chatId);
    const { content } = message;
    const { replyToMsgId, replyToTopId, isForumTopic } = getMessageReplyInfo(message) || {};
    if ('action' in content && content.action?.type === 'topicCreate') {
        return message.id;
    }
    if (!chat?.isForum) {
        if (chat && isChatBasicGroup(chat))
            return MAIN_THREAD_ID;
        if (chat && isChatSuperGroup(chat)) {
            return replyToTopId || replyToMsgId || MAIN_THREAD_ID;
        }
        return MAIN_THREAD_ID;
    }
    if (!isForumTopic)
        return GENERAL_TOPIC_ID;
    return replyToTopId || replyToMsgId || GENERAL_TOPIC_ID;
}
export function selectCanReplyToMessage(global, message, threadId) {
    const chat = selectChat(global, message.chatId);
    if (!chat || chat.isRestricted || chat.isForbidden)
        return false;
    const isLocal = isMessageLocal(message);
    const isServiceNotification = isServiceNotificationMessage(message);
    if (isLocal || isServiceNotification)
        return false;
    const threadInfo = selectThreadInfo(global, message.chatId, threadId);
    const isMessageThread = Boolean(!threadInfo?.isCommentsInfo && threadInfo?.fromChannelId);
    const chatFullInfo = selectChatFullInfo(global, chat.id);
    const topic = selectTopic(global, chat.id, threadId);
    const canPostInChat = getCanPostInChat(chat, topic, isMessageThread, chatFullInfo);
    if (!canPostInChat)
        return false;
    const messageTopic = selectTopicFromMessage(global, message);
    return !messageTopic || !messageTopic.isClosed || messageTopic.isOwner || getHasAdminRight(chat, 'manageTopics');
}
export function selectCanForwardMessage(global, message) {
    const isLocal = isMessageLocal(message);
    const isServiceNotification = isServiceNotificationMessage(message);
    const isAction = isActionMessage(message);
    const hasTtl = hasMessageTtl(message);
    const { content } = message;
    const story = content.storyData
        ? selectPeerStory(global, content.storyData.peerId, content.storyData.id)
        : (content.webPage?.story
            ? selectPeerStory(global, content.webPage.story.peerId, content.webPage.story.id)
            : undefined);
    const isChatProtected = selectIsChatProtected(global, message.chatId);
    const isStoryForwardForbidden = story && ('isDeleted' in story || ('noForwards' in story && story.noForwards));
    const canForward = (!isLocal && !isAction && !isChatProtected && !isStoryForwardForbidden
        && (message.isForwardingAllowed || isServiceNotification) && !hasTtl);
    return canForward;
}
// This selector is slow and not to be used within lists (e.g. Message component)
export function selectAllowedMessageActionsSlow(global, message, threadId) {
    const chat = selectChat(global, message.chatId);
    if (!chat || chat.isRestricted) {
        return {};
    }
    const isPrivate = isUserId(chat.id);
    const isChatWithSelf = selectIsChatWithSelf(global, message.chatId);
    const isBasicGroup = isChatBasicGroup(chat);
    const isSuperGroup = isChatSuperGroup(chat);
    const isChannel = isChatChannel(chat);
    const isBotChat = Boolean(selectBot(global, chat.id));
    const isLocal = isMessageLocal(message);
    const isFailed = isMessageFailed(message);
    const isServiceNotification = isServiceNotificationMessage(message);
    const isOwn = isOwnMessage(message);
    const isForwarded = isForwardedMessage(message);
    const isAction = isActionMessage(message);
    const hasTtl = hasMessageTtl(message);
    const { content } = message;
    const isDocumentSticker = isMessageDocumentSticker(message);
    const isBoostMessage = message.content.action?.type === 'boostApply';
    const isMonoforum = chat.isMonoforum;
    const hasChatPinPermission = (chat.isCreator
        || (!isChannel && !isUserRightBanned(chat, 'pinMessages'))
        || getHasAdminRight(chat, 'pinMessages'));
    const hasPinPermission = isPrivate || hasChatPinPermission;
    // https://github.com/telegramdesktop/tdesktop/blob/335095a332607c41a8d20b47e61f5bbd66366d4b/Telegram/SourceFiles/data/data_peer.cpp#L653
    const canEditMessagesIndefinitely = (() => {
        if (isPrivate)
            return isChatWithSelf;
        if (isBasicGroup)
            return false;
        if (isSuperGroup)
            return hasChatPinPermission;
        if (isChannel)
            return chat.isCreator || getHasAdminRight(chat, 'editMessages');
        return false;
    })();
    const isMessageEditable = ((canEditMessagesIndefinitely
        || getServerTime() - message.date < (global.config?.editTimeLimit || Infinity)) && !(content.sticker || content.contact || content.pollId || content.action
        || (content.video?.isRound) || content.location || content.invoice || content.giveaway || content.giveawayResults
        || isDocumentSticker)
        && !isForwarded
        && !message.viaBotId
        && !chat.isForbidden);
    const isSavedDialog = getIsSavedDialog(chat.id, threadId, global.currentUserId);
    const canReply = selectCanReplyToMessage(global, message, threadId);
    const canReplyGlobally = canReply || (!isSavedDialog && !isLocal && !isServiceNotification
        && (isSuperGroup || isBasicGroup || isChatChannel(chat)));
    let canPin = !isLocal && !isServiceNotification && !isAction && hasPinPermission && !isSavedDialog;
    let canUnpin = false;
    const pinnedMessageIds = selectPinnedIds(global, chat.id, threadId);
    if (canPin) {
        canUnpin = Boolean(pinnedMessageIds && pinnedMessageIds.includes(message.id));
        canPin = !canUnpin;
    }
    const canNotDeleteBoostMessage = isBoostMessage && isOwn
        && !chat.isCreator && !getHasAdminRight(chat, 'deleteMessages');
    const canDelete = (!isLocal || isFailed) && !isServiceNotification && !canNotDeleteBoostMessage && (isPrivate
        || isOwn
        || isBasicGroup
        || chat.isCreator
        || getHasAdminRight(chat, 'deleteMessages'));
    const canReport = !isPrivate && !isOwn;
    const canDeleteForAll = canDelete && !chat.isForbidden && ((isPrivate && !isChatWithSelf && !isBotChat)
        || (isBasicGroup && (isOwn || getHasAdminRight(chat, 'deleteMessages') || chat.isCreator)));
    const hasMessageEditRight = isOwn || (isChannel && (chat.isCreator || getHasAdminRight(chat, 'editMessages')));
    const canEdit = !isLocal && !isAction && isMessageEditable && hasMessageEditRight;
    const hasSticker = Boolean(message.content.sticker);
    const hasFavoriteSticker = hasSticker && selectIsStickerFavorite(global, message.content.sticker);
    const canFaveSticker = !isAction && hasSticker && !hasFavoriteSticker;
    const canUnfaveSticker = !isAction && hasFavoriteSticker;
    const canCopy = !isAction;
    const canCopyLink = !isLocal && !isAction && (isChannel || isSuperGroup) && !isMonoforum;
    const canSelect = !isLocal && !isAction;
    const canDownload = Boolean(content.webPage?.document || content.webPage?.video || content.webPage?.photo
        || content.audio || content.voice || content.photo || content.video || content.document || content.sticker)
        && !hasTtl;
    const canSaveGif = message.content.video?.isGif;
    const poll = content.pollId ? selectPoll(global, content.pollId) : undefined;
    const canRevote = !poll?.summary.closed && !poll?.summary.quiz && poll?.results.results?.some((r) => r.isChosen);
    const canClosePoll = hasMessageEditRight && poll && !poll.summary.closed && !isForwarded;
    const noOptions = [
        canReply,
        canReplyGlobally,
        canEdit,
        canPin,
        canUnpin,
        canReport,
        canDelete,
        canDeleteForAll,
        canFaveSticker,
        canUnfaveSticker,
        canCopy,
        canCopyLink,
        canSelect,
        canDownload,
        canSaveGif,
        canRevote,
        canClosePoll,
    ].every((ability) => !ability);
    return {
        noOptions,
        canReply,
        canReplyGlobally,
        canEdit,
        canPin,
        canUnpin,
        canReport,
        canDelete,
        canDeleteForAll,
        canFaveSticker,
        canUnfaveSticker,
        canCopy,
        canCopyLink,
        canSelect,
        canDownload,
        canSaveGif,
        canRevote,
        canClosePoll,
    };
}
export function selectCanDeleteMessages(global, chatId, threadId, messageIds) {
    const chatMessages = selectChatMessages(global, chatId);
    if (messageIds.length > API_GENERAL_ID_LIMIT) {
        return {};
    }
    const messageActions = messageIds
        .map((id) => chatMessages[id] && selectAllowedMessageActionsSlow(global, chatMessages[id], threadId))
        .filter(Boolean);
    return {
        canDelete: messageActions.every((actions) => actions.canDelete),
        canDeleteForAll: messageActions.every((actions) => actions.canDeleteForAll),
    };
}
export function selectCanDeleteSelectedMessages(global, messageIds, ...[tabId = getCurrentTabId()]) {
    const { messageIds: selectedMessageIds } = selectTabState(global, tabId).selectedMessages || {};
    const { chatId, threadId } = selectCurrentMessageList(global, tabId) || {};
    const messageIdList = messageIds?.length ? messageIds : selectedMessageIds;
    if (!chatId || !threadId || !messageIdList) {
        return {};
    }
    return selectCanDeleteMessages(global, chatId, threadId, messageIdList);
}
export function selectCanReportSelectedMessages(global, ...[tabId = getCurrentTabId()]) {
    const { messageIds: selectedMessageIds } = selectTabState(global, tabId).selectedMessages || {};
    const { chatId, threadId } = selectCurrentMessageList(global, tabId) || {};
    const chatMessages = chatId && selectChatMessages(global, chatId);
    if (!chatMessages || !selectedMessageIds || !threadId) {
        return false;
    }
    const messageActions = selectedMessageIds
        .map((id) => chatMessages[id] && selectAllowedMessageActionsSlow(global, chatMessages[id], threadId))
        .filter(Boolean);
    return messageActions.every((actions) => actions.canReport);
}
export function selectCanDownloadSelectedMessages(global, ...[tabId = getCurrentTabId()]) {
    const { messageIds: selectedMessageIds } = selectTabState(global, tabId).selectedMessages || {};
    const { chatId, threadId } = selectCurrentMessageList(global, tabId) || {};
    const chatMessages = chatId && selectChatMessages(global, chatId);
    if (!chatMessages || !selectedMessageIds || !threadId) {
        return false;
    }
    const messageActions = selectedMessageIds
        .map((id) => chatMessages[id] && selectAllowedMessageActionsSlow(global, chatMessages[id], threadId))
        .filter(Boolean);
    return messageActions.some((actions) => actions.canDownload);
}
export function selectActiveDownloads(global, ...[tabId = getCurrentTabId()]) {
    return selectTabState(global, tabId).activeDownloads;
}
export function selectUploadProgress(global, message) {
    return global.fileUploads.byMessageKey[getMessageKey(message)]?.progress;
}
export function selectRealLastReadId(global, chatId, threadId) {
    if (threadId === MAIN_THREAD_ID) {
        const chat = selectChat(global, chatId);
        if (!chat) {
            return undefined;
        }
        // `lastReadInboxMessageId` is empty for new chats
        if (!chat.lastReadInboxMessageId) {
            return undefined;
        }
        const lastMessageId = selectChatLastMessageId(global, chatId);
        if (!lastMessageId || chat.unreadCount) {
            return chat.lastReadInboxMessageId;
        }
        return lastMessageId;
    }
    else {
        const threadInfo = selectThreadInfo(global, chatId, threadId);
        if (!threadInfo) {
            return undefined;
        }
        if (!threadInfo.lastReadInboxMessageId) {
            return Number(threadInfo.threadId);
        }
        // Some previously read messages may be deleted
        return Math.min(threadInfo.lastReadInboxMessageId, threadInfo.lastMessageId || Infinity);
    }
}
export function selectFirstUnreadId(global, chatId, threadId) {
    const chat = selectChat(global, chatId);
    if (threadId === MAIN_THREAD_ID) {
        if (!chat) {
            return undefined;
        }
    }
    else {
        const threadInfo = selectThreadInfo(global, chatId, threadId);
        if (!threadInfo
            || (threadInfo.lastMessageId !== undefined && threadInfo.lastMessageId === threadInfo.lastReadInboxMessageId)) {
            return undefined;
        }
    }
    const outlyingLists = selectOutlyingLists(global, chatId, threadId);
    const listedIds = selectListedIds(global, chatId, threadId);
    const byId = selectChatMessages(global, chatId);
    if (!byId || !(outlyingLists?.length || listedIds)) {
        return undefined;
    }
    const lastReadId = selectRealLastReadId(global, chatId, threadId);
    if (!lastReadId && chat && chat.isNotJoined) {
        return undefined;
    }
    const lastReadServiceNotificationId = chatId === SERVICE_NOTIFICATIONS_USER_ID
        ? global.serviceNotifications.reduce((max, notification) => {
            return !notification.isUnread && notification.id > max ? notification.id : max;
        }, -1)
        : -1;
    function findAfterLastReadId(listIds) {
        return listIds.find((id) => {
            return ((!lastReadId || id > lastReadId)
                && byId[id]
                && (!byId[id].isOutgoing || byId[id].isFromScheduled)
                && id > lastReadServiceNotificationId);
        });
    }
    if (outlyingLists?.length) {
        const found = outlyingLists.map((list) => findAfterLastReadId(list)).filter(Boolean)[0];
        if (found) {
            return found;
        }
    }
    if (listedIds) {
        const found = findAfterLastReadId(listedIds);
        if (found) {
            return found;
        }
    }
    return undefined;
}
export function selectIsForwardModalOpen(global, ...[tabId = getCurrentTabId()]) {
    const { isShareMessageModalShown } = selectTabState(global, tabId);
    return Boolean(isShareMessageModalShown);
}
export function selectCommonBoxChatId(global, messageId) {
    const fromLastMessage = Object.values(global.chats.byId).find((chat) => (isCommonBoxChat(chat) && selectChatLastMessageId(global, chat.id) === messageId));
    if (fromLastMessage) {
        return fromLastMessage.id;
    }
    const { byChatId } = global.messages;
    return Object.keys(byChatId).find((chatId) => {
        const chat = selectChat(global, chatId);
        return chat && isCommonBoxChat(chat) && byChatId[chat.id].byId[messageId];
    });
}
export function selectIsInSelectMode(global, ...[tabId = getCurrentTabId()]) {
    const { selectedMessages } = selectTabState(global, tabId);
    return Boolean(selectedMessages);
}
export function selectIsMessageSelected(global, messageId, ...[tabId = getCurrentTabId()]) {
    const { messageIds } = selectTabState(global, tabId).selectedMessages || {};
    if (!messageIds) {
        return false;
    }
    return messageIds.includes(messageId);
}
export function selectForwardedMessageIdsByGroupId(global, chatId, groupedId) {
    const chatMessages = selectChatMessages(global, chatId);
    if (!chatMessages) {
        return undefined;
    }
    return Object.values(chatMessages)
        .filter((message) => message.groupedId === groupedId && message.forwardInfo)
        .map(({ forwardInfo }) => forwardInfo.fromMessageId);
}
export function selectMessageIdsByGroupId(global, chatId, groupedId) {
    const chatMessages = selectChatMessages(global, chatId);
    if (!chatMessages) {
        return undefined;
    }
    return Object.keys(chatMessages)
        .map(Number)
        .filter((id) => chatMessages[id].groupedId === groupedId);
}
export function selectIsDocumentGroupSelected(global, chatId, groupedId, ...[tabId = getCurrentTabId()]) {
    const { messageIds: selectedIds } = selectTabState(global, tabId).selectedMessages || {};
    if (!selectedIds) {
        return false;
    }
    const groupIds = selectMessageIdsByGroupId(global, chatId, groupedId);
    return groupIds && groupIds.every((id) => selectedIds.includes(id));
}
export function selectSelectedMessagesCount(global, ...[tabId = getCurrentTabId()]) {
    const { messageIds } = selectTabState(global, tabId).selectedMessages || {};
    return messageIds ? messageIds.length : 0;
}
export function selectNewestMessageWithBotKeyboardButtons(global, chatId, threadId = MAIN_THREAD_ID, ...[tabId = getCurrentTabId()]) {
    const chat = selectChat(global, chatId);
    if (!chat) {
        return undefined;
    }
    const chatMessages = selectChatMessages(global, chatId);
    const viewportIds = selectViewportIds(global, chatId, threadId, tabId);
    if (!chatMessages || !viewportIds) {
        return undefined;
    }
    const messageId = findLast(viewportIds, (id) => {
        const message = chatMessages[id];
        return message && selectShouldDisplayReplyKeyboard(global, message);
    });
    const replyHideMessageId = findLast(viewportIds, (id) => {
        const message = chatMessages[id];
        return message && selectShouldHideReplyKeyboard(global, message);
    });
    if (messageId && replyHideMessageId && replyHideMessageId > messageId) {
        return undefined;
    }
    return messageId ? chatMessages[messageId] : undefined;
}
function selectShouldHideReplyKeyboard(global, message) {
    const { shouldHideKeyboardButtons, isHideKeyboardSelective, isMentioned, } = message;
    if (!shouldHideKeyboardButtons)
        return false;
    const replyToMessageId = getMessageReplyInfo(message)?.replyToMsgId;
    if (isHideKeyboardSelective) {
        if (isMentioned)
            return true;
        if (!replyToMessageId)
            return false;
        const replyMessage = selectChatMessage(global, message.chatId, replyToMessageId);
        return Boolean(replyMessage?.senderId === global.currentUserId);
    }
    return true;
}
function selectShouldDisplayReplyKeyboard(global, message) {
    const { keyboardButtons, shouldHideKeyboardButtons, isKeyboardSelective, isMentioned, } = message;
    if (!keyboardButtons || shouldHideKeyboardButtons)
        return false;
    const replyToMessageId = getMessageReplyInfo(message)?.replyToMsgId;
    if (isKeyboardSelective) {
        if (isMentioned)
            return true;
        if (!replyToMessageId)
            return false;
        const replyMessage = selectChatMessage(global, message.chatId, replyToMessageId);
        return Boolean(replyMessage?.senderId === global.currentUserId);
    }
    return true;
}
export function selectCanAutoLoadMedia(global, message) {
    const chat = selectChat(global, message.chatId);
    if (!chat) {
        return undefined;
    }
    const sender = 'id' in message ? selectSender(global, message) : undefined;
    const isPhoto = Boolean(getMessagePhoto(message) || getMessageWebPagePhoto(message));
    const isVideo = Boolean(getMessageVideo(message) || getMessageWebPageVideo(message));
    const isFile = Boolean(getMessageAudio(message) || getMessageVoice(message) || getMessageDocument(message));
    const { canAutoLoadPhotoFromContacts, canAutoLoadPhotoInPrivateChats, canAutoLoadPhotoInGroups, canAutoLoadPhotoInChannels, canAutoLoadVideoFromContacts, canAutoLoadVideoInPrivateChats, canAutoLoadVideoInGroups, canAutoLoadVideoInChannels, canAutoLoadFileFromContacts, canAutoLoadFileInPrivateChats, canAutoLoadFileInGroups, canAutoLoadFileInChannels, } = global.settings.byKey;
    if (isPhoto) {
        return canAutoLoadMedia({
            global,
            chat,
            sender,
            canAutoLoadMediaFromContacts: canAutoLoadPhotoFromContacts,
            canAutoLoadMediaInPrivateChats: canAutoLoadPhotoInPrivateChats,
            canAutoLoadMediaInGroups: canAutoLoadPhotoInGroups,
            canAutoLoadMediaInChannels: canAutoLoadPhotoInChannels,
        });
    }
    if (isVideo) {
        return canAutoLoadMedia({
            global,
            chat,
            sender,
            canAutoLoadMediaFromContacts: canAutoLoadVideoFromContacts,
            canAutoLoadMediaInPrivateChats: canAutoLoadVideoInPrivateChats,
            canAutoLoadMediaInGroups: canAutoLoadVideoInGroups,
            canAutoLoadMediaInChannels: canAutoLoadVideoInChannels,
        });
    }
    if (isFile) {
        return canAutoLoadMedia({
            global,
            chat,
            sender,
            canAutoLoadMediaFromContacts: canAutoLoadFileFromContacts,
            canAutoLoadMediaInPrivateChats: canAutoLoadFileInPrivateChats,
            canAutoLoadMediaInGroups: canAutoLoadFileInGroups,
            canAutoLoadMediaInChannels: canAutoLoadFileInChannels,
        });
    }
    return true;
}
function canAutoLoadMedia({ global, chat, sender, canAutoLoadMediaFromContacts, canAutoLoadMediaInPrivateChats, canAutoLoadMediaInGroups, canAutoLoadMediaInChannels, }) {
    const isMediaFromContact = Boolean(sender && (selectIsChatWithSelf(global, sender.id) || selectUser(global, sender.id)?.isContact));
    return Boolean((isMediaFromContact && canAutoLoadMediaFromContacts)
        || (!isMediaFromContact && canAutoLoadMediaInPrivateChats && isUserId(chat.id))
        || (canAutoLoadMediaInGroups && isChatGroup(chat))
        || (canAutoLoadMediaInChannels && isChatChannel(chat)));
}
export function selectLastServiceNotification(global) {
    const { serviceNotifications } = global;
    const maxId = Math.max(...serviceNotifications.map(({ id }) => id));
    return serviceNotifications.find(({ id, isDeleted }) => !isDeleted && id === maxId);
}
export function selectIsMessageProtected(global, message) {
    return Boolean(message && (message.isProtected || selectIsChatProtected(global, message.chatId) || hasMessageTtl(message)
        || getMessagePaidMedia(message)));
}
export function selectIsChatProtected(global, chatId) {
    return selectChat(global, chatId)?.isProtected || false;
}
export function selectHasProtectedMessage(global, chatId, messageIds) {
    if (selectChat(global, chatId)?.isProtected) {
        return true;
    }
    if (!messageIds) {
        return false;
    }
    const messages = selectChatMessages(global, chatId);
    return messageIds.some((messageId) => messages[messageId]?.isProtected);
}
export function selectCanForwardMessages(global, chatId, messageIds) {
    if (selectChat(global, chatId)?.isProtected) {
        return false;
    }
    if (!messageIds) {
        return false;
    }
    const messages = selectChatMessages(global, chatId);
    return messageIds
        .map((id) => messages[id])
        .every((message) => message && !hasMessageTtl(message)
        && (message.isForwardingAllowed || isServiceNotificationMessage(message)));
}
export function selectHasSvg(global, chatId, messageIds) {
    const messages = selectChatMessages(global, chatId);
    return messageIds
        .map((id) => messages[id])
        .some((message) => {
        if (!message)
            return false;
        const document = getMessageDocument(message);
        if (!document)
            return false;
        const extension = getDocumentExtension(document);
        if (!extension)
            return false;
        return SVG_EXTENSIONS.has(extension);
    });
}
export function selectSponsoredMessage(global, chatId) {
    const message = global.messages.sponsoredByChatId[chatId];
    return message && message.expiresAt >= Math.round(Date.now() / 1000) ? message : undefined;
}
export function selectDefaultReaction(global, chatId) {
    if (chatId === SERVICE_NOTIFICATIONS_USER_ID)
        return undefined;
    const isPrivate = isUserId(chatId);
    const defaultReaction = global.config?.defaultReaction;
    if (!defaultReaction) {
        return undefined;
    }
    if (isPrivate) {
        return defaultReaction;
    }
    const chatReactions = selectChatFullInfo(global, chatId)?.enabledReactions;
    if (!chatReactions || !canSendReaction(defaultReaction, chatReactions)) {
        return undefined;
    }
    return defaultReaction;
}
export function selectMaxUserReactions(global) {
    const isPremium = selectIsCurrentUserPremium(global);
    const { maxUserReactionsPremium = 3, maxUserReactionsDefault = 1 } = global.appConfig || {};
    return isPremium ? maxUserReactionsPremium : maxUserReactionsDefault;
}
// Slow, not to be used in `withGlobal`
export function selectVisibleUsers(global, ...[tabId = getCurrentTabId()]) {
    const { chatId, threadId } = selectCurrentMessageList(global, tabId) || {};
    if (!chatId || !threadId) {
        return undefined;
    }
    const messageIds = selectTabThreadParam(global, chatId, threadId, 'viewportIds', tabId);
    if (!messageIds) {
        return undefined;
    }
    return messageIds.map((messageId) => {
        const { senderId } = selectChatMessage(global, chatId, messageId) || {};
        return senderId ? selectUser(global, senderId) : undefined;
    }).filter(Boolean);
}
export function selectShouldSchedule(global, ...[tabId = getCurrentTabId()]) {
    return selectCurrentMessageList(global, tabId)?.type === 'scheduled';
}
export function selectCanSchedule(global, ...[tabId = getCurrentTabId()]) {
    const chatId = selectCurrentMessageList(global, tabId)?.chatId;
    const paidMessagesStars = chatId ? selectPeerPaidMessagesStars(global, chatId) : undefined;
    return !paidMessagesStars;
}
export function selectCanScheduleUntilOnline(global, id) {
    const isChatWithSelf = selectIsChatWithSelf(global, id);
    const chatBot = selectBot(global, id);
    const paidMessagesStars = selectPeerPaidMessagesStars(global, id);
    return Boolean(!paidMessagesStars
        && !isChatWithSelf && !chatBot && isUserId(id) && selectUserStatus(global, id)?.wasOnline);
}
export function selectCustomEmojis(message) {
    const entities = message.content.text?.entities;
    return entities?.filter((entity) => (entity.type === ApiMessageEntityTypes.CustomEmoji));
}
export function selectMessageCustomEmojiSets(global, message) {
    const customEmojis = selectCustomEmojis(message);
    if (!customEmojis)
        return MEMO_EMPTY_ARRAY;
    const documents = customEmojis.map((entity) => global.customEmojis.byId[entity.documentId]);
    // If some emoji still loading, do not return empty array
    if (!documents.every(Boolean))
        return undefined;
    const sets = documents.map((doc) => doc.stickerSetInfo);
    return sets.reduce((acc, set) => {
        if ('shortName' in set) {
            if (acc.some((s) => 'shortName' in s && s.shortName === set.shortName)) {
                return acc;
            }
        }
        if ('id' in set) {
            if (acc.some((s) => 'id' in s && s.id === set.id)) {
                return acc;
            }
        }
        acc.push(set); // Optimization
        return acc;
    }, []);
}
export function selectForwardsContainVoiceMessages(global, ...[tabId = getCurrentTabId()]) {
    const { messageIds, fromChatId } = selectTabState(global, tabId).forwardMessages;
    if (!messageIds)
        return false;
    const chatMessages = selectChatMessages(global, fromChatId);
    return messageIds.some((messageId) => {
        const message = chatMessages[messageId];
        return Boolean(message.content.voice) || Boolean(message.content.video?.isRound);
    });
}
export function selectChatTranslations(global, chatId) {
    return global.translations.byChatId[chatId];
}
export function selectMessageTranslations(global, chatId, toLanguageCode) {
    return selectChatTranslations(global, chatId)?.byLangCode[toLanguageCode] || {};
}
export function selectRequestedMessageTranslationLanguage(global, chatId, messageId, ...[tabId = getCurrentTabId()]) {
    const requestedInChat = selectTabState(global, tabId).requestedTranslations.byChatId[chatId];
    return requestedInChat?.toLanguage || requestedInChat?.manualMessages?.[messageId];
}
export function selectReplyCanBeSentToChat(global, toChatId, fromChatId, replyInfo) {
    if (!replyInfo.replyToMsgId)
        return false;
    const fromRealChatId = replyInfo?.replyToPeerId ?? fromChatId;
    if (toChatId === fromRealChatId)
        return true;
    const chatMessages = selectChatMessages(global, fromRealChatId);
    const message = chatMessages[replyInfo.replyToMsgId];
    return !isExpiredMessage(message);
}
export function selectForwardsCanBeSentToChat(global, toChatId, ...[tabId = getCurrentTabId()]) {
    const { messageIds, storyId, fromChatId } = selectTabState(global, tabId).forwardMessages;
    const chat = selectChat(global, toChatId);
    if ((!messageIds && !storyId) || !chat)
        return false;
    if (storyId) {
        return true;
    }
    const chatFullInfo = selectChatFullInfo(global, toChatId);
    const chatMessages = selectChatMessages(global, fromChatId);
    const isSavedMessages = toChatId ? selectIsChatWithSelf(global, toChatId) : undefined;
    const isChatWithBot = toChatId ? selectIsChatWithBot(global, chat) : undefined;
    const options = getAllowedAttachmentOptions(chat, chatFullInfo, isChatWithBot, isSavedMessages);
    return !messageIds.some((messageId) => сheckMessageSendingDenied(chatMessages[messageId], options));
}
function сheckMessageSendingDenied(message, options) {
    const isVoice = message.content.voice;
    const isRoundVideo = message.content.video?.isRound;
    const isPhoto = message.content.photo;
    const isGif = message.content.video?.isGif;
    const isVideo = message.content.video && !isRoundVideo && !isGif;
    const isAudio = message.content.audio;
    const isDocument = message.content.document;
    const isSticker = message.content.sticker;
    const isPlainText = message.content.text
        && !isVoice && !isRoundVideo && !isSticker && !isDocument && !isAudio && !isVideo && !isPhoto && !isGif;
    return (isVoice && !options.canSendVoices)
        || (isRoundVideo && !options.canSendRoundVideos)
        || (isSticker && !options.canSendStickers)
        || (isDocument && !options.canSendDocuments)
        || (isAudio && !options.canSendAudios)
        || (isVideo && !options.canSendVideos)
        || (isPhoto && !options.canSendPhotos)
        || (isGif && !options.canSendGifs)
        || (isPlainText && !options.canSendPlainText);
}
export function selectCanTranslateMessage(global, message, detectedLanguage, ...[tabId = getCurrentTabId()]) {
    const { canTranslate: isTranslationEnabled, doNotTranslate } = global.settings.byKey;
    const canTranslateLanguage = !detectedLanguage || !doNotTranslate.includes(detectedLanguage);
    const isTranslatable = isMessageTranslatable(message);
    // Separate translations are disabled when chat translation enabled
    const chatRequestedLanguage = selectRequestedChatTranslationLanguage(global, message.chatId, tabId);
    return IS_TRANSLATION_SUPPORTED && isTranslationEnabled && canTranslateLanguage && isTranslatable
        && !chatRequestedLanguage;
}
export function selectTopicLink(global, chatId, topicId) {
    const chat = selectChat(global, chatId);
    if (!chat || !chat?.isForum) {
        return undefined;
    }
    return getMessageLink(chat, topicId);
}
export function selectMessageReplyInfo(global, chatId, threadId, additionalReplyInfo) {
    const chat = selectChat(global, chatId);
    if (!chat)
        return undefined;
    const isMainThread = threadId === MAIN_THREAD_ID;
    if (!additionalReplyInfo && isMainThread)
        return undefined;
    const replyInfo = {
        type: 'message',
        ...additionalReplyInfo,
        replyToMsgId: additionalReplyInfo?.replyToMsgId || Number(threadId),
        replyToTopId: additionalReplyInfo?.replyToTopId || (!isMainThread ? Number(threadId) : undefined),
    };
    return replyInfo;
}
export function selectReplyMessage(global, message) {
    const { replyToMsgId, replyToPeerId } = getMessageReplyInfo(message) || {};
    const replyMessage = replyToMsgId
        ? selectChatMessage(global, replyToPeerId || message.chatId, replyToMsgId) : undefined;
    return replyMessage;
}
export function selectMessageTimestampableDuration(global, message, noReplies) {
    const replyMessage = !noReplies ? selectReplyMessage(global, message) : undefined;
    const timestampableMedia = getTimestampableMedia(message);
    const replyTimestampableMedia = replyMessage && getTimestampableMedia(replyMessage);
    return timestampableMedia?.duration || replyTimestampableMedia?.duration;
}
export function selectMessageLastPlaybackTimestamp(global, chatId, messageId) {
    return global.messages.playbackByChatId[chatId]?.byId[messageId];
}
