import useDebouncedCallback from './useDebouncedCallback';
import useDerivedSignal from './useDerivedSignal';
import useThrottledCallback from './useThrottledCallback';
export function useThrottledResolver(resolver, deps, msOrSchedulerFn, noFirst = false) {
    return useThrottledCallback((setValue) => {
        setValue(resolver());
        // eslint-disable-next-line react-hooks-static-deps/exhaustive-deps
    }, deps, msOrSchedulerFn, noFirst);
}
export function useThrottledSignal(getValue, ms, noFirst = false) {
    const throttledResolver = useThrottledResolver(() => getValue(), [getValue], ms, noFirst);
    return useDerivedSignal(throttledResolver, [throttledResolver, getValue], true);
}
export function useDebouncedResolver(resolver, deps, ms, noFirst = false, noLast = false) {
    return useDebouncedCallback((setValue) => {
        setValue(resolver());
        // eslint-disable-next-line react-hooks-static-deps/exhaustive-deps
    }, deps, ms, noFirst, noLast);
}
export function useDebouncedSignal(getValue, ms, noFirst = false, noLast = false) {
    const debouncedResolver = useDebouncedResolver(() => getValue(), [getValue], ms, noFirst, noLast);
    return useDerivedSignal(debouncedResolver, [debouncedResolver, getValue], true);
}
