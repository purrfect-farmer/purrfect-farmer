import { useEffect, useRef, useSignal } from '../../../lib/teact/teact';
import useLastCallback from '../../../hooks/useLastCallback';
import useResizeObserver from '../../../hooks/useResizeObserver';
export default function useContainerHeight(containerRef, isComposerVisible) {
    const [getContainerHeight, setContainerHeight] = useSignal();
    // Container resize observer (caused by Composer reply/webpage panels)
    const handleResize = useLastCallback((entry) => {
        setContainerHeight(entry.contentRect.height);
    });
    useResizeObserver(containerRef, handleResize);
    useEffect(() => {
        const currentNormalHeight = Number(containerRef.current.dataset.normalHeight) || 0;
        const containerHeight = getContainerHeight();
        if (containerHeight && containerHeight > currentNormalHeight && isComposerVisible) {
            containerRef.current.dataset.normalHeight = String(containerHeight);
        }
    }, [isComposerVisible, containerRef, getContainerHeight]);
    const prevContainerHeight = useRef();
    return [getContainerHeight, prevContainerHeight];
}
