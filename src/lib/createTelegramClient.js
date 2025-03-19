import { StringSession } from "telegram/sessions";
import { TelegramClient } from "telegram";

/** Create Telegram Client */
export const createTelegramClient = (apiId, apiHash, session = "") => {
  const stringSession = new StringSession(session);

  /** Create Client */
  const client = new TelegramClient(stringSession, apiId, apiHash, {
    connectionRetries: 5,
  });

  return client;
};
