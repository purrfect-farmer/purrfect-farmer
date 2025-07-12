import BigInt from 'big-integer';
import Api from '../../tl/api';
export default function createMockedTypeInputPeer(id, mockData) {
    const user = mockData.users.find((user) => user.id === id);
    if (user) {
        return new Api.InputPeerUser({
            userId: BigInt(id),
            accessHash: BigInt(1),
        });
    }
    const chat = mockData.chats.find((chat) => chat.id === id);
    if (chat) {
        return new Api.InputPeerChat({
            chatId: BigInt(id),
        });
    }
    const channel = mockData.channels.find((channel) => channel.id === id);
    if (channel) {
        return new Api.InputPeerChannel({
            channelId: BigInt(Number(id) + 1000000000),
            accessHash: BigInt(1),
        });
    }
    throw Error('No such peer ' + id);
}
