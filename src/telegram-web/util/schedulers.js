export function debounce(fn, ms, shouldRunFirst = true, shouldRunLast = true) {
    let waitingTimeout;
    return (...args) => {
        if (waitingTimeout) {
            clearTimeout(waitingTimeout);
            waitingTimeout = undefined;
        }
        else if (shouldRunFirst) {
            fn(...args);
        }
        waitingTimeout = self.setTimeout(() => {
            if (shouldRunLast) {
                fn(...args);
            }
            waitingTimeout = undefined;
        }, ms);
    };
}
export function throttle(fn, ms, shouldRunFirst = true) {
    let interval;
    let isPending;
    let args;
    return (..._args) => {
        isPending = true;
        args = _args;
        if (!interval) {
            if (shouldRunFirst) {
                isPending = false;
                fn(...args);
            }
            interval = self.setInterval(() => {
                if (!isPending) {
                    self.clearInterval(interval);
                    interval = undefined;
                    return;
                }
                isPending = false;
                fn(...args);
            }, ms);
        }
    };
}
export function throttleWithTickEnd(fn) {
    return throttleWith(onTickEnd, fn);
}
export function throttleWith(schedulerFn, fn) {
    let waiting = false;
    let args;
    return (..._args) => {
        args = _args;
        if (!waiting) {
            waiting = true;
            schedulerFn(() => {
                waiting = false;
                fn(...args);
            });
        }
    };
}
export const pause = (ms) => new Promise((resolve) => {
    setTimeout(() => resolve(), ms);
});
export function rafPromise() {
    return new Promise((resolve) => {
        fastRaf(resolve);
    });
}
const FAST_RAF_TIMEOUT_FALLBACK_MS = 35; // < 30 FPS
let fastRafCallbacks;
let fastRafFallbackCallbacks;
let fastRafFallbackTimeout;
// May result in an immediate execution if called from another RAF callback which was scheduled
// (and therefore is executed) earlier than RAF callback scheduled by `fastRaf`
export function fastRaf(callback, withTimeoutFallback = false) {
    if (!fastRafCallbacks) {
        fastRafCallbacks = new Set([callback]);
        requestAnimationFrame(() => {
            const currentCallbacks = fastRafCallbacks;
            fastRafCallbacks = undefined;
            fastRafFallbackCallbacks = undefined;
            if (fastRafFallbackTimeout) {
                clearTimeout(fastRafFallbackTimeout);
                fastRafFallbackTimeout = undefined;
            }
            currentCallbacks.forEach((cb) => cb());
        });
    }
    else {
        fastRafCallbacks.add(callback);
    }
    if (withTimeoutFallback) {
        if (!fastRafFallbackCallbacks) {
            fastRafFallbackCallbacks = new Set([callback]);
        }
        else {
            fastRafFallbackCallbacks.add(callback);
        }
        if (!fastRafFallbackTimeout) {
            fastRafFallbackTimeout = window.setTimeout(() => {
                const currentTimeoutCallbacks = fastRafFallbackCallbacks;
                if (fastRafCallbacks) {
                    const currentCallbacks = fastRafCallbacks;
                    currentTimeoutCallbacks.forEach((callback) => currentCallbacks.delete(callback));
                }
                fastRafFallbackCallbacks = undefined;
                if (fastRafFallbackTimeout) {
                    clearTimeout(fastRafFallbackTimeout);
                    fastRafFallbackTimeout = undefined;
                }
                currentTimeoutCallbacks.forEach((cb) => cb());
            }, FAST_RAF_TIMEOUT_FALLBACK_MS);
        }
    }
}
let onTickEndCallbacks;
export function onTickEnd(callback) {
    if (!onTickEndCallbacks) {
        onTickEndCallbacks = [callback];
        Promise.resolve().then(() => {
            const currentCallbacks = onTickEndCallbacks;
            onTickEndCallbacks = undefined;
            currentCallbacks.forEach((cb) => cb());
        });
    }
    else {
        onTickEndCallbacks.push(callback);
    }
}
const IDLE_TIMEOUT = 500;
let onIdleCallbacks;
export function onIdle(callback) {
    if (!self.requestIdleCallback) {
        onTickEnd(callback);
        return;
    }
    if (!onIdleCallbacks) {
        onIdleCallbacks = [callback];
        requestIdleCallback((deadline) => {
            const currentCallbacks = onIdleCallbacks;
            onIdleCallbacks = undefined;
            while (currentCallbacks.length) {
                const cb = currentCallbacks.shift();
                cb();
                if (!deadline.timeRemaining())
                    break;
            }
            if (currentCallbacks.length) {
                if (onIdleCallbacks) {
                    // Prepend the remaining callbacks if the next pass is already planned
                    onIdleCallbacks = currentCallbacks.concat(onIdleCallbacks);
                }
                else {
                    currentCallbacks.forEach(onIdle);
                }
            }
        }, { timeout: IDLE_TIMEOUT });
    }
    else {
        onIdleCallbacks.push(callback);
    }
}
let beforeUnloadCallbacks;
export function onBeforeUnload(callback, isLast = false) {
    if (!beforeUnloadCallbacks) {
        beforeUnloadCallbacks = [];
        self.addEventListener('beforeunload', () => {
            beforeUnloadCallbacks.forEach((cb) => cb());
        });
    }
    if (isLast) {
        beforeUnloadCallbacks.push(callback);
    }
    else {
        beforeUnloadCallbacks.unshift(callback);
    }
    return () => {
        beforeUnloadCallbacks = beforeUnloadCallbacks.filter((cb) => cb !== callback);
    };
}
