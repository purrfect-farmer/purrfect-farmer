import BaseTelegramWebClient from "../lib/BaseTelegramWebClient.js";
import { MemorySession } from "telegram/sessions/index.js";

export const DEVICE_MODEL =
  "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36";
export const SYSTEM_VERSION = "Linux x86_64";

let dcClient;
let dcClientPromise;
const cachedDcInfo = new Map();

/** Create telegram client */
export function createTelegramClient(session, options) {
  return new BaseTelegramWebClient(session, {
    deviceModel: DEVICE_MODEL,
    systemVersion: SYSTEM_VERSION,
    useWSS: true,
    ...options,
  });
}

/**
 * Get DC Client
 * @returns {Promise<BaseTelegramWebClient>}
 */
export async function getDcClient() {
  if (dcClient) {
    return dcClient;
  }

  if (!dcClientPromise) {
    dcClientPromise = (async () => {
      const memorySession = new MemorySession();

      const client = createTelegramClient(memorySession);

      await client.connect();

      dcClient = client;
      return client;
    })();
  }

  return dcClientPromise;
}

/**
 * Get DC details
 * @param {number} dcId
 */
export async function getDcDetails(dcId) {
  if (cachedDcInfo.has(dcId)) {
    return cachedDcInfo.get(dcId);
  }

  const client = await getDcClient();
  const info = await client.execute(() => client.getDC(dcId));

  cachedDcInfo.set(dcId, info);

  return info;
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
