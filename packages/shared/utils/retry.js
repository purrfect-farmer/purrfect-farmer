/** A retry count as a non-negative integer */
export const toRetryCount = (value) =>
  Math.max(0, Math.floor(Number(value) || 0));

/**
 * Run a callback, running it again on failure up to `retries` more times
 * @template T
 * @param {number} retries
 * @param {(attempt: number) => Promise<T>} callback
 * @param {object} [options]
 * @param {(error: unknown) => boolean} [options.shouldRetry] - whether a failed attempt may be retried
 * @param {(attempt: number, attempts: number, error: unknown) => unknown} [options.onRetry] - called before the next attempt
 * @returns {Promise<T>}
 */
export async function withRetries(
  retries,
  callback,
  { shouldRetry = () => true, onRetry } = {},
) {
  /** The number of attempts the callback gets */
  const attempts = 1 + toRetryCount(retries);

  for (let attempt = 1; ; attempt++) {
    try {
      return await callback(attempt);
    } catch (error) {
      if (attempt >= attempts || !shouldRetry(error)) {
        throw error;
      }

      await onRetry?.(attempt + 1, attempts, error);
    }
  }
}
