import { isActionMessage } from '../../../global/helpers';
import { getDayStartAt } from '../../../util/dates/dateFormat';
const GROUP_INTERVAL_SECONDS = 600; // 10 minutes
export function isAlbum(messageOrAlbum) {
    return 'albumId' in messageOrAlbum;
}
export function groupMessages(messages, firstUnreadId, topMessageId, isChatWithSelf, withUsers) {
    const initDateGroup = {
        originalDate: messages[0].date,
        datetime: getDayStartAt(messages[0].date * 1000),
        senderGroups: [[]],
    };
    let currentAlbum;
    const dateGroups = [initDateGroup];
    messages.forEach((message, index) => {
        const currentDateGroup = dateGroups[dateGroups.length - 1];
        const currentSenderGroup = currentDateGroup.senderGroups[currentDateGroup.senderGroups.length - 1];
        if (message.isInAlbum) {
            if (!currentAlbum) {
                currentAlbum = {
                    albumId: message.groupedId,
                    messages: [message],
                    mainMessage: message,
                    hasMultipleCaptions: false,
                };
            }
            else {
                currentAlbum.messages.push(message);
                if (message.hasComments) {
                    currentAlbum.commentsMessage = message;
                }
                if (message.content.text && !currentAlbum.hasMultipleCaptions) {
                    if (currentAlbum.captionMessage) {
                        currentAlbum.hasMultipleCaptions = true;
                        currentAlbum.captionMessage = undefined;
                    }
                    else {
                        currentAlbum.captionMessage = message;
                    }
                }
            }
        }
        else if ((message.content.paidMedia?.extendedMedia.length || 0) > 1) {
            currentSenderGroup.push({
                albumId: `paid-${message.id}`,
                messages: [message],
                mainMessage: message,
                hasMultipleCaptions: false,
                isPaidMedia: true,
            });
        }
        else {
            currentSenderGroup.push(message);
        }
        const nextMessage = messages[index + 1];
        if (currentAlbum
            && (!nextMessage || !nextMessage.groupedId || nextMessage.groupedId !== currentAlbum.albumId)) {
            currentSenderGroup.push(currentAlbum);
            currentAlbum = undefined;
        }
        const lastMessageInSenderGroup = currentSenderGroup[currentSenderGroup.length - 1];
        if (nextMessage && !currentAlbum) {
            const nextMessageDayStartsAt = getDayStartAt(nextMessage.date * 1000);
            if (currentDateGroup.datetime !== nextMessageDayStartsAt) {
                const newDateGroup = {
                    originalDate: nextMessage.date,
                    datetime: nextMessageDayStartsAt,
                    senderGroups: [[]],
                };
                dateGroups.push(newDateGroup);
            }
            else if (nextMessage.id === firstUnreadId
                || message.senderId !== nextMessage.senderId
                || (!withUsers && message.paidMessageStars)
                || message.isOutgoing !== nextMessage.isOutgoing
                || message.postAuthorTitle !== nextMessage.postAuthorTitle
                || (isActionMessage(message) && message.content.action?.type !== 'phoneCall')
                || (isActionMessage(nextMessage) && nextMessage.content.action?.type !== 'phoneCall')
                || message.inlineButtons
                || nextMessage.inlineButtons
                || (nextMessage.date - message.date) > GROUP_INTERVAL_SECONDS
                || (topMessageId
                    && (message.id === topMessageId
                        || (lastMessageInSenderGroup
                            && 'mainMessage' in lastMessageInSenderGroup
                            && lastMessageInSenderGroup.mainMessage?.id === topMessageId))
                    && nextMessage.id !== topMessageId)
                || (isChatWithSelf && message.forwardInfo?.fromId !== nextMessage.forwardInfo?.fromId)) {
                currentDateGroup.senderGroups.push([]);
            }
        }
    });
    return dateGroups;
}
