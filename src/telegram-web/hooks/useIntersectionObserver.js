import { useEffect, useRef, useState } from '../lib/teact/teact';
import { createCallbackManager } from '../util/callbacks';
import { debounce, throttle, throttleWith, } from '../util/schedulers';
import useHeavyAnimation from './useHeavyAnimation';
import useLastCallback from './useLastCallback';
export function useIntersectionObserver({ rootRef, throttleMs, throttleScheduler, debounceMs, shouldSkipFirst, margin, threshold, isDisabled, }, rootCallback) {
    const controllerRef = useRef();
    const rootCallbackRef = useRef();
    const freezeFlagsRef = useRef(0);
    const onUnfreezeRef = useRef();
    rootCallbackRef.current = rootCallback;
    const freeze = useLastCallback(() => {
        freezeFlagsRef.current++;
    });
    const unfreeze = useLastCallback(() => {
        if (!freezeFlagsRef.current) {
            return;
        }
        freezeFlagsRef.current--;
        if (!freezeFlagsRef.current && onUnfreezeRef.current) {
            onUnfreezeRef.current();
            onUnfreezeRef.current = undefined;
        }
    });
    useHeavyAnimation(freeze, unfreeze);
    useEffect(() => {
        if (isDisabled) {
            return undefined;
        }
        return () => {
            if (controllerRef.current) {
                controllerRef.current.observer.disconnect();
                controllerRef.current.destroy();
                controllerRef.current = undefined;
            }
        };
    }, [isDisabled]);
    function initController() {
        const callbacks = new Map();
        const entriesAccumulator = new Map();
        let observerCallback;
        if (typeof throttleScheduler === 'function') {
            observerCallback = throttleWith(throttleScheduler, observerCallbackSync);
        }
        else if (throttleMs) {
            observerCallback = throttle(observerCallbackSync, throttleMs, !shouldSkipFirst);
        }
        else if (debounceMs) {
            observerCallback = debounce(observerCallbackSync, debounceMs, !shouldSkipFirst);
        }
        else {
            observerCallback = observerCallbackSync;
        }
        function observerCallbackSync() {
            if (freezeFlagsRef.current) {
                onUnfreezeRef.current = observerCallback;
                return;
            }
            const entries = Array.from(entriesAccumulator.values());
            entries.forEach((entry) => {
                const callbackManager = callbacks.get(entry.target);
                callbackManager?.runCallbacks(entry);
            });
            if (rootCallbackRef.current) {
                rootCallbackRef.current(entries);
            }
            entriesAccumulator.clear();
        }
        function addCallback(element, callback) {
            if (!callbacks.get(element)) {
                callbacks.set(element, createCallbackManager());
            }
            const callbackManager = callbacks.get(element);
            callbackManager.addCallback(callback);
        }
        function removeCallback(element, callback) {
            const callbackManager = callbacks.get(element);
            if (!callbackManager)
                return;
            callbackManager.removeCallback(callback);
            if (!callbackManager.hasCallbacks()) {
                callbacks.delete(element);
            }
        }
        const observer = new IntersectionObserver((entries) => {
            entries.forEach((entry) => {
                entriesAccumulator.set(entry.target, entry);
            });
            if (freezeFlagsRef.current) {
                onUnfreezeRef.current = observerCallback;
            }
            else {
                observerCallback();
            }
        }, {
            root: rootRef.current,
            rootMargin: margin ? `${margin}px` : undefined,
            threshold,
        });
        function destroy() {
            callbacks.clear();
            observer.disconnect();
            entriesAccumulator.clear();
        }
        controllerRef.current = {
            observer,
            addCallback,
            removeCallback,
            destroy,
        };
    }
    const observe = useLastCallback((target, targetCallback) => {
        if (!controllerRef.current) {
            initController();
        }
        const controller = controllerRef.current;
        controller.observer.observe(target);
        if (targetCallback) {
            controller.addCallback(target, targetCallback);
        }
        return () => {
            if (targetCallback) {
                controller.removeCallback(target, targetCallback);
            }
            controller.observer.unobserve(target);
        };
    });
    return { observe, freeze, unfreeze };
}
export function useOnIntersect(targetRef, observe, callback) {
    const lastCallback = useLastCallback(callback);
    useEffect(() => {
        return observe ? observe(targetRef.current, lastCallback) : undefined;
    }, [lastCallback, observe, targetRef]);
}
export function useIsIntersecting(targetRef, observe, callback) {
    const [isIntersecting, setIsIntersecting] = useState(!observe);
    useOnIntersect(targetRef, observe, (entry) => {
        setIsIntersecting(entry.isIntersecting);
        if (callback) {
            callback(entry);
        }
    });
    return isIntersecting;
}
