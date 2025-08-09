/** Parse Telegram Link */
export function parseTelegramLink(url) {
  const parsedUrl = new URL(url);
  const [entity, shortName = ""] = parsedUrl.pathname
    .replace(/^\//, "")
    .split("/");

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

/** Extract Telegram WebAppData */
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

export function extractInitDataUnsafe(initData) {
  return getInitDataUnsafe(initData);
}

/** Get Init Data Unsafe */
export function getInitDataUnsafe(initData) {
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

/** Check if it's a Telegram Link */
export function isTelegramLink(link) {
  return link && /^(http|https):\/\/t\.me\/.+/i.test(link);
}

/** Check if it's a bot URL */
export function isBotURL(url) {
  return url && /_*bot|startapp=|start=/i.test(url);
}

/** Check if it's a chat link */
export function isTelegramChatLink(link) {
  return link && /^(http|https):\/\/t\.me\/[^\/\?]+$/i.test(link);
}
