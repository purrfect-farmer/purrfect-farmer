import { getActions } from '../../../../global';
import { MAIN_THREAD_ID } from '../../../../api/types';
import { MediaViewerOrigin } from '../../../../types';
import { getMessagePhoto, getMessageWebPagePhoto } from '../../../../global/helpers';
import { getMessageReplyInfo } from '../../../../global/helpers/replies';
import { tryParseDeepLink } from '../../../../util/deepLinkParser';
import useLastCallback from '../../../../hooks/useLastCallback';
export default function useInnerHandlers({ lang, selectMessage, message, chatId, threadId, isInDocumentGroup, asForwarded, isScheduled, album, senderPeer, botSender, messageTopic, isTranslatingChat, story, isReplyPrivate, isRepliesChat, isSavedMessages, lastPlaybackTimestamp, }) {
    const { openChat, showNotification, focusMessage, openMediaViewer, openAudioPlayer, markMessagesRead, cancelUploadMedia, sendPollVote, openForwardMenu, openChatLanguageModal, openThread, openStoryViewer, searchChatMediaMessages, } = getActions();
    const { id: messageId, forwardInfo, groupedId, content: { paidMedia, video, webPage }, } = message;
    const { replyToMsgId, replyToPeerId, replyToTopId, isQuote, quoteText, quoteOffset, } = getMessageReplyInfo(message) || {};
    const handleSenderClick = useLastCallback(() => {
        if (!senderPeer) {
            showNotification({ message: lang('HidAccount') });
            return;
        }
        if (asForwarded && forwardInfo?.channelPostId) {
            focusMessage({ chatId: senderPeer.id, messageId: forwardInfo.channelPostId });
        }
        else {
            openChat({ id: senderPeer.id });
        }
    });
    const handleViaBotClick = useLastCallback(() => {
        if (!botSender) {
            return;
        }
        openChat({ id: botSender.id });
    });
    const handleReplyClick = useLastCallback(() => {
        if (!replyToMsgId || isReplyPrivate) {
            showNotification({
                message: isQuote ? lang('QuotePrivate') : lang('ReplyPrivate'),
            });
            return;
        }
        if (isRepliesChat && replyToPeerId && replyToTopId) {
            openThread({
                isComments: true,
                originChannelId: replyToPeerId,
                originMessageId: replyToTopId,
                focusMessageId: replyToMsgId,
            });
            return;
        }
        focusMessage({
            chatId: replyToPeerId || chatId,
            threadId: isRepliesChat ? replyToTopId : threadId, // Open comments from Replies bot, otherwise, keep current thread
            messageId: replyToMsgId,
            replyMessageId: replyToPeerId ? undefined : messageId,
            noForumTopicPanel: !replyToPeerId, // Open topic panel for cross-chat replies
            ...(isQuote && { quote: quoteText?.text, quoteOffset }),
        });
    });
    const handleDocumentClick = useLastCallback(() => {
        openMediaViewer({
            chatId,
            threadId,
            messageId,
            origin: isScheduled ? MediaViewerOrigin.ScheduledInline : MediaViewerOrigin.Inline,
        });
    });
    const openMediaViewerWithPhotoOrVideo = useLastCallback((withDynamicLoading) => {
        if (paidMedia && !paidMedia.isBought)
            return;
        if (withDynamicLoading) {
            searchChatMediaMessages({ chatId, threadId, currentMediaMessageId: messageId });
        }
        const parsedLink = webPage?.url && tryParseDeepLink(webPage.url);
        const videoContent = video || webPage?.video;
        const webpageTimestamp = parsedLink && 'timestamp' in parsedLink ? parsedLink.timestamp : undefined;
        openMediaViewer({
            chatId,
            threadId,
            messageId,
            origin: isScheduled ? MediaViewerOrigin.ScheduledInline : MediaViewerOrigin.Inline,
            timestamp: lastPlaybackTimestamp || videoContent?.timestamp || webpageTimestamp,
            withDynamicLoading,
        });
    });
    const handlePhotoMediaClick = useLastCallback(() => {
        const withDynamicLoading = !isScheduled && !paidMedia;
        openMediaViewerWithPhotoOrVideo(withDynamicLoading);
    });
    const handleVideoMediaClick = useLastCallback(() => {
        const isGif = message.content?.video?.isGif;
        const withDynamicLoading = !isGif && !isScheduled && !paidMedia;
        openMediaViewerWithPhotoOrVideo(withDynamicLoading);
    });
    const handleMediaClick = useLastCallback(() => {
        const photo = getMessagePhoto(message) || getMessageWebPagePhoto(message);
        if (photo) {
            handlePhotoMediaClick();
        }
        handleVideoMediaClick();
    });
    const handleAudioPlay = useLastCallback(() => {
        openAudioPlayer({ chatId, messageId });
    });
    const handleAlbumMediaClick = useLastCallback((albumMessageId, albumIndex) => {
        if (paidMedia && !paidMedia.isBought)
            return;
        searchChatMediaMessages({ chatId, threadId, currentMediaMessageId: messageId });
        openMediaViewer({
            chatId,
            threadId,
            messageId: albumMessageId,
            mediaIndex: albumIndex,
            origin: isScheduled ? MediaViewerOrigin.ScheduledAlbum : MediaViewerOrigin.Album,
            withDynamicLoading: !paidMedia,
        });
    });
    const handleReadMedia = useLastCallback(() => {
        markMessagesRead({ messageIds: [messageId] });
    });
    const handleCancelUpload = useLastCallback(() => {
        cancelUploadMedia({ chatId, messageId });
    });
    const handleVoteSend = useLastCallback((options) => {
        sendPollVote({ chatId, messageId, options });
    });
    const handleGroupForward = useLastCallback(() => {
        openForwardMenu({ fromChatId: chatId, groupedId });
    });
    const handleForward = useLastCallback(() => {
        if (album && album.messages) {
            const messageIds = album.messages.map(({ id }) => id);
            openForwardMenu({ fromChatId: chatId, messageIds });
        }
        else {
            openForwardMenu({ fromChatId: chatId, messageIds: [messageId] });
        }
    });
    const handleFocus = useLastCallback(() => {
        focusMessage({
            chatId, threadId: MAIN_THREAD_ID, messageId,
        });
    });
    const handleFocusForwarded = useLastCallback(() => {
        const originalChatId = (isSavedMessages && forwardInfo.savedFromPeerId) || forwardInfo.fromChatId;
        if (isInDocumentGroup) {
            focusMessage({
                chatId: originalChatId, groupedId, groupedChatId: chatId, messageId: forwardInfo.fromMessageId,
            });
            return;
        }
        if (replyToPeerId && replyToTopId) {
            if (isRepliesChat) {
                openThread({
                    isComments: true,
                    originChannelId: replyToPeerId,
                    originMessageId: replyToTopId,
                    focusMessageId: forwardInfo.fromMessageId,
                });
            }
            else {
                focusMessage({
                    chatId: replyToPeerId,
                    threadId: replyToTopId,
                    messageId: forwardInfo.fromMessageId,
                });
            }
        }
        else {
            focusMessage({
                chatId: originalChatId, messageId: forwardInfo.fromMessageId,
            });
        }
    });
    const selectWithGroupedId = useLastCallback((e) => {
        e.stopPropagation();
        selectMessage(e, groupedId);
    });
    const handleTranslationClick = useLastCallback((e) => {
        e.stopPropagation();
        openChatLanguageModal({ chatId, messageId: !isTranslatingChat ? messageId : undefined });
    });
    const handleOpenThread = useLastCallback(() => {
        openThread({
            chatId: message.chatId,
            threadId: message.id,
        });
    });
    const handleTopicChipClick = useLastCallback(() => {
        if (!messageTopic)
            return;
        focusMessage({
            chatId: replyToPeerId || chatId,
            threadId: messageTopic.id,
            messageId,
        });
    });
    const handleStoryClick = useLastCallback(() => {
        if (!story)
            return;
        openStoryViewer({
            peerId: story.peerId,
            storyId: story.id,
            isSingleStory: true,
        });
    });
    return {
        handleSenderClick,
        handleViaBotClick,
        handleReplyClick,
        handleDocumentClick,
        handleMediaClick,
        handleAudioPlay,
        handleAlbumMediaClick,
        handlePhotoMediaClick,
        handleVideoMediaClick,
        handleMetaClick: selectWithGroupedId,
        handleTranslationClick,
        handleOpenThread,
        handleReadMedia,
        handleCancelUpload,
        handleVoteSend,
        handleGroupForward,
        handleForward,
        handleFocus,
        handleFocusForwarded,
        handleDocumentGroupSelectAll: selectWithGroupedId,
        handleTopicChipClick,
        handleStoryClick,
    };
}
