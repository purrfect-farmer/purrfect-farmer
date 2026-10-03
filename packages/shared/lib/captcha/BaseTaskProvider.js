import BasePollingProvider from "./BasePollingProvider.js";

/** createTask / getTaskResult API */
export default class BaseTaskProvider extends BasePollingProvider {
  /** Body property holding the API key */
  static authProperty = "clientKey";

  /** Auth body merged into every request */
  getAuth() {
    return { [this.constructor.authProperty]: this.apiKey };
  }

  /** Throw when the response carries an error */
  assertOk(data) {
    if (data.errorId) {
      throw new Error(data.errorDescription || data.errorCode || "Rejected");
    }
  }

  async getBalance() {
    const { data } = await this.api.post("/getBalance", this.getAuth(), {
      timeout: 15_000,
    });

    this.assertOk(data);
    return Number(data.balance);
  }

  async createRequest({ method, siteKey, pageUrl, body }) {
    const { data } = await this.api.post("/createTask", {
      ...this.getAuth(),
      task: {
        type: this.getMethod(method),
        websiteURL: pageUrl,
        websiteKey: siteKey,
        ...(typeof body !== "undefined" ? { body } : {}),
      },
    });

    this.assertOk(data);
    return data.taskId;
  }

  async getResult(requestId) {
    const { data } = await this.api.post("/getTaskResult", {
      ...this.getAuth(),
      taskId: requestId,
    });

    this.assertOk(data);

    if (["ready", "completed"].includes(data.status)) {
      return {
        ready: true,
        token: data.solution?.token ?? data.solution?.text ?? null,
      };
    } else if (data.status === "failed") {
      throw new Error(
        `Captcha solving failed: ${data.errorDescription || data.errorCode || data.status}`,
      );
    }

    return { ready: false };
  }
}
