import { memo } from '../../lib/teact/teact';
import { getActions, withGlobal } from '../../global';
import { selectTabState } from '../../global/selectors';
import { createLocationHash } from '../../util/routing';
import useHistoryBack from '../../hooks/useHistoryBack';
// Actual `MessageList` components are unmounted when deep in the history,
// so we need a separate component just for handling history
const MessageListHistoryHandler = ({ messageLists }) => {
    const { openChat } = getActions();
    const closeChat = () => {
        openChat({ id: undefined }, { forceSyncOnIOs: true });
    };
    const MessageHistoryRecord = ({ chatId, type, threadId }) => {
        useHistoryBack({
            isActive: true,
            hash: createLocationHash(chatId, type, threadId),
            onBack: closeChat,
        });
    };
    return (<div>
      {messageLists?.map((messageList, i) => (<MessageHistoryRecord key={`${messageList.chatId}_${messageList.threadId}_${messageList.type}_${i}`} {...messageList}/>))}
    </div>);
};
export default memo(withGlobal((global) => {
    return {
        messageLists: selectTabState(global).messageLists,
    };
})(MessageListHistoryHandler));
