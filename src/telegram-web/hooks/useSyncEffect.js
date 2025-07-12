import { useRef, useUnmountCleanup } from '../lib/teact/teact';
import usePreviousDeprecated from './usePreviousDeprecated';
export default function useSyncEffect(effect, dependencies) {
    const prevDeps = usePreviousDeprecated(dependencies);
    const cleanupRef = useRef();
    if (!prevDeps || dependencies.some((d, i) => d !== prevDeps[i])) {
        cleanupRef.current?.();
        cleanupRef.current = effect(prevDeps || []) ?? undefined;
    }
    useUnmountCleanup(() => {
        cleanupRef.current?.();
    });
}
