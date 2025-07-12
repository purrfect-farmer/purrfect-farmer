import { useEffect } from '../../lib/teact/teact';
import useLastCallback from '../useLastCallback';
// Fragile
export function useClickOutside(refs, callback) {
    const handleClickOutside = useLastCallback((event) => {
        const clickedOutside = refs.every((ref) => {
            return ref.current && !ref.current.contains(event.target);
        });
        if (clickedOutside)
            callback(event);
    });
    useEffect(() => {
        document.addEventListener('click', handleClickOutside);
        return () => {
            document.removeEventListener('click', handleClickOutside);
        };
    }, [handleClickOutside]);
}
