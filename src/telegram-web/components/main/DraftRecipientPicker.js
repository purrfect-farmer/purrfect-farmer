import { memo, useCallback, useEffect, } from '../../lib/teact/teact';
import { getActions } from '../../global';
import useFlag from '../../hooks/useFlag';
import useOldLang from '../../hooks/useOldLang';
import RecipientPicker from '../common/RecipientPicker';
const DraftRecipientPicker = ({ requestedDraft, }) => {
    const isOpen = Boolean(requestedDraft && !requestedDraft.chatId);
    const { openChatWithDraft, resetOpenChatWithDraft, } = getActions();
    const lang = useOldLang();
    const [isShown, markIsShown, unmarkIsShown] = useFlag();
    useEffect(() => {
        if (isOpen) {
            markIsShown();
        }
    }, [isOpen, markIsShown]);
    const handleSelectRecipient = useCallback((recipientId, threadId) => {
        openChatWithDraft({
            chatId: recipientId,
            threadId,
            text: requestedDraft.text,
            files: requestedDraft.files,
        });
    }, [openChatWithDraft, requestedDraft]);
    const handleClose = useCallback(() => {
        resetOpenChatWithDraft();
    }, [resetOpenChatWithDraft]);
    if (!isOpen && !isShown) {
        return undefined;
    }
    return (<RecipientPicker isOpen={isOpen} searchPlaceholder={lang('ForwardTo')} filter={requestedDraft?.filter} onSelectRecipient={handleSelectRecipient} onClose={handleClose} onCloseAnimationEnd={unmarkIsShown}/>);
};
export default memo(DraftRecipientPicker);
