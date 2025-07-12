import { useMemo } from '../lib/teact/teact';
import { getActions } from '../global';
import { SEND_MESSAGE_ACTION_INTERVAL } from '../config';
import { throttle } from '../util/schedulers';
const useSendMessageAction = (chatId, threadId) => {
    return useMemo(() => {
        return throttle((action) => {
            if (!chatId || !threadId)
                return;
            getActions().sendMessageAction({ chatId, threadId, action });
        }, SEND_MESSAGE_ACTION_INTERVAL);
    }, [chatId, threadId]);
};
export default useSendMessageAction;
