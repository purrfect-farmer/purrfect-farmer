import {
  API_URL,
  BANNED,
  BOT_USERNAME,
  TURNSTILE_HEADER,
  TURNSTILE_PAGE_URL,
  TURNSTILE_REQUIRED,
  TURNSTILE_SITE_KEY,
} from "./constants.js";
import BaseFarmer from "../../lib/BaseFarmer.js";

/** API transport, the Turnstile pass and sign-in */
export default class MonsterlandSession extends BaseFarmer {
  /* --------------------------------------------------------------------- */
  /* Transport                                                             */
  /* --------------------------------------------------------------------- */

  /** Carry `initData` on every call the game's own API receives, and on no others */
  configureApi() {
    const interceptor = this.api.interceptors.request.use((config) => {
      if (String(config.url || "").startsWith(API_URL)) {
        config.headers["Authorization"] = `tma ${this.getInitData()}`;
      }

      return config;
    });

    return () => {
      this.api.interceptors.request.eject(interceptor);
    };
  }

  /** Call the game's API, passing Turnstile once if the backend asks for it
   * @returns {Promise<{ ok: boolean, status: number, data: object }>}
   */
  async callApi(
    method,
    path,
    { data, params, headers, retryTurnstile = true } = {},
  ) {
    const response = await this.api.request({
      method,
      url: `${API_URL}${path}`,
      data: method === "get" ? undefined : data || {},
      params,
      headers,
      signal: this.signal,
      validateStatus: () => true,
    });

    const payload =
      response.data && typeof response.data === "object" ? response.data : {};

    if (response.status === 403 && payload["error"] === BANNED) {
      throw new Error("This account is banned by Monsterland.");
    }

    if (
      response.status === 403 &&
      payload["error"] === TURNSTILE_REQUIRED &&
      retryTurnstile
    ) {
      this.logger.warn("Monsterland asked for the security check.");
      await this.obtainHumanSession();
      return this.callApi(method, path, {
        data,
        params,
        headers,
        retryTurnstile: false,
      });
    }

    if (response.status >= 500) {
      throw new Error(
        payload["error"] || `Request failed (${response.status})`,
      );
    }

    return {
      ok: response.status >= 200 && response.status < 300,
      status: response.status,
      data: payload,
    };
  }

  /** Read from the game's API, throwing a refusal */
  async getFromApi(path, params) {
    const result = await this.callApi("get", path, { params });

    if (!result.ok) {
      throw new Error(
        result.data["error"] || `Failed to read ${path} (${result.status})`,
      );
    }

    return result.data;
  }

  /** Act on the game's API, returning a refusal for the caller to read */
  postToApi(path, data = {}, headers) {
    return this.callApi("post", path, { data, headers });
  }

  /* --------------------------------------------------------------------- */
  /* Human session                                                         */
  /* --------------------------------------------------------------------- */

  /** Pass the Turnstile check, sharing one attempt between concurrent callers */
  obtainHumanSession() {
    return (this.humanSessionPromise ||= this.solveHumanCheck().finally(() => {
      this.humanSessionPromise = null;
    }));
  }

  /** Solve Turnstile and hand the token to the backend, which trusts the account for about an hour */
  async solveHumanCheck() {
    if (!this.canSolveTurnstile()) {
      throw new Error(
        "Captcha is required but no captcha provider is configured!",
      );
    }

    await this.logPreviousPassLifespan();

    this.logger.info("Solving the security check...");

    const token = await this.solveTurnstile({
      siteKey: TURNSTILE_SITE_KEY,
      pageUrl: TURNSTILE_PAGE_URL,
    });

    const result = await this.callApi("post", "/security/turnstile", {
      headers: { [TURNSTILE_HEADER]: token },
      retryTurnstile: false,
    });

    if (!result.ok) {
      throw new Error(
        result.data["error"] || `Security check was refused (${result.status})`,
      );
    }

    this.logger.success("Security check passed.");

    await this.storeTurnstilePass();
  }

  /** Log how long the last pass held, which tells whether it survives between runs */
  async logPreviousPassLifespan() {
    try {
      const stored = await this.storage?.get("turnstilePass");
      const solvedAt = Number(stored?.["solvedAt"]);

      if (solvedAt) {
        const minutes = Math.round((Date.now() - solvedAt) / 6e4);

        this.logger.info(`Security pass lasted ${minutes}m.`);
      }
    } catch (error) {
      this.logger.warn("Failed to read the security pass:", error.message);
    }
  }

  /** Remember when the pass was earned, so the next solve can report its lifespan */
  async storeTurnstilePass() {
    try {
      await this.storage?.set("turnstilePass", { solvedAt: Date.now() });
    } catch (error) {
      this.logger.warn("Failed to store the security pass:", error.message);
    }
  }

  /* --------------------------------------------------------------------- */
  /* Session                                                               */
  /* --------------------------------------------------------------------- */

  /** Get Auth */
  fetchAuth() {
    return this.loadState();
  }

  /** Get Referral Link */
  async getReferralLink() {
    await this.ensureStateLoaded();

    const hash =
      this.state_data?.referral?.["referral_hash"] ||
      this.getProfile()["referral_hash"];

    return `https://t.me/${BOT_USERNAME}?startapp=ref_${hash}`;
  }
}
