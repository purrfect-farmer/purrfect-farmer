import Api from '../../tl/api';
export default function createMockedChatAdminRights(chatId, mockData) {
    const channel = mockData.channels.find((channel) => channel.id === chatId);
    if (!channel)
        throw Error('No such channel ' + chatId);
    const { adminRights, } = channel;
    return new Api.ChatAdminRights({
        ...adminRights,
    });
}
