import { extensions } from "telegram";
import { isNode } from "telegram/platform.js";

/** The Telegram Web K API credentials */
export const TELEGRAM_API_ID = 2496;
export const TELEGRAM_API_HASH = "8da85b0d5bfe62527e5b244c209159c3";

/** The client options shared by every Telegram Web K client */
export const TELEGRAM_CLIENT_OPTIONS = Object.freeze({
  appVersion: "2.2 K",
  systemLangCode: "en-US",
  langCode: "en",
  networkSocket: isNode
    ? extensions.PromisedNetSockets
    : extensions.PromisedWebSockets,
});
