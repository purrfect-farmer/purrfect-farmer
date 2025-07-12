import { useState } from '../lib/teact/teact';
import useLastCallback from './useLastCallback';
const THRESHOLD = 5;
export default function useScrolledState(threshold = THRESHOLD) {
    const [isAtBeginning, setIsAtBeginning] = useState(true);
    const [isAtEnd, setIsAtEnd] = useState(true);
    const handleScroll = useLastCallback((e) => {
        const { scrollHeight, scrollTop, clientHeight } = e.target;
        setIsAtBeginning(scrollTop < threshold);
        setIsAtEnd(scrollHeight - scrollTop - clientHeight < threshold);
    });
    return { isAtBeginning, isAtEnd, handleScroll };
}
