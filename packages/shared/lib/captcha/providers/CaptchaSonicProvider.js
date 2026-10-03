import BaseTaskProvider from "../BaseTaskProvider.js";

export default class CaptchaSonicProvider extends BaseTaskProvider {
  static id = "captchasonic";
  static title = "CaptchaSonic";
  static baseURL = "https://api.captchasonic.com";
  static authProperty = "apiKey";
  static methods = {
    turnstile: "AntiTurnstileTaskProxyLess",
  };

  /** Balance lives at GET /balance and errors come back as { code, msg } */
  async getBalance() {
    const { data } = await this.api.get("/balance", {
      params: { apiKey: this.apiKey },
      timeout: 15_000,
    });

    if (data.status !== "ok") {
      throw new Error(data.msg || "Rejected");
    }

    return Number(data.balance);
  }
}
