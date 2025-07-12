import { getChatTitle, isChatGroup, } from '../../../../global/helpers';
import { getPeerTitle } from '../../../../global/helpers/peers';
import { isUserId } from '../../../../util/entities/ids';
export function getSenderName(lang, message, chatsById, usersById) {
    const { senderId } = message;
    if (!senderId) {
        return undefined;
    }
    const sender = isUserId(senderId) ? usersById[senderId] : chatsById[senderId];
    let senderName = getPeerTitle(lang, sender);
    const chat = chatsById[message.chatId];
    if (chat) {
        if ('isSelf' in sender && sender.isSelf) {
            senderName = `${lang('FromYou')} → ${getChatTitle(lang, chat)}`;
        }
        else if (isChatGroup(chat)) {
            senderName += ` → ${getChatTitle(lang, chat)}`;
        }
    }
    return senderName;
}
