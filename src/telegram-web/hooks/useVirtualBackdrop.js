import { useEffect } from '../lib/teact/teact';
import { hasActiveViewTransition } from './animations/useViewTransition';
const BACKDROP_CLASSNAME = 'backdrop';
// This effect implements closing menus by clicking outside of them
// without adding extra elements to the DOM
export default function useVirtualBackdrop(isOpen, containerRef, onClose, ignoreRightClick, excludedClosestSelector) {
    useEffect(() => {
        if (!isOpen || !onClose) {
            return undefined;
        }
        const handleEvent = (e) => {
            const container = containerRef.current;
            const target = e.target;
            if (!container || !target || (ignoreRightClick && e.button === 2) || hasActiveViewTransition()) {
                return;
            }
            if ((!container.contains(e.target)
                || target.classList.contains(BACKDROP_CLASSNAME)) && !(excludedClosestSelector && (target.matches(excludedClosestSelector) || target.closest(excludedClosestSelector)))) {
                e.preventDefault();
                e.stopPropagation();
                onClose?.();
            }
        };
        document.addEventListener('mousedown', handleEvent);
        return () => {
            document.removeEventListener('mousedown', handleEvent);
        };
    }, [excludedClosestSelector, ignoreRightClick, isOpen, containerRef, onClose]);
}
