import { useRef } from '../lib/teact/teact';
import generateUniqueId from '../util/generateUniqueId';
export default function useUniqueId() {
    const idRef = useRef();
    if (!idRef.current) {
        idRef.current = generateUniqueId();
    }
    return idRef.current;
}
