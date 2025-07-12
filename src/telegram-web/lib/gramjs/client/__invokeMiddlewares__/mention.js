import Api from '../../tl/api';
import createMockedMessage from '../mockUtils/createMockedMessage';
export default function (mockClient, request) {
    if (request instanceof Api.messages.GetUnreadMentions) {
        return new Api.messages.Messages({
            messages: [
                createMockedMessage('2', 13, mockClient.mockData),
            ],
            chats: [],
            users: [],
        });
    }
    return 'pass';
}
