import { useEffect } from '../lib/teact/teact';
import { createCallbackManager } from '../util/callbacks';
import { useStateRef } from './useStateRef';
const elementObserverMap = new Map();
export default function useResizeObserver(ref, onResize, isDisabled = false) {
    const onResizeRef = useStateRef(onResize);
    useEffect(() => {
        const el = ref?.current;
        if (!el || isDisabled) {
            return undefined;
        }
        const callback = ([entry]) => {
            // Ignore updates when element is not properly mounted (`display: none`)
            if (entry.contentRect.width === 0 && entry.contentRect.height === 0) {
                return;
            }
            onResizeRef.current(entry);
        };
        let [observer, callbackManager] = elementObserverMap.get(el) || [undefined, undefined];
        if (!observer) {
            callbackManager = createCallbackManager();
            observer = new ResizeObserver(callbackManager.runCallbacks);
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
    }, [isDisabled, onResizeRef, ref]);
}
