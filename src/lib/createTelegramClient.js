import { ConnectionTCPObfuscated } from "telegram/network";
import { PromisedWebSockets } from "telegram/extensions";
import { StringSession } from "telegram/sessions";
import { TelegramClient } from "telegram";

/** Create Telegram Client */
export const createTelegramClient = (session = "") => {
  const stringSession = new StringSession(session);

  /** Create Client */
  const client = new TelegramClient(
    stringSession,
    2496,
    "8da85b0d5bfe62527e5b244c209159c3",
    {
      appVersion: "2.2 K",
      deviceModel: navigator.userAgent,
      systemVersion: navigator.platform,
      systemLangCode: "en-US",
      langCode: "en",
      connection: ConnectionTCPObfuscated,
      networkSocket: PromisedWebSockets,
    }
  );

  return client;
};
