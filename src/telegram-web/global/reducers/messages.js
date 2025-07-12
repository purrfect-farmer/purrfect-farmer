import { MAIN_THREAD_ID } from '../../api/types';
import { IS_MOCKED_CLIENT, IS_TEST, MESSAGE_LIST_SLICE, MESSAGE_LIST_VIEWPORT_LIMIT, TMP_CHAT_ID, } from '../../config';
import { areDeepEqual } from '../../util/areDeepEqual';
import { addTimestampEntities } from '../../util/dates/timestamp';
import { getCurrentTabId } from '../../util/establishMultitabRole';
import { areSortedArraysEqual, excludeSortedArray, omit, omitUndefined, pick, pickTruthy, unique, } from '../../util/iteratees';
import { isLocalMessageId } from '../../util/keys/messageKey';
import { hasMessageTtl, isMediaLoadableInViewer, mergeIdRanges, orderHistoryIds, orderPinnedIds, } from '../helpers';
import { getEmojiOnlyCountForMessage } from '../helpers/getEmojiOnlyCountForMessage';
import { selectChatMessage, selectChatMessages, selectChatScheduledMessages, selectCurrentMessageIds, selectCurrentMessageList, selectListedIds, selectMessageIdsByGroupId, selectOutlyingLists, selectPinnedIds, selectPoll, selectQuickReplyMessage, selectScheduledIds, selectScheduledMessage, selectTabState, selectThreadIdFromMessage, selectThreadInfo, selectViewportIds, } from '../selectors';
import { removeIdFromSearchResults } from './middleSearch';
import { updateTabState } from './tabs';
import { clearMessageTranslation } from './translations';
export function updateCurrentMessageList(global, chatId, threadId = MAIN_THREAD_ID, type = 'thread', shouldReplaceHistory, shouldReplaceLast, ...[tabId = getCurrentTabId()]) {
    const { messageLists } = selectTabState(global, tabId);
    let newMessageLists = messageLists;
    if (shouldReplaceHistory || (IS_TEST && !IS_MOCKED_CLIENT)) {
        newMessageLists = chatId ? [{ chatId, threadId, type }] : [];
    }
    else if (chatId) {
        const current = messageLists[messageLists.length - 1];
        if (current?.chatId === chatId && current.threadId === threadId && current.type === type) {
            return global;
        }
        if (current && (current.chatId === TMP_CHAT_ID || shouldReplaceLast)) {
            newMessageLists = [...messageLists.slice(0, -1), { chatId, threadId, type }];
        }
        else {
            const previous = messageLists[messageLists.length - 2];
            if (previous?.chatId === chatId && previous.threadId === threadId && previous.type === type) {
                newMessageLists = messageLists.slice(0, -1);
            }
            else {
                newMessageLists = [...messageLists, { chatId, threadId, type }];
            }
        }
    }
    else {
        newMessageLists = messageLists.slice(0, -1);
    }
    return updateTabState(global, {
        messageLists: newMessageLists,
    }, tabId);
}
function replaceChatMessages(global, chatId, newById) {
    return updateMessageStore(global, chatId, {
        byId: newById,
    });
}
export function updateTabThread(global, chatId, threadId, threadUpdate, ...[tabId = getCurrentTabId()]) {
    const tabState = selectTabState(global, tabId);
    const current = tabState.tabThreads[chatId]?.[threadId] || {};
    return updateTabState(global, {
        tabThreads: {
            ...tabState.tabThreads,
            [chatId]: {
                ...tabState.tabThreads[chatId],
                [threadId]: {
                    ...current,
                    ...threadUpdate,
                },
            },
        },
    }, tabId);
}
export function updateThread(global, chatId, threadId, threadUpdate) {
    if (!threadUpdate) {
        return updateMessageStore(global, chatId, {
            threadsById: omit(global.messages.byChatId[chatId]?.threadsById, [threadId]),
        });
    }
    const current = global.messages.byChatId[chatId];
    return updateMessageStore(global, chatId, {
        threadsById: {
            ...(current?.threadsById),
            [threadId]: {
                ...(current?.threadsById[threadId]),
                ...threadUpdate,
            },
        },
    });
}
export function updateMessageStore(global, chatId, update) {
    const current = global.messages.byChatId[chatId] || { byId: {}, threadsById: {} };
    return {
        ...global,
        messages: {
            ...global.messages,
            byChatId: {
                ...global.messages.byChatId,
                [chatId]: {
                    ...current,
                    ...update,
                },
            },
        },
    };
}
export function replaceTabThreadParam(global, chatId, threadId, paramName, newValue, ...[tabId = getCurrentTabId()]) {
    if (paramName === 'viewportIds') {
        global = replaceThreadParam(global, chatId, threadId, 'lastViewportIds', newValue);
    }
    return updateTabThread(global, chatId, threadId, { [paramName]: newValue }, tabId);
}
export function replaceThreadParam(global, chatId, threadId, paramName, newValue) {
    return updateThread(global, chatId, threadId, { [paramName]: newValue });
}
export function addMessages(global, messages) {
    const addedByChatId = messages.reduce((messagesByChatId, message) => {
        if (!messagesByChatId[message.chatId]) {
            messagesByChatId[message.chatId] = {};
        }
        messagesByChatId[message.chatId][message.id] = message;
        return messagesByChatId;
    }, {});
    Object.keys(addedByChatId).forEach((chatId) => {
        global = addChatMessagesById(global, chatId, addedByChatId[chatId]);
    });
    return global;
}
export function replaceMessages(global, messages) {
    const updatedByChatId = messages.reduce((messagesByChatId, message) => {
        if (!messagesByChatId[message.chatId]) {
            messagesByChatId[message.chatId] = {};
        }
        messagesByChatId[message.chatId][message.id] = message;
        return messagesByChatId;
    }, {});
    Object.keys(updatedByChatId).forEach((chatId) => {
        const currentById = selectChatMessages(global, chatId) || {};
        const newById = {
            ...currentById,
            ...updatedByChatId[chatId],
        };
        global = replaceChatMessages(global, chatId, newById);
    });
    return global;
}
export function addChatMessagesById(global, chatId, newById) {
    const byId = selectChatMessages(global, chatId);
    if (byId && Object.keys(newById).every((newId) => Boolean(byId[Number(newId)]))) {
        return global;
    }
    return replaceChatMessages(global, chatId, {
        ...newById,
        ...byId,
    });
}
export function updateChatMessage(global, chatId, messageId, messageUpdate, withDeepCheck = false) {
    const byId = selectChatMessages(global, chatId) || {};
    const message = byId[messageId];
    if (withDeepCheck && message) {
        const updateKeys = Object.keys(messageUpdate);
        if (areDeepEqual(pick(message, updateKeys), messageUpdate)) {
            return global;
        }
    }
    if (message && messageUpdate.isMediaUnread === false && hasMessageTtl(message)) {
        if (message.content.voice) {
            messageUpdate.content = {
                action: {
                    mediaType: 'action',
                    type: 'expired',
                    isVoice: true,
                },
            };
        }
        else if (message.content.video?.isRound) {
            messageUpdate.content = {
                action: {
                    mediaType: 'action',
                    type: 'expired',
                    isRoundVideo: true,
                },
            };
        }
    }
    let emojiOnlyCount = message?.emojiOnlyCount;
    let text = message?.content?.text;
    if (messageUpdate.content) {
        emojiOnlyCount = getEmojiOnlyCountForMessage(messageUpdate.content, message?.groupedId || messageUpdate.groupedId);
        text = messageUpdate.content.text ? addTimestampEntities(messageUpdate.content.text) : text;
    }
    const updatedMessage = omitUndefined({
        ...message,
        ...messageUpdate,
        emojiOnlyCount,
        text,
    });
    if (!updatedMessage.id) {
        return global;
    }
    return replaceChatMessages(global, chatId, {
        ...byId,
        [messageId]: updatedMessage,
    });
}
export function updateScheduledMessage(global, chatId, messageId, messageUpdate) {
    const message = selectScheduledMessage(global, chatId, messageId);
    let emojiOnlyCount = message?.emojiOnlyCount;
    let text = message?.content?.text;
    if (messageUpdate.content) {
        emojiOnlyCount = getEmojiOnlyCountForMessage(messageUpdate.content, message?.groupedId || messageUpdate.groupedId);
        text = messageUpdate.content.text ? addTimestampEntities(messageUpdate.content.text) : text;
    }
    const updatedMessage = {
        ...message,
        ...messageUpdate,
        emojiOnlyCount,
        text,
    };
    if (!updatedMessage.id) {
        return global;
    }
    return updateScheduledMessages(global, chatId, {
        [messageId]: updatedMessage,
    });
}
export function updateQuickReplyMessage(global, messageId, messageUpdate) {
    const message = selectQuickReplyMessage(global, messageId);
    const updatedMessage = {
        ...message,
        ...messageUpdate,
    };
    if (!updatedMessage.id) {
        return global;
    }
    return updateQuickReplyMessages(global, {
        [messageId]: updatedMessage,
    });
}
export function deleteQuickReplyMessages(global, messageIds) {
    const byId = global.quickReplies.messagesById;
    const newById = omit(byId, messageIds);
    return {
        ...global,
        quickReplies: {
            ...global.quickReplies,
            messagesById: newById,
        },
    };
}
export function deleteChatMessages(global, chatId, messageIds) {
    const byId = selectChatMessages(global, chatId);
    if (!byId) {
        return global;
    }
    orderHistoryIds(messageIds);
    const updatedThreads = new Map();
    updatedThreads.set(MAIN_THREAD_ID, messageIds);
    const mediaIdsToRemove = [];
    messageIds.forEach((messageId) => {
        const message = byId[messageId];
        if (!message)
            return;
        if (isMediaLoadableInViewer(message)) {
            mediaIdsToRemove.push(messageId);
        }
        const threadId = selectThreadIdFromMessage(global, message);
        if (!threadId || threadId === MAIN_THREAD_ID) {
            return;
        }
        const threadMessages = updatedThreads.get(threadId) || [];
        threadMessages.push(messageId);
        updatedThreads.set(threadId, threadMessages);
        global = clearMessageTranslation(global, chatId, messageId);
    });
    const deletedForwardedPosts = Object.values(pickTruthy(byId, messageIds)).filter(({ forwardInfo }) => forwardInfo?.isLinkedChannelPost);
    updatedThreads.forEach((threadMessageIds, threadId) => {
        const threadInfo = selectThreadInfo(global, chatId, threadId);
        let listedIds = selectListedIds(global, chatId, threadId);
        let pinnedIds = selectPinnedIds(global, chatId, threadId);
        let outlyingLists = selectOutlyingLists(global, chatId, threadId);
        let newMessageCount = threadInfo?.messagesCount;
        if (listedIds) {
            listedIds = excludeSortedArray(listedIds, threadMessageIds);
        }
        if (outlyingLists) {
            outlyingLists = outlyingLists.map((list) => excludeSortedArray(list, threadMessageIds));
        }
        if (pinnedIds) {
            pinnedIds = excludeSortedArray(pinnedIds, orderPinnedIds(threadMessageIds));
        }
        const nonLocalMessageCount = threadMessageIds.filter((id) => !isLocalMessageId(id)).length;
        if (newMessageCount !== undefined) {
            newMessageCount -= nonLocalMessageCount;
        }
        Object.values(global.byTabId).forEach(({ id: tabId }) => {
            const tabState = selectTabState(global, tabId);
            const activeDownloadsInChat = Object.entries(tabState.activeDownloads).filter(([, { originChatId, originMessageId }]) => originChatId === chatId && originMessageId);
            activeDownloadsInChat.forEach(([mediaHash, context]) => {
                if (messageIds.includes(context.originMessageId)) {
                    global = cancelMessageMediaDownload(global, [mediaHash], tabId);
                }
            });
            mediaIdsToRemove.forEach((mediaId) => {
                global = removeIdFromSearchResults(global, chatId, threadId, mediaId, tabId);
            });
            const viewportIds = selectViewportIds(global, chatId, threadId, tabId);
            if (!viewportIds)
                return;
            const newViewportIds = excludeSortedArray(viewportIds, messageIds);
            global = replaceTabThreadParam(global, chatId, threadId, 'viewportIds', newViewportIds.length === 0 ? undefined : newViewportIds, tabId);
        });
        global = replaceThreadParam(global, chatId, threadId, 'listedIds', listedIds);
        global = replaceThreadParam(global, chatId, threadId, 'outlyingLists', outlyingLists);
        global = replaceThreadParam(global, chatId, threadId, 'pinnedIds', pinnedIds);
        if (threadInfo && newMessageCount !== undefined) {
            global = updateThreadInfo(global, chatId, threadId, {
                messagesCount: newMessageCount,
            });
        }
    });
    if (deletedForwardedPosts.length) {
        Object.values(global.byTabId).forEach(({ id: tabId }) => {
            const currentMessageList = selectCurrentMessageList(global, tabId);
            const canDeleteCurrentThread = currentMessageList && currentMessageList.chatId === chatId
                && currentMessageList.type === 'thread';
            const currentThreadId = currentMessageList?.threadId;
            deletedForwardedPosts.forEach((message) => {
                const { fromChatId, fromMessageId } = message.forwardInfo;
                const originalPost = selectChatMessage(global, fromChatId, fromMessageId);
                if (canDeleteCurrentThread && currentThreadId === message.id) {
                    global = updateCurrentMessageList(global, chatId, undefined, undefined, undefined, undefined, tabId);
                }
                if (originalPost) {
                    global = updateThread(global, fromChatId, fromMessageId, undefined);
                }
            });
        });
    }
    const newById = omit(byId, messageIds);
    global = replaceChatMessages(global, chatId, newById);
    return global;
}
export function deleteChatScheduledMessages(global, chatId, messageIds) {
    const byId = selectChatScheduledMessages(global, chatId);
    if (!byId) {
        return global;
    }
    const newById = omit(byId, messageIds);
    let scheduledIds = selectScheduledIds(global, chatId, MAIN_THREAD_ID);
    if (scheduledIds) {
        messageIds.forEach((messageId) => {
            if (scheduledIds.includes(messageId)) {
                scheduledIds = scheduledIds.filter((id) => id !== messageId);
            }
        });
        global = replaceThreadParam(global, chatId, MAIN_THREAD_ID, 'scheduledIds', scheduledIds);
        Object.entries(global.messages.byChatId[chatId].threadsById).forEach(([threadId, thread]) => {
            if (thread.scheduledIds) {
                const newScheduledIds = thread.scheduledIds.filter((id) => !messageIds.includes(id));
                global = replaceThreadParam(global, chatId, Number(threadId), 'scheduledIds', newScheduledIds);
            }
        });
    }
    global = {
        ...global,
        scheduledMessages: {
            byChatId: {
                ...global.scheduledMessages.byChatId,
                [chatId]: {
                    byId: newById,
                },
            },
        },
    };
    return global;
}
export function updateListedIds(global, chatId, threadId, idsUpdate) {
    const listedIds = selectListedIds(global, chatId, threadId);
    const newIds = listedIds?.length
        ? idsUpdate.filter((id) => !listedIds.includes(id))
        : idsUpdate;
    if (listedIds && !newIds.length) {
        return global;
    }
    return replaceThreadParam(global, chatId, threadId, 'listedIds', orderHistoryIds([
        ...(listedIds || []),
        ...newIds,
    ]));
}
export function removeOutlyingList(global, chatId, threadId, list) {
    const outlyingLists = selectOutlyingLists(global, chatId, threadId);
    if (!outlyingLists) {
        return global;
    }
    const newOutlyingLists = outlyingLists.filter((l) => l !== list);
    return replaceThreadParam(global, chatId, threadId, 'outlyingLists', newOutlyingLists);
}
export function updateOutlyingLists(global, chatId, threadId, idsUpdate) {
    if (!idsUpdate.length)
        return global;
    const outlyingLists = selectOutlyingLists(global, chatId, threadId);
    const newOutlyingLists = mergeIdRanges(outlyingLists || [], idsUpdate);
    return replaceThreadParam(global, chatId, threadId, 'outlyingLists', newOutlyingLists);
}
export function addViewportId(global, chatId, threadId, newId, ...[tabId = getCurrentTabId()]) {
    const viewportIds = selectViewportIds(global, chatId, threadId, tabId) || [];
    if (viewportIds.includes(newId)) {
        return global;
    }
    const newIds = orderHistoryIds([
        ...(viewportIds.length < MESSAGE_LIST_VIEWPORT_LIMIT
            ? viewportIds
            : viewportIds.slice(-(MESSAGE_LIST_SLICE / 2))),
        newId,
    ]);
    return replaceTabThreadParam(global, chatId, threadId, 'viewportIds', newIds, tabId);
}
export function safeReplaceViewportIds(global, chatId, threadId, newViewportIds, ...[tabId = getCurrentTabId()]) {
    const currentIds = selectViewportIds(global, chatId, threadId, tabId) || [];
    const newIds = orderHistoryIds(newViewportIds);
    return replaceTabThreadParam(global, chatId, threadId, 'viewportIds', areSortedArraysEqual(currentIds, newIds) ? currentIds : newIds, tabId);
}
export function safeReplacePinnedIds(global, chatId, threadId, newPinnedIds) {
    const currentIds = selectPinnedIds(global, chatId, threadId) || [];
    const newIds = orderPinnedIds(newPinnedIds);
    return replaceThreadParam(global, chatId, threadId, 'pinnedIds', areSortedArraysEqual(currentIds, newIds) ? currentIds : newIds);
}
export function updateThreadInfo(global, chatId, threadId, update, doNotUpdateLinked) {
    const newThreadInfo = {
        ...selectThreadInfo(global, chatId, threadId),
        ...update,
    };
    if (!doNotUpdateLinked && !newThreadInfo.isCommentsInfo) {
        const linkedUpdate = pick(newThreadInfo, ['messagesCount', 'lastMessageId', 'lastReadInboxMessageId']);
        if (newThreadInfo.fromChannelId && newThreadInfo.fromMessageId) {
            global = updateThreadInfo(global, newThreadInfo.fromChannelId, newThreadInfo.fromMessageId, linkedUpdate, true);
        }
    }
    return replaceThreadParam(global, chatId, threadId, 'threadInfo', newThreadInfo);
}
export function updateThreadInfos(global, updates) {
    updates.forEach((update) => {
        global = updateThreadInfo(global, update.isCommentsInfo ? update.originChannelId : update.chatId, update.isCommentsInfo ? update.originMessageId : update.threadId, update);
    });
    return global;
}
export function updateScheduledMessages(global, chatId, newById) {
    const current = global.scheduledMessages.byChatId[chatId] || { byId: {}, hash: 0 };
    return {
        ...global,
        scheduledMessages: {
            byChatId: {
                ...global.scheduledMessages.byChatId,
                [chatId]: {
                    ...current,
                    byId: {
                        ...current.byId,
                        ...newById,
                    },
                },
            },
        },
    };
}
export function updateQuickReplyMessages(global, update) {
    return {
        ...global,
        quickReplies: {
            ...global.quickReplies,
            messagesById: {
                ...global.quickReplies.messagesById,
                ...update,
            },
        },
    };
}
export function updateFocusedMessage({ global, chatId, messageId, threadId = MAIN_THREAD_ID, noHighlight = false, isResizingContainer = false, quote, quoteOffset, scrollTargetPosition, }, ...[tabId = getCurrentTabId()]) {
    return updateTabState(global, {
        focusedMessage: {
            ...selectTabState(global, tabId).focusedMessage,
            chatId,
            threadId,
            messageId,
            noHighlight,
            isResizingContainer,
            quote,
            quoteOffset,
            scrollTargetPosition,
        },
    }, tabId);
}
export function updateSponsoredMessage(global, chatId, message) {
    return {
        ...global,
        messages: {
            ...global.messages,
            sponsoredByChatId: {
                ...global.messages.sponsoredByChatId,
                [chatId]: message,
            },
        },
    };
}
export function deleteSponsoredMessage(global, chatId) {
    const byChatId = global.messages.sponsoredByChatId;
    if (!byChatId[chatId]) {
        return global;
    }
    return {
        ...global,
        messages: {
            ...global.messages,
            sponsoredByChatId: omit(byChatId, [chatId]),
        },
    };
}
export function updateFocusDirection(global, direction, ...[tabId = getCurrentTabId()]) {
    return updateTabState(global, {
        focusedMessage: {
            ...selectTabState(global, tabId).focusedMessage,
            direction,
        },
    }, tabId);
}
export function enterMessageSelectMode(global, chatId, messageId, ...[tabId = getCurrentTabId()]) {
    const messageIds = messageId ? Array.prototype.concat([], messageId) : [];
    return updateTabState(global, {
        selectedMessages: {
            chatId,
            messageIds,
        },
    }, tabId);
}
export function toggleMessageSelection(global, chatId, threadId, messageListType, messageId, groupedId, childMessageIds, withShift = false, ...[tabId = getCurrentTabId()]) {
    const { selectedMessages: oldSelectedMessages } = selectTabState(global, tabId);
    if (groupedId) {
        childMessageIds = selectMessageIdsByGroupId(global, chatId, groupedId);
    }
    const selectedMessageIds = childMessageIds || [messageId];
    if (!oldSelectedMessages) {
        return enterMessageSelectMode(global, chatId, selectedMessageIds, tabId);
    }
    const { messageIds } = oldSelectedMessages;
    let newMessageIds;
    const newSelectedMessageIds = selectedMessageIds.filter((id) => !messageIds.includes(id));
    if (newSelectedMessageIds && !newSelectedMessageIds.length) {
        newMessageIds = messageIds.filter((id) => !selectedMessageIds.includes(id));
    }
    else if (withShift && messageIds.length) {
        const viewportIds = selectCurrentMessageIds(global, chatId, threadId, messageListType, tabId);
        const prevIndex = viewportIds.indexOf(messageIds[messageIds.length - 1]);
        const currentIndex = viewportIds.indexOf(messageId);
        const from = Math.min(prevIndex, currentIndex);
        const to = Math.max(prevIndex, currentIndex);
        const slice = viewportIds.slice(from, to + 1);
        newMessageIds = unique([...messageIds, ...slice]);
    }
    else {
        newMessageIds = [...messageIds, ...newSelectedMessageIds];
    }
    if (!newMessageIds.length) {
        return exitMessageSelectMode(global, tabId);
    }
    return updateTabState(global, {
        selectedMessages: {
            ...oldSelectedMessages,
            messageIds: newMessageIds,
        },
    }, tabId);
}
export function exitMessageSelectMode(global, ...[tabId = getCurrentTabId()]) {
    return updateTabState(global, {
        selectedMessages: undefined,
    }, tabId);
}
export function updateThreadUnreadFromForwardedMessage(global, originMessage, chatId, lastMessageId, isDeleting) {
    const { channelPostId, fromChatId } = originMessage.forwardInfo || {};
    if (channelPostId && fromChatId) {
        const threadInfoOld = selectThreadInfo(global, chatId, channelPostId);
        if (threadInfoOld) {
            global = replaceThreadParam(global, chatId, channelPostId, 'threadInfo', {
                ...threadInfoOld,
                lastMessageId,
                messagesCount: (threadInfoOld.messagesCount || 0) + (isDeleting ? -1 : 1),
            });
        }
    }
    return global;
}
export function addActiveMediaDownload(global, mediaHash, metadata, ...[tabId = getCurrentTabId()]) {
    const tabState = selectTabState(global, tabId);
    global = updateTabState(global, {
        activeDownloads: {
            ...tabState.activeDownloads,
            [mediaHash]: metadata,
        },
    }, tabId);
    return global;
}
export function cancelMessageMediaDownload(global, mediaHashes, ...[tabId = getCurrentTabId()]) {
    const tabState = selectTabState(global, tabId);
    const newActiveDownloads = omit(tabState.activeDownloads, mediaHashes);
    global = updateTabState(global, {
        activeDownloads: newActiveDownloads,
    }, tabId);
    return global;
}
export function updateUploadByMessageKey(global, messageKey, progress) {
    return {
        ...global,
        fileUploads: {
            byMessageKey: progress !== undefined
                ? {
                    ...global.fileUploads.byMessageKey,
                    [messageKey]: { progress },
                }
                : omit(global.fileUploads.byMessageKey, [messageKey]),
        },
    };
}
export function updateQuickReplies(global, quickRepliesUpdate) {
    return {
        ...global,
        quickReplies: {
            ...global.quickReplies,
            byId: {
                ...global.quickReplies.byId,
                ...quickRepliesUpdate,
            },
        },
    };
}
export function deleteQuickReply(global, quickReplyId) {
    return {
        ...global,
        quickReplies: {
            ...global.quickReplies,
            byId: omit(global.quickReplies.byId, [quickReplyId]),
        },
    };
}
export function updatePoll(global, pollId, pollUpdate) {
    const poll = selectPoll(global, pollId);
    const oldResults = poll?.results;
    let newResults = oldResults || pollUpdate.results;
    if (poll && pollUpdate.results?.results) {
        if (!poll.results || !pollUpdate.results.isMin) {
            newResults = pollUpdate.results;
        }
        else if (oldResults.results) {
            // Update voters counts, but keep local `isChosen` values
            newResults = {
                ...pollUpdate.results,
                results: pollUpdate.results.results.map((result) => ({
                    ...result,
                    isChosen: oldResults.results.find((r) => r.option === result.option)?.isChosen,
                })),
                isMin: undefined,
            };
        }
    }
    const updatedPoll = {
        ...poll,
        ...pollUpdate,
        results: newResults,
    };
    if (!updatedPoll.id) {
        return global;
    }
    return {
        ...global,
        messages: {
            ...global.messages,
            pollById: {
                ...global.messages.pollById,
                [pollId]: updatedPoll,
            },
        },
    };
}
export function updatePollVote(global, pollId, peerId, options) {
    const poll = selectPoll(global, pollId);
    if (!poll) {
        return global;
    }
    const { recentVoterIds, totalVoters, results } = poll.results;
    const newRecentVoterIds = recentVoterIds ? [...recentVoterIds] : [];
    const newTotalVoters = totalVoters ? totalVoters + 1 : 1;
    const newResults = results ? [...results] : [];
    newRecentVoterIds.push(peerId);
    options.forEach((option) => {
        const targetOptionIndex = newResults.findIndex((result) => result.option === option);
        const targetOption = newResults[targetOptionIndex];
        const updatedOption = targetOption ? { ...targetOption } : { option, votersCount: 0 };
        updatedOption.votersCount += 1;
        if (peerId === global.currentUserId) {
            updatedOption.isChosen = true;
        }
        if (targetOptionIndex) {
            newResults[targetOptionIndex] = updatedOption;
        }
        else {
            newResults.push(updatedOption);
        }
    });
    return updatePoll(global, pollId, {
        results: {
            ...poll.results,
            recentVoterIds: newRecentVoterIds,
            totalVoters: newTotalVoters,
            results: newResults,
        },
    });
}
