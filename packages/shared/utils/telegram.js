/**
 * Parse a Telegram link and extract its components
 * @param {string} url - The Telegram URL to parse
 * @returns {Object} Parsed components: url, entity, shortName, startParam
 * @example
 * parseTelegramLink("https://t.me/username/app?startapp=value")
 * // Returns: { url: "...", entity: "username", shortName: "app", startParam: "value" }
 *
 * parseTelegramLink("https://t.me/username?start=123")
 * // Returns: { url: "...", entity: "username", shortName: "", startParam: "123" }
 */
export function parseTelegramLink(url) {
  const parsedUrl = new URL(url);
  const pathSegments = parsedUrl.pathname
    .replace(/^\/|\/$/g, "") // Remove leading/trailing slashes
    .split("/")
    .filter(Boolean); // Remove empty segments

  const [entity = "", shortName = ""] = pathSegments;

  return {
    url,
    entity,
    shortName,
    startParam:
      parsedUrl.searchParams.get("start") ||
      parsedUrl.searchParams.get("startapp") ||
      "",
  };
}

/**
 * Extract Telegram WebApp data from a URL's hash fragment
 * @param {string} url - The URL containing Telegram WebApp data in hash
 * @returns {Object} WebApp data including platform, version, initData, and parsed initDataUnsafe
 * @example
 * extractTgWebAppData("https://example.com#tgWebAppData=...&tgWebAppPlatform=android")
 * // Returns: { platform: "android", version: "...", initData: "...", initDataUnsafe: {...} }
 */
export function extractTgWebAppData(url) {
  const parsedUrl = new URL(url);
  const params = new URLSearchParams(parsedUrl.hash.replace(/^#/, ""));
  const initData = params.get("tgWebAppData");
  const initDataUnsafe = getInitDataUnsafe(initData);

  return {
    platform: params.get("tgWebAppPlatform"),
    version: params.get("tgWebAppVersion"),
    initData,
    initDataUnsafe,
  };
}

/**
 * Extract and parse initDataUnsafe from a raw initData string
 * @param {string} initData - The raw initData string to parse
 * @returns {Object} Parsed initDataUnsafe object
 */
export function extractInitDataUnsafe(initData) {
  return getInitDataUnsafe(initData);
}

/**
 * Parse Telegram initData string into an object
 * Attempts to JSON parse values, falls back to raw string if parsing fails
 * @param {string} initData - The initData string (URL-encoded parameters)
 * @returns {Object} Parsed data object with keys and values
 * @example
 * getInitDataUnsafe("user=%7B%22id%22%3A123%7D&auth_date=1234567890")
 * // Returns: { user: { id: 123 }, auth_date: "1234567890" }
 */
export function getInitDataUnsafe(initData) {
  if (!initData) return {};

  const params = new URLSearchParams(initData);
  const data = {};

  for (const [key, value] of params.entries()) {
    try {
      data[key] = JSON.parse(value);
    } catch {
      data[key] = value;
    }
  }

  return data;
}

/**
 * Check if a URL is a valid Telegram link
 * @param {string} link - The URL to check
 * @returns {boolean} True if it's a valid t.me link with at least one path segment
 * @example
 * isTelegramLink("https://t.me/username") // true
 * isTelegramLink("https://t.me/username/app") // true
 * isTelegramLink("https://t.me") // false
 * isTelegramLink("https://example.com") // false
 */
export function isTelegramLink(link) {
  if (!link) return false;

  try {
    const url = new URL(link);
    // Check if hostname is t.me and has at least one path segment
    return (
      url.hostname.toLowerCase() === "t.me" &&
      url.pathname.length > 1 && // More than just "/"
      url.pathname !== "/"
    );
  } catch {
    return false;
  }
}

/**
 * Check if a URL is a bot URL (contains bot indicators)
 * @param {string} url - The URL to check
 * @returns {boolean} True if it's a bot URL
 * @example
 * isBotURL("https://t.me/mybot") // true (if ends with 'bot')
 * isBotURL("https://t.me/username?startapp=value") // true
 * isBotURL("https://t.me/channel") // false
 */
export function isBotURL(url) {
  try {
    const parsedUrl = new URL(url);
    const path = parsedUrl.pathname.toLowerCase();

    return (
      path.endsWith("bot") ||
      parsedUrl.searchParams.has("startapp") ||
      parsedUrl.searchParams.has("start")
    );
  } catch {
    return false;
  }
}

/**
 * Check if a URL is a Telegram chat/channel link with only one path segment
 * Only matches links like t.me/username, not t.me/username/app or t.me/username?query
 * Also excludes bot links
 * @param {string} link - The URL to check
 * @returns {boolean} True if it has exactly one path segment, no query params, and is not a bot
 * @example
 * isTelegramChatLink("https://t.me/username") // true
 * isTelegramChatLink("https://t.me/mybot") // false (bot link)
 * isTelegramChatLink("https://t.me/username/app") // false (has sub-path)
 * isTelegramChatLink("https://t.me/username?start=value") // false (has query params)
 */
export function isTelegramChatLink(link) {
  if (!link) return false;

  try {
    const url = new URL(link);
    const pathname = url.pathname.replace(/^\/|\/$/g, ""); // Remove leading/trailing slashes
    const pathSegments = pathname.split("/").filter(Boolean); // Split and remove empty segments

    // Must be t.me, have exactly one path segment, no query parameters, and not be a bot link
    return (
      url.hostname.toLowerCase() === "t.me" &&
      pathSegments.length === 1 &&
      url.search === "" && // No query parameters
      !isBotURL(link) // Ensure it's not a bot link
    );
  } catch {
    return false;
  }
}
