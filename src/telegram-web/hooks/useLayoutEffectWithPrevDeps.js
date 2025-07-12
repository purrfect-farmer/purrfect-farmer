import { useLayoutEffect, useRef } from '../lib/teact/teact';
const useLayoutEffectWithPrevDeps = (cb, dependencies, debugKey) => {
    const prevDepsRef = useRef();
    return useLayoutEffect(() => {
        const prevDeps = prevDepsRef.current;
        prevDepsRef.current = dependencies;
        return cb(prevDeps || []);
        // eslint-disable-next-line react-hooks-static-deps/exhaustive-deps
    }, dependencies, debugKey);
};
export default useLayoutEffectWithPrevDeps;
