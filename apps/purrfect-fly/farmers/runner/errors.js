/** Transient errors (proxy timeout, aborted, or 5xx) must not count toward deactivating or banning the account */
export function isTransientError(error) {
  if (!error) return false;

  /** Server-side errors (500+) are not the account's fault */
  if (error.response?.status >= 500) {
    return true;
  }

  /** Timeout or aborted requests */
  const message = String(error.message || "").toLowerCase();
  return message.includes("timeout") || message.includes("aborted");
}

/** Parse a Retry-After header value into milliseconds */
export function parseRetryAfter(value) {
  if (!value) return null;

  /** Numeric value is in seconds */
  const seconds = Number(value);
  if (!Number.isNaN(seconds)) {
    return Math.max(0, seconds * 1000);
  }

  /** Otherwise it may be an HTTP date */
  const date = new Date(value);
  if (!Number.isNaN(date.getTime())) {
    return Math.max(0, date.getTime() - Date.now());
  }

  return null;
}
