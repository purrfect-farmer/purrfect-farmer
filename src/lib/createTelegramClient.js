/** Create Telegram Client
 * @returns {import("./TelegramWebClient").default}
 */
export const createTelegramClient = (session = "") => {
  return new TelegramWebClient(session);
};
