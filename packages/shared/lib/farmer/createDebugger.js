/** A console whose methods only print while `isEnabled()` is true
 * @param {() => boolean} isEnabled
 */
export default function createDebugger(isEnabled) {
  return new Proxy(globalThis.console, {
    get: (target, prop) => {
      if (typeof target[prop] === "function") {
        return (...args) => {
          if (isEnabled()) {
            target[prop](...args);
          }
        };
      }
      return target[prop];
    },
  });
}
