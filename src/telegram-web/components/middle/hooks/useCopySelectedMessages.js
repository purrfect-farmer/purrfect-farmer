import { useMemo } from '../../../lib/teact/teact';
import { getActions } from '../../../global';
import { useHotkeys } from '../../../hooks/useHotkeys';
const useCopySelectedMessages = (isActive) => {
    function handleCopy(e) {
        e.preventDefault();
        getActions().copySelectedMessages();
    }
    useHotkeys(useMemo(() => (isActive ? {
        'Mod+C': handleCopy,
    } : undefined), [isActive]));
};
export default useCopySelectedMessages;
