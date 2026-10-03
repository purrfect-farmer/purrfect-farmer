import BasePollingProvider from "./BasePollingProvider.js";

/** 2Captcha-style in.php / res.php API */
export default class BaseInPhpProvider extends BasePollingProvider {
  async getBalance() {
    const { data } = await this.api.get("/res.php", {
      params: { key: this.apiKey, action: "getbalance", json: 1 },
      timeout: 15_000,
    });

    if (data.status !== 1) {
      throw new Error(data.request || "Rejected");
    }

    return Number(data.request);
  }

  async createRequest({ method, siteKey, pageUrl, body }) {
    const { data } = await this.api.post("/in.php", {
      key: this.apiKey,
      method: this.getMethod(method),
      sitekey: siteKey,
      googlekey: siteKey,
      pageurl: pageUrl,
      json: 1,
      ...(typeof body !== "undefined" ? { body } : {}),
    });

    if (data.status !== 1) {
      throw new Error(`Captcha request failed: ${data.request}`);
    }

    return data.request;
  }

  async getResult(requestId) {
    const { data } = await this.api.get("/res.php", {
      params: { key: this.apiKey, action: "get", id: requestId, json: 1 },
    });

    if (data.status === 1) {
      return { ready: true, token: data.request };
    } else if (data.request === "CAPCHA_NOT_READY") {
      return { ready: false };
    }

    throw new Error(`Captcha solving failed: ${data.request}`);
  }
}
