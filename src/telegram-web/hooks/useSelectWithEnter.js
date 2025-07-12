import { useCallback, useEffect, useRef } from '../lib/teact/teact';
const useSendWithEnter = (onSelect) => {
    const buttonRef = useRef();
    const handleKeyDown = useCallback((e) => {
        if (e.key !== 'Enter')
            return;
        const isFocused = buttonRef.current === document.activeElement;
        if (isFocused) {
            onSelect();
        }
    }, [onSelect]);
    useEffect(() => {
        window.addEventListener('keydown', handleKeyDown, false);
        return () => window.removeEventListener('keydown', handleKeyDown, false);
    }, [handleKeyDown]);
    return buttonRef;
};
export default useSendWithEnter;
