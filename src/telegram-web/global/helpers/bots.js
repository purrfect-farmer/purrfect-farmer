import { REPLIES_USER_ID, VERIFICATION_CODES_USER_ID } from '../../config';
export function getBotCoverMediaHash(photo) {
    return `photo${photo.id}?size=x`;
}
export function convertToApiChatType(type) {
    if (type === 'channels')
        return 'channels';
    if (type === 'chats' || type === 'groups')
        return 'chats';
    if (type === 'users')
        return 'users';
    if (type === 'bots')
        return 'bots';
    return undefined;
}
export function getWebAppKey(webApp) {
    if (webApp.requestUrl)
        return webApp.requestUrl;
    if (webApp.appName)
        return `${webApp.botId}?appName=${webApp.appName}`;
    return webApp.botId;
}
export function isSystemBot(botId) {
    return botId === REPLIES_USER_ID || botId === VERIFICATION_CODES_USER_ID;
}
