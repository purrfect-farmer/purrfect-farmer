import { useRef } from '../lib/teact/teact';
// Allows to use state value as "silent" dependency in hooks (not causing updates).
// Also useful for state values that update frequently (such as controlled input value).
export function useStateRef(value) {
    const ref = useRef(value);
    ref.current = value;
    return ref;
}
