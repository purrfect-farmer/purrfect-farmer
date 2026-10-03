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

/** Connect-phase proxy errors, the target never received the request so replaying is safe */
export function isProxyConnectError(error) {
  if (!error || error.response || error.code === "ERR_CANCELED") return false;

  /** hpagent CONNECT failures */
  const message = String(error.message || "");
  if (message === "Proxy timeout" || message.startsWith("Bad response:")) {
    return true;
  }

  /** Proxy unreachable */
  return ["ECONNREFUSED", "EAI_AGAIN", "ENOTFOUND"].includes(error.code);
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
