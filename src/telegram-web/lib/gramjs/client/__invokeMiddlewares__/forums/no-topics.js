import Api from '../../../tl/api';
export default async function (mockClient, request) {
    if (request instanceof Api.channels.GetForumTopics) {
        await new Promise((resolve) => setTimeout(resolve, 2500));
    }
    return 'pass';
}
