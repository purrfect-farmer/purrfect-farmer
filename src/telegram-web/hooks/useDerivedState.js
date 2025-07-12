import { useRef } from '../lib/teact/teact';
import useForceUpdate from './useForceUpdate';
import { useSignalEffect } from './useSignalEffect';
import { useStateRef } from './useStateRef';
import useSyncEffect from './useSyncEffect';
function useDerivedState(resolverOrSignal, dependencies, isAsync = false) {
    const resolver = dependencies ? resolverOrSignal : () => (resolverOrSignal());
    dependencies ??= [resolverOrSignal];
    const valueRef = useRef();
    const forceUpdate = useForceUpdate();
    const resolverRef = useStateRef(resolver);
    function runCurrentResolver(isSync = false) {
        const currentResolver = resolverRef.current;
        if (isAsync) {
            currentResolver((newValue) => {
                if (valueRef.current !== newValue) {
                    valueRef.current = newValue;
                    forceUpdate();
                }
            });
        }
        else {
            const newValue = currentResolver();
            if (valueRef.current !== newValue) {
                valueRef.current = newValue;
                if (!isSync) {
                    forceUpdate();
                }
            }
        }
    }
    useSyncEffect(() => {
        runCurrentResolver(true);
        // eslint-disable-next-line react-hooks-static-deps/exhaustive-deps
    }, dependencies);
    useSignalEffect(runCurrentResolver, dependencies);
    return valueRef.current;
}
export default useDerivedState;
