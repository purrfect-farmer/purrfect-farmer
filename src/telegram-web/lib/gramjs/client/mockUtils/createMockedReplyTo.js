import Api from '../../tl/api';
export default function createMockedReplyTo(chatId, messageId, mockData) {
    const msg = mockData.messages[chatId].find((message) => message.id === messageId);
    if (!msg)
        throw Error('No such message ' + messageId);
    const { replyToTopId, replyToMsgId, replyToForumTopic, } = msg;
    if (!replyToMsgId || !replyToTopId)
        return undefined;
    return new Api.MessageReplyHeader({
        replyToTopId,
        replyToMsgId,
        ...(replyToForumTopic && { forumTopic: replyToForumTopic }),
    });
}
