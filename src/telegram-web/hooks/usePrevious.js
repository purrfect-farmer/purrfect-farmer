import { useRef } from '../lib/teact/teact';
// This is not render-dependent and will never allow previous to match current
export default function usePrevious(current) {
    const prevRef = useRef();
    const lastRef = useRef();
    if (lastRef.current !== current) {
        prevRef.current = lastRef.current;
    }
    lastRef.current = current;
    return prevRef.current;
}
