import BaseTelegramWebClient from "@purrfect/shared/lib/BaseTelegramWebClient.js";

export default class TelegramWebClient extends BaseTelegramWebClient {
  /** Construct Class */
  constructor(session) {
    super(session, {
      deviceModel: navigator.userAgent,
      systemVersion: navigator.platform,
      useWSS: true,
    });
  }

  /** Join Telegram Link */
  joinTelegramLink(link) {
    return super
      .joinTelegramLink(link)
      .then((status) =>
        status
          ? Promise.resolve(true)
          : Promise.reject(new Error("Failed to join Telegram link"))
      );
  }
}
