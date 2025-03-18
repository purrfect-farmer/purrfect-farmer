import { StringSession } from "telegram/sessions";
import { TelegramClient } from "telegram";

/** Create Telegram Client */
export const createTelegramClient = (session = "") => {
  const apiId = Number(import.meta.env.VITE_APP_TELEGRAM_API_ID);
  const apiHash = import.meta.env.VITE_APP_TELEGRAM_API_HASH;
  const stringSession = new StringSession(session);

  /** Create Client */
  const client = new TelegramClient(stringSession, apiId, apiHash, {
    connectionRetries: 5,
  });

  return client;
};
