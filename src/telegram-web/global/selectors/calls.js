import { getMainUsername, isChatBasicGroup } from '../helpers';
import { selectChat, selectChatFullInfo } from './chats';
import { selectUser } from './users';
export function selectChatGroupCall(global, chatId) {
    const fullInfo = selectChatFullInfo(global, chatId);
    if (!fullInfo || !fullInfo.groupCallId)
        return undefined;
    return selectGroupCall(global, fullInfo.groupCallId);
}
export function selectGroupCall(global, groupCallId) {
    return global.groupCalls.byId[groupCallId];
}
export function selectGroupCallParticipant(global, groupCallId, participantId) {
    return selectGroupCall(global, groupCallId)?.participants[participantId];
}
export function selectIsAdminInActiveGroupCall(global) {
    const chatId = selectActiveGroupCall(global)?.chatId;
    if (!chatId)
        return false;
    const chat = selectChat(global, chatId);
    if (!chat)
        return false;
    return (isChatBasicGroup(chat) && chat.isCreator) || Boolean(chat.adminRights?.manageCall);
}
export function selectActiveGroupCall(global) {
    const { groupCalls: { activeGroupCallId } } = global;
    if (!activeGroupCallId) {
        return undefined;
    }
    return selectGroupCall(global, activeGroupCallId);
}
export function selectPhoneCallUser(global) {
    const { phoneCall, currentUserId } = global;
    if (!phoneCall || !phoneCall.participantId || !phoneCall.adminId) {
        return undefined;
    }
    const id = phoneCall.adminId === currentUserId ? phoneCall.participantId : phoneCall.adminId;
    return selectUser(global, id);
}
export function selectCanInviteToActiveGroupCall(global) {
    const groupCall = selectActiveGroupCall(global);
    if (!groupCall || !groupCall.chatId) {
        return false;
    }
    const chat = selectChat(global, groupCall.chatId);
    if (!chat) {
        return false;
    }
    const hasPublicUsername = Boolean(getMainUsername(chat));
    if (hasPublicUsername) {
        return true;
    }
    const inviteLink = selectChatFullInfo(global, chat.id)?.inviteLink;
    return Boolean(inviteLink);
}
