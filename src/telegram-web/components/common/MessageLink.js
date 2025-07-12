import { useCallback } from '../../lib/teact/teact';
import { getActions } from '../../global';
import buildClassName from '../../util/buildClassName';
import Link from '../ui/Link';
const MessageLink = ({ className, message, children, }) => {
    const { focusMessage } = getActions();
    const handleMessageClick = useCallback(() => {
        if (message) {
            focusMessage({ chatId: message.chatId, messageId: message.id });
        }
    }, [focusMessage, message]);
    if (!message) {
        return children;
    }
    return (<Link className={buildClassName('MessageLink', className)} onClick={handleMessageClick}>{children}</Link>);
};
export default MessageLink;
