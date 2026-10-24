import {
  parseLaunchParamsQuery,
  serializeLaunchParamsQuery,
} from "@telegram-apps/transformers";

/** The platform and version a mini app is opened with when the real ones are unknown */
export const DEFAULT_WEB_APP_PLATFORM = "android";

export const DEFAULT_WEB_APP_VERSION = "10.3";

/** The light theme every mini app is opened with */
export const DEFAULT_THEME_PARAMS = Object.freeze({
  bg_color: "#ffffff",
  text_color: "#000000",
  hint_color: "#aaaaaa",
  link_color: "#006aff",
  button_color: "#2cab37",
  button_text_color: "#ffffff",
});

/** The hash Telegram opens a mini app with: its initData, version, platform, theme and start parameter
 * @param {object} options
 * @param {string} options.initData - the raw initData
 * @param {string} [options.platform]
 * @param {string} [options.version]
 * @param {object} [options.themeParams] - snake_case colours, as Telegram sends them
 */
export function createLaunchHash({ initData, platform, version, themeParams }) {
  const startParam = getInitDataUnsafe(initData)["start_param"];

  return serializeLaunchParamsQuery({
    tgWebAppData: initData,
    tgWebAppVersion: version || DEFAULT_WEB_APP_VERSION,
    tgWebAppPlatform: platform || DEFAULT_WEB_APP_PLATFORM,
    tgWebAppThemeParams: themeParams || DEFAULT_THEME_PARAMS,
    ...(startParam ? { tgWebAppStartParam: String(startParam) } : {}),
  });
}

/**
 * Parse a Telegram link and extract its components
 * @param {string} url - The Telegram URL to parse
 */
export function parseTelegramLink(url) {
  const parsedUrl = new URL(url);
  const pathSegments = parsedUrl.pathname
    .replace(/^\/|\/$/g, "") // Remove leading/trailing slashes
    .split("/")
    .filter(Boolean); // Remove empty segments

  const isTelegramHostname =
    parsedUrl.hostname.toLowerCase() === "t.me" ||
    parsedUrl.hostname.toLowerCase() === "telegram.me";

  const [entity = "", shortName = ""] = pathSegments;
  const startParam =
    parsedUrl.searchParams.get("start") ||
    parsedUrl.searchParams.get("startapp") ||
    undefined;

  const isStartApp = parsedUrl.searchParams.has("startapp");
  const isMiniApp = isStartApp || shortName !== "";
  const isBot =
    entity.toLowerCase().endsWith("bot") || startParam !== undefined;

  return {
    url,
    entity,
    shortName,
    isBot,
    isStartApp,
    isMiniApp,
    startParam,
    parsedUrl,
    pathSegments,
    isTelegramHostname,
  };
}

/**
 * Extract Telegram WebApp data from a URL's hash fragment
 * @param {string} url - The URL containing Telegram WebApp data in hash
 */
export function extractTgWebAppData(url) {
  const parsedUrl = new URL(url);
  const launch = readLaunchParams(parsedUrl.hash.replace(/^#/, ""));

  return {
    ...launch,
    initDataUnsafe: getInitDataUnsafe(launch.initData),
  };
}
/** The raw initData, plus the platform, version and theme a launch query carries, read raw without a theme when Telegram's parser refuses them
 * @param {string} query - the launch query, as the mini app's hash carries it
 */
export function readLaunchParams(query) {
  const params = new URLSearchParams(query);
  const initData = params.get("tgWebAppData");

  /** The initData stays raw, so only the launch fields go through the parser */
  const launchOnly = new URLSearchParams(params);
  launchOnly.delete("tgWebAppData");

  try {
    const launch = parseLaunchParamsQuery(launchOnly.toString());

    return {
      initData,
      platform: launch.tgWebAppPlatform,
      version: launch.tgWebAppVersion,
      themeParams: launch.tgWebAppThemeParams,
    };
  } catch {
    return {
      initData,
      platform: params.get("tgWebAppPlatform"),
      version: params.get("tgWebAppVersion"),
      themeParams: null,
    };
  }
}
/**
 * Extract and parse initDataUnsafe from a raw initData string
 * @param {string} initData - The raw initData string to parse
 */
export function extractInitDataUnsafe(initData) {
  return getInitDataUnsafe(initData);
}

/**
 * Parse Telegram initData string into an object
 * Attempts to JSON parse values, falls back to raw string if parsing fails
 * @param {string} initData - The initData string (URL-encoded parameters)
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
 */
export function isTelegramLink(link) {
  if (!link) return false;

  try {
    const parsed = parseTelegramLink(link);
    // Check if hostname is t.me and has at least one path segment
    return parsed.isTelegramHostname && parsed.entity !== "";
  } catch {
    return false;
  }
}

/**
 * Check if a URL is a bot URL (contains bot indicators)
 * @param {string} url - The URL to check
 * @returns {boolean} True if it's a bot URL
 */
export function isBotURL(link) {
  try {
    const parsed = parseTelegramLink(link);

    return parsed.entity.endsWith("bot") || parsed.startParam;
  } catch {
    return false;
  }
}

export function isBotMiniAppLink(link) {
  if (!link) return false;

  try {
    const parsed = parseTelegramLink(link);

    return (
      parsed.isTelegramHostname &&
      parsed.entity !== "" &&
      parsed.shortName !== ""
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
 */
export function isTelegramChatLink(link) {
  if (!link) return false;

  try {
    const parsed = parseTelegramLink(link);
    return (
      // Ensure it's not a bot link
      // No query parameters
      parsed.isTelegramHostname &&
      parsed.pathSegments.length === 1 &&
      parsed.parsedUrl.search === "" &&
      !isBotURL(link)
    );
  } catch {
    return false;
  }
}
