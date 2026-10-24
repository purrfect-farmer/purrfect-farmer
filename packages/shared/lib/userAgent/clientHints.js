/** The Chrome version used when the user agent names none */
export const DEFAULT_CHROME_VERSION = "155";

/** The Chrome major version a user agent names */
export function getChromeVersion(userAgent) {
  return (
    String(userAgent).match(/Chrome\/(\d+)/)?.[1] || DEFAULT_CHROME_VERSION
  );
}

/** The `sec-ch-ua` brands of an Android WebView running the user agent's Chrome */
export function getSecChUa(userAgent) {
  const version = getChromeVersion(userAgent);

  return [
    `"Android WebView";v="${version}"`,
    `"Chromium";v="${version}"`,
    `"Not_A Brand";v="24"`,
  ].join(", ");
}
