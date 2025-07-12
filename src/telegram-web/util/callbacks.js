export function createCallbackManager() {
    const callbacks = new Set();
    function addCallback(cb) {
        callbacks.add(cb);
        return () => {
            removeCallback(cb);
        };
    }
    function removeCallback(cb) {
        callbacks.delete(cb);
    }
    function runCallbacks(...args) {
        callbacks.forEach((callback) => {
            callback(...args);
        });
    }
    function hasCallbacks() {
        return Boolean(callbacks.size);
    }
    return {
        runCallbacks,
        addCallback,
        removeCallback,
        hasCallbacks,
    };
}
