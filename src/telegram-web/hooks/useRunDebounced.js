import useDebouncedCallback from './useDebouncedCallback';
export default function useRunDebounced(ms, noFirst, noLast, deps = []) {
    return useDebouncedCallback((cb) => {
        cb();
        // eslint-disable-next-line react-hooks-static-deps/exhaustive-deps
    }, deps, ms, noFirst, noLast);
}
