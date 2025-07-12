import { useEffect } from '../lib/teact/teact';
import { getActions } from '../global';
export default function useEnsureMessage(chatId, messageId, message, replyOriginForId, isDisabled) {
    const { loadMessage } = getActions();
    useEffect(() => {
        if (isDisabled)
            return;
        if (messageId && !message) {
            loadMessage({ chatId, messageId, replyOriginForId: replyOriginForId });
        }
    }, [isDisabled, chatId, message, messageId, replyOriginForId]);
}
