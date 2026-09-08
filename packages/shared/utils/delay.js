/**
 * Delay with jitter
 * @param {number} length
 * @param {object} param1
 * @param {boolean} param1.precised
 * @param {AbortSignal} param1.signal
 * @returns
 */
export function delay(length, { precised = false, signal } = {}) {
  return new Promise((resolve, reject) => {
    try {
      /** Throw is aborted */
      signal?.throwIfAborted?.();

      /** Duration */
      const duration = precised
        ? length
        : (length * (Math.floor(Math.random() * 50) + 100)) / 100;

      const onAbort = () => {
        clearTimeout(timeoutId);
        reject(signal.reason ?? new Error("Aborted!"));
      };

      const timeoutId = setTimeout(() => {
        /** Detach: one signal outlives thousands of delays */
        signal?.removeEventListener?.("abort", onAbort);
        resolve();
      }, duration);

      signal?.addEventListener?.("abort", onAbort, { once: true });
    } catch (e) {
      reject(e);
    }
  });
}

/** Delay for seconds */
export function delayForSeconds(length, options) {
  return delay(length * 1000, options);
}

/** Delay for minutes */
export function delayForMinutes(length, options) {
  return delayForSeconds(length * 60, options);
}

/** Delay for hours */
export function delayForHours(length, options) {
  return delayForMinutes(length * 60, options);
}
