import { useSignal } from '../lib/teact/teact';
import { useSignalEffect } from './useSignalEffect';
import { useStateRef } from './useStateRef';
import useSyncEffect from './useSyncEffect';
function useDerivedSignal(resolverOrDependency, dependencies, isAsync = false) {
    const resolver = dependencies ? resolverOrDependency : () => resolverOrDependency;
    dependencies ??= [resolverOrDependency];
    const [getValue, setValue] = useSignal();
    const resolverRef = useStateRef(resolver);
    function runCurrentResolver() {
        const currentResolver = resolverRef.current;
        if (isAsync) {
            currentResolver(setValue);
        }
        else {
            setValue(currentResolver());
        }
    }
    // eslint-disable-next-line react-hooks-static-deps/exhaustive-deps
    useSyncEffect(runCurrentResolver, dependencies);
    useSignalEffect(runCurrentResolver, dependencies);
    return getValue;
}
export default useDerivedSignal;
