import { MAX_INT_32 } from '../../config';
import { getServerTime } from '../../util/serverTime';
const unmuteTimers = new Map();
const unmuteQueue = [];
const scheduleUnmute = (item, onUpdate) => {
    const id = item.topicId ? `${item.chatId}-${item.topicId}` : item.chatId;
    if (unmuteTimers.has(id)) {
        clearTimeout(unmuteTimers.get(id));
        unmuteTimers.delete(id);
    }
    if (item.mutedUntil === MAX_INT_32 || item.mutedUntil <= getServerTime())
        return;
    unmuteQueue.push(item);
    unmuteQueue.sort((a, b) => b.mutedUntil - a.mutedUntil);
    const next = unmuteQueue.pop();
    if (!next)
        return;
    const timer = setTimeout(() => {
        onUpdate();
        if (unmuteQueue.length) {
            const afterNext = unmuteQueue.pop();
            if (afterNext)
                scheduleUnmute(afterNext, onUpdate);
        }
    }, (item.mutedUntil - getServerTime()) * 1000);
    unmuteTimers.set(id, timer);
};
export function scheduleMutedChatUpdate(chatId, mutedUntil = 0, onUpdate) {
    scheduleUnmute({
        chatId,
        mutedUntil,
    }, () => onUpdate({
        '@type': 'updateChatNotifySettings',
        chatId,
        settings: {
            mutedUntil: 0,
        },
    }));
}
export function scheduleMutedTopicUpdate(chatId, topicId, mutedUntil = 0, onUpdate) {
    scheduleUnmute({
        chatId,
        topicId,
        mutedUntil,
    }, () => onUpdate({
        '@type': 'updateTopicNotifySettings',
        chatId,
        topicId,
        settings: {
            mutedUntil: 0,
        },
    }));
}
