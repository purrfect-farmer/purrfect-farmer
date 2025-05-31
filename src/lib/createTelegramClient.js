import TelegramWebClient from "./TelegramWebClient";

/** Create Telegram Client */
export const createTelegramClient = (session = "") => {
  return new TelegramWebClient(session);
};
