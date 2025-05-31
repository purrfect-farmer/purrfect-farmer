import TelegramWorkerClient from "./TelegramWorkerClient";

/** Create Telegram Client */
export const createTelegramClient = (session = "") => {
  return new TelegramWorkerClient(session);
};
