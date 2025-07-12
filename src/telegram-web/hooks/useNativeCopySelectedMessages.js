import { useMemo } from '../lib/teact/teact';
import getMessageIdsForSelectedText from '../util/getMessageIdsForSelectedText';
import { useHotkeys } from './useHotkeys';
import useLastCallback from './useLastCallback';
const useNativeCopySelectedMessages = (copyMessagesByIds) => {
    const handleCopy = useLastCallback((e) => {
        const messageIds = getMessageIdsForSelectedText();
        if (messageIds && messageIds.length > 1) {
            e.preventDefault();
            copyMessagesByIds({ messageIds });
        }
    });
    useHotkeys(useMemo(() => ({
        'Mod+C': handleCopy,
    }), []));
};
export default useNativeCopySelectedMessages;
