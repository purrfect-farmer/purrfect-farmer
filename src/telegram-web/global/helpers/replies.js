export function getMessageReplyInfo(message) {
    const { replyInfo } = message;
    if (!replyInfo || replyInfo.type !== 'message')
        return undefined;
    return replyInfo;
}
export function getStoryReplyInfo(message) {
    const { replyInfo } = message;
    if (!replyInfo || replyInfo.type !== 'story')
        return undefined;
    return replyInfo;
}
