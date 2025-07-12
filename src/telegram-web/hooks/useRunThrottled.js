import useThrottledCallback from './useThrottledCallback';
export default function useRunThrottled(ms, noFirst, deps = []) {
    return useThrottledCallback((cb) => {
        cb();
        // eslint-disable-next-line react-hooks-static-deps/exhaustive-deps
    }, deps, ms, noFirst);
}
