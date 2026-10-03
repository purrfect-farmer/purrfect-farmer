import BaseCaptchaProvider from "./BaseCaptchaProvider.js";

/** Wait between result polls */
const POLL_INTERVAL = 5_000;

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

export default class BasePollingProvider extends BaseCaptchaProvider {
  /** Submit a captcha and return the request id */
  async createRequest({ method, siteKey, pageUrl, body }) {
    throw new Error("createRequest() is not implemented");
  }

  /** Get the result as { ready, token }, throwing on failure */
  async getResult(requestId) {
    throw new Error("getResult() is not implemented");
  }

  /** Solve Captcha */
  async solve({ method, siteKey, pageUrl, body, initialDelay = 0 }) {
    const requestId = await this.createRequest({
      method,
      siteKey,
      pageUrl,
      body,
    });

    /* Give the provider a head start before polling for the result */
    await delay(initialDelay);

    while (true) {
      const { ready, token } = await this.getResult(requestId);
      if (ready) return token;
      await delay(POLL_INTERVAL);
    }
  }
}
