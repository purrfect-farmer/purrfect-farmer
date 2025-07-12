import { useRef } from '../lib/teact/teact';
function usePreviousDeprecated(next, shouldSkipUndefined) {
    const ref = useRef();
    const { current } = ref;
    if (!shouldSkipUndefined || next !== undefined) {
        ref.current = next;
    }
    return current;
}
export default usePreviousDeprecated;
