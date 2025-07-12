import { useEffect, useSignal } from '../../../lib/teact/teact';
import { getGlobal } from '../../../global';
import { selectFocusedMessageId, selectListedIds, selectOutlyingListByMessageId } from '../../../global/selectors';
import cycleRestrict from '../../../util/cycleRestrict';
import { unique } from '../../../util/iteratees';
import useDerivedSignal from '../../../hooks/useDerivedSignal';
import useLastCallback from '../../../hooks/useLastCallback';
let viewportPinnedIds;
let lastFocusedId;
export default function usePinnedMessage(chatId, threadId, pinnedIds) {
    const [getPinnedIndexByKey, setPinnedIndexByKey] = useSignal({});
    const [getLoadingPinnedId, setLoadingPinnedId] = useSignal();
    const key = chatId ? `${chatId}_${threadId}` : undefined;
    const getCurrentPinnedIndex = useDerivedSignal(() => (getPinnedIndexByKey()[key] ?? 0), [getPinnedIndexByKey, key]);
    // Reset when switching chat
    useEffect(() => {
        viewportPinnedIds = undefined;
        setLoadingPinnedId(undefined);
    }, [
        chatId, setPinnedIndexByKey, setLoadingPinnedId, threadId,
    ]);
    useEffect(() => {
        if (!key)
            return;
        const currentPinnedIndex = getPinnedIndexByKey()[key];
        const pinnedLength = pinnedIds?.length || 0;
        if (currentPinnedIndex >= pinnedLength) {
            setPinnedIndexByKey({
                ...getPinnedIndexByKey(),
                [key]: clampIndex(pinnedLength - 1),
            });
        }
    }, [getPinnedIndexByKey, key, pinnedIds?.length, setPinnedIndexByKey]);
    const handleIntersectPinnedMessage = useLastCallback(({ viewportPinnedIdsToAdd = [], viewportPinnedIdsToRemove = [], shouldCancelWaiting, }) => {
        if (!chatId || !threadId || !key || !pinnedIds?.length)
            return;
        if (shouldCancelWaiting) {
            lastFocusedId = undefined;
            setLoadingPinnedId(undefined);
            return;
        }
        const loadingPinnedId = getLoadingPinnedId();
        if (loadingPinnedId) {
            const newPinnedIndex = pinnedIds.indexOf(loadingPinnedId);
            setPinnedIndexByKey({
                ...getPinnedIndexByKey(),
                [key]: clampIndex(newPinnedIndex),
            });
            setLoadingPinnedId(undefined);
        }
        viewportPinnedIds = unique((viewportPinnedIds?.filter((id) => !viewportPinnedIdsToRemove.includes(id)) ?? [])
            .concat(viewportPinnedIdsToAdd));
        // Sometimes this callback is called after focus has been reset in global, so we leverage `lastFocusedId`
        const focusedMessageId = selectFocusedMessageId(getGlobal(), chatId) || lastFocusedId;
        if (lastFocusedId && viewportPinnedIds.includes(lastFocusedId)) {
            lastFocusedId = undefined;
        }
        if (focusedMessageId) {
            const pinnedIndexAboveFocused = pinnedIds.findIndex((id) => id < focusedMessageId);
            setPinnedIndexByKey({
                ...getPinnedIndexByKey(),
                [key]: clampIndex(pinnedIndexAboveFocused),
            });
        }
        else if (viewportPinnedIds.length) {
            const maxViewportPinnedId = Math.max(...viewportPinnedIds);
            const newIndex = pinnedIds.indexOf(maxViewportPinnedId);
            setPinnedIndexByKey({
                ...getPinnedIndexByKey(),
                [key]: clampIndex(newIndex),
            });
        }
    });
    const handleFocusPinnedMessage = useLastCallback((messageId) => {
        // Focusing on a post in comments
        if (!chatId || !threadId || !pinnedIds?.length) {
            return;
        }
        lastFocusedId = messageId;
        const global = getGlobal();
        const listedIds = selectListedIds(global, chatId, threadId);
        const isMessageLoaded = listedIds?.includes(messageId)
            || selectOutlyingListByMessageId(global, chatId, threadId, messageId);
        const currentIndex = pinnedIds.indexOf(messageId);
        const newIndex = cycleRestrict(pinnedIds.length, currentIndex + 1);
        if (isMessageLoaded) {
            setPinnedIndexByKey({
                ...getPinnedIndexByKey(),
                [key]: newIndex,
            });
        }
        else {
            setLoadingPinnedId(pinnedIds[newIndex]);
        }
    });
    return {
        handleIntersectPinnedMessage,
        handleFocusPinnedMessage,
        getCurrentPinnedIndex,
        getLoadingPinnedId,
    };
}
function clampIndex(id) {
    return Math.max(0, id);
}
