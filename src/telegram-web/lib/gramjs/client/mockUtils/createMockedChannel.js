import BigInt from 'big-integer';
import Api from '../../tl/api';
import createMockedChatAdminRights from './createMockedChatAdminRights';
import createMockedChatBannedRights from './createMockedChatBannedRights';
import { MOCK_STARTING_DATE } from './MockTypes';
export default function createMockedChannel(id, mockData) {
    const channel = mockData.channels.find((channel) => channel.id === id);
    if (!channel)
        throw Error('No such channel ' + id);
    const { accessHash = BigInt(1), title = 'Channel', date = MOCK_STARTING_DATE, bannedRights = createMockedChatBannedRights(id, mockData), adminRights = createMockedChatAdminRights(id, mockData), ...rest } = channel;
    return new Api.Channel({
        ...rest,
        id: BigInt(Number(id) + 1000000000),
        accessHash,
        title,
        bannedRights,
        adminRights,
        photo: new Api.ChatPhotoEmpty(),
        date,
    });
}
