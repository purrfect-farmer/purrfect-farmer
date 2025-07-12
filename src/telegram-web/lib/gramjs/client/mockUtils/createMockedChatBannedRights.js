import Api from '../../tl/api';
export default function createMockedChatBannedRights(chatId, mockData) {
    const channel = mockData.channels.find((channel) => channel.id === chatId);
    if (!channel)
        throw Error('No such channel ' + chatId);
    const { bannedRights, } = channel;
    return new Api.ChatBannedRights({
        ...bannedRights,
        untilDate: 0,
    });
}
