export function delay(length, { precised = false, signal } = {}) {
  return new Promise((resolve, reject) => {
    const duration = precised
      ? length
      : (length * (Math.floor(Math.random() * 50) + 100)) / 100;

    const timeoutId = setTimeout(() => resolve(), duration);

    signal?.addEventListener("abort", () => {
      clearTimeout(timeoutId);
      reject(new Error("Aborted"));
    });
  });
}

export function delayForSeconds(length, options) {
  return delay(length * 1000, options);
}

export function delayForMinutes(length, options) {
  return delay(length * 60 * 1000, options);
}
