import { extensions } from "telegram";
import { isNode } from "telegram/platform.js";

/** The Telegram Web K API credentials */
export const TELEGRAM_API_ID = 2496;
export const TELEGRAM_API_HASH = "8da85b0d5bfe62527e5b244c209159c3";

/** The Chrome major version clients without a browser report */
export const TELEGRAM_CHROME_VERSION = 156;

/** The desktop Chrome User-Agent clients without a browser report as their device */
export const TELEGRAM_DEVICE_MODEL = `Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/${TELEGRAM_CHROME_VERSION}.0.0.0 Safari/537.36`;

/** The platform clients without a browser report */
export const TELEGRAM_SYSTEM_VERSION = "Linux x86_64";

/** The client options shared by every Telegram Web K client */
export const TELEGRAM_CLIENT_OPTIONS = Object.freeze({
  appVersion: "2.2 K",
  systemLangCode: "en-US",
  langCode: "en",
  networkSocket: isNode
    ? extensions.PromisedNetSockets
    : extensions.PromisedWebSockets,
});
