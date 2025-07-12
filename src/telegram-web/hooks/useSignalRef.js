import { useRef } from '../lib/teact/teact';
import useEffectOnce from './useEffectOnce';
// Allows to use signal value as "silent" dependency in hooks (not causing updates)
export function useSignalRef(getValue) {
    const ref = useRef(getValue());
    useEffectOnce(() => {
        return getValue.subscribe(() => {
            ref.current = getValue();
        });
    });
    return ref;
}
