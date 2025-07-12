import { useRef } from '../lib/teact/teact';
import useSyncEffect from './useSyncEffect';
const useLayoutEffectWithPrevDeps = (cb, dependencies) => {
    const prevDepsRef = useRef();
    return useSyncEffect(() => {
        const prevDeps = prevDepsRef.current;
        prevDepsRef.current = dependencies;
        return cb(prevDeps || []);
        // eslint-disable-next-line react-hooks-static-deps/exhaustive-deps
    }, dependencies);
};
export default useLayoutEffectWithPrevDeps;
