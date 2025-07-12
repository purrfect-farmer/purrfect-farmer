import { getIsHeavyAnimating, useEffect } from '../lib/teact/teact';
import { requestMeasure } from '../lib/fasterdom/fasterdom';
import { createCallbackManager } from '../util/callbacks';
import useLastCallback from './useLastCallback';
const elementObserverMap = new Map();
export default function useSharedIntersectionObserver(refOrElement, onIntersectionChange, isDisabled = false) {
    const onIntersectionChangeLast = useLastCallback(onIntersectionChange);
    useEffect(() => {
        const el = refOrElement && 'current' in refOrElement ? refOrElement.current : refOrElement;
        if (!el || isDisabled) {
            return undefined;
        }
        const entriesAccumulator = new Map();
        function flush() {
            for (const entry of entriesAccumulator.values()) {
                // Ignore updates when element is not properly mounted (`display: none`)
                if (!entry.target.offsetParent) {
                    continue;
                }
                onIntersectionChangeLast(entry);
            }
            entriesAccumulator.clear();
        }
        const callback = ([entry]) => {
            entriesAccumulator.set(entry.target, entry);
            if (!getIsHeavyAnimating()) {
                flush();
            }
            else {
                getIsHeavyAnimating.once(() => {
                    requestMeasure(flush);
                });
            }
        };
        let [observer, callbackManager] = elementObserverMap.get(el) || [undefined, undefined];
        if (!observer) {
            callbackManager = createCallbackManager();
            observer = new IntersectionObserver(callbackManager.runCallbacks);
            elementObserverMap.set(el, [observer, callbackManager]);
            observer.observe(el);
        }
        callbackManager.addCallback(callback);
        return () => {
            callbackManager.removeCallback(callback);
            if (!callbackManager.hasCallbacks()) {
                observer.unobserve(el);
                observer.disconnect();
                elementObserverMap.delete(el);
            }
        };
    }, [isDisabled, refOrElement]);
}
