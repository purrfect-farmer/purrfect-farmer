import { omit } from '../../util/iteratees';
import { selectChat } from '../selectors';
import { selectGroupCall } from '../selectors/calls';
import { updateChatFullInfo } from './chats';
export function updateGroupCall(global, groupCallId, groupCallUpdate, addToParticipantCount, resetParticipantCount) {
    const unfiltered = Object.values({
        ...global.groupCalls.byId[groupCallId]?.participants,
        ...groupCallUpdate.participants,
    });
    const filtered = unfiltered.filter(({ isLeft }) => !isLeft);
    const participants = filtered.reduce((acc, el) => {
        acc[el.id] = el;
        return acc;
    }, {});
    return {
        ...global,
        groupCalls: {
            ...global.groupCalls,
            byId: {
                ...global.groupCalls.byId,
                [groupCallId]: {
                    ...global.groupCalls.byId[groupCallId],
                    ...omit(groupCallUpdate, ['participantsCount']),
                    ...(addToParticipantCount && {
                        participantsCount: global.groupCalls.byId[groupCallId].participantsCount + addToParticipantCount,
                    }),
                    ...(resetParticipantCount !== undefined && {
                        participantsCount: resetParticipantCount,
                    }),
                    participants,
                },
            },
        },
    };
}
export function removeGroupCall(global, groupCallId) {
    const groupCall = selectGroupCall(global, groupCallId);
    if (groupCall && groupCall.chatId) {
        const chat = selectChat(global, groupCall.chatId);
        if (chat) {
            global = updateChatFullInfo(global, groupCall.chatId, {
                groupCallId: undefined,
            });
        }
    }
    return {
        ...global,
        groupCalls: {
            ...global.groupCalls,
            byId: {
                ...omit(global.groupCalls.byId, [groupCallId.toString()]),
            },
        },
    };
}
export function updateActiveGroupCall(global, groupCallUpdate, resetParticipantCount) {
    if (!global.groupCalls.activeGroupCallId) {
        return global;
    }
    return updateGroupCall(global, global.groupCalls.activeGroupCallId, groupCallUpdate, undefined, resetParticipantCount);
}
export function updateGroupCallParticipant(global, groupCallId, userId, participantUpdate, noUpdateCount = false) {
    const groupCall = selectGroupCall(global, groupCallId);
    if (!groupCall) {
        return global;
    }
    return updateGroupCall(global, groupCallId, {
        participants: {
            ...groupCall.participants,
            [userId]: {
                ...groupCall.participants[userId],
                ...participantUpdate,
            },
        },
    }, participantUpdate.isLeft
        ? (noUpdateCount ? 0 : -1)
        : (groupCall.participants[userId] || noUpdateCount ? 0 : 1));
}
