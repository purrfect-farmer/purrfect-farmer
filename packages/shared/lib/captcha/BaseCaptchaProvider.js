import axios from "axios";

export default class BaseCaptchaProvider {
  /** Provider id used in settings */
  static id = "";

  /** Display name */
  static title = "";

  /** API base URL */
  static baseURL = "";

  /** Our method name mapped to the provider's method name */
  static methods = {};

  constructor(apiKey) {
    this.apiKey = apiKey;
    this.api = axios.create({
      baseURL: this.constructor.baseURL,
      timeout: 120_000,
    });
  }

  /** Check if configured */
  isConfigured() {
    return Boolean(this.apiKey);
  }

  /** Check if the provider offers a given method */
  supportsMethod(method) {
    return Boolean(this.constructor.methods[method]);
  }

  /** Get the provider's name for a method */
  getMethod(method) {
    if (!this.supportsMethod(method)) {
      throw new Error(
        `Captcha provider "${this.constructor.id}" does not support method "${method}"`,
      );
    }

    return this.constructor.methods[method];
  }

  /** Get account balance, throwing when the key is rejected */
  async getBalance() {
    throw new Error("getBalance() is not implemented");
  }

  /** Solve a captcha and return its token */
  async solve({ method, siteKey, pageUrl, body, initialDelay }) {
    throw new Error("solve() is not implemented");
  }
}
