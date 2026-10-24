/** The Chrome version used when the user agent names none */
export const DEFAULT_CHROME_VERSION = "155";

/** The Chrome major version a user agent names */
export function getChromeVersion(userAgent) {
  return (
    String(userAgent).match(/Chrome\/(\d+)/)?.[1] || DEFAULT_CHROME_VERSION
  );
}

/** The full Chrome version a user agent names */
export function getFullChromeVersion(userAgent) {
  return (
    String(userAgent).match(/Chrome\/([\d.]+)/)?.[1] ||
    `${DEFAULT_CHROME_VERSION}.0.0.0`
  );
}

/** The brands of an Android WebView running the user agent's Chrome, in the order it reports them */
export function getBrands(userAgent) {
  const version = getChromeVersion(userAgent);

  return [
    { brand: "Android WebView", version },
    { brand: "Chromium", version },
    { brand: "Not_A Brand", version: "24" },
  ];
}

/** The `sec-ch-ua` header for the user agent's brands */
export function getSecChUa(userAgent) {
  return getBrands(userAgent)
    .map(({ brand, version }) => `"${brand}";v="${version}"`)
    .join(", ");
}
