import { useEffect, useRef } from '../lib/teact/teact';
const useEffectWithPrevDeps = (cb, dependencies, debugKey) => {
    const prevDepsRef = useRef();
    return useEffect(() => {
        const prevDeps = prevDepsRef.current;
        prevDepsRef.current = dependencies;
        return cb(prevDeps || []);
        // eslint-disable-next-line react-hooks-static-deps/exhaustive-deps
    }, dependencies, debugKey);
};
export default useEffectWithPrevDeps;
