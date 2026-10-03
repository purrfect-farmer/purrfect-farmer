import BaseCaptchaProvider from "../BaseCaptchaProvider.js";

/** Statuses the docs mark as safe to retry */
const RETRYABLE_STATUSES = [429, 503];

/** Retries after the first attempt */
const MAX_RETRIES = 3;

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/** Synchronous solver: POST /solve holds the connection and returns the token */
export default class NSLSolverProvider extends BaseCaptchaProvider {
  static id = "nslsolver";
  static title = "NSLSolver";
  static baseURL = "https://api.nslsolver.com";
  static methods = {
    turnstile: "turnstile",
  };

  constructor(apiKey) {
    super(apiKey);
    this.api.defaults.headers.common["X-API-Key"] = apiKey;
    this.api.defaults.validateStatus = () => true;
  }

  /** Throw the API error when the request failed */
  assertOk(res) {
    if (res.status >= 300 || !res.data?.success) {
      throw new Error(res.data?.error || `HTTP ${res.status}`);
    }
  }

  async getBalance() {
    const res = await this.api.get("/balance", { timeout: 15_000 });

    this.assertOk(res);
    return Number(res.data.balance);
  }

  async solve({ method, siteKey, pageUrl }) {
    const payload = {
      type: this.getMethod(method),
      site_key: siteKey,
      url: pageUrl,
    };

    for (let attempt = 0; ; attempt++) {
      const res = await this.api.post("/solve", payload);

      if (RETRYABLE_STATUSES.includes(res.status) && attempt < MAX_RETRIES) {
        await delay(2_000 * 2 ** attempt);
        continue;
      }

      this.assertOk(res);
      return res.data.token;
    }
  }
}
