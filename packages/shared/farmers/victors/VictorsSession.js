import { API_URL, BANNED_CODE, HUMAN_REQUIRED_CODE } from "./constants.js";
import { createVictorsDevice } from "../../lib/games/victorsDevice.js";
import BaseFarmer from "../../lib/BaseFarmer.js";

/** API transport, device identity, bans and sign-in */
export default class VictorsSession extends BaseFarmer {
  /* --------------------------------------------------------------------- */
  /* Transport                                                             */
  /* --------------------------------------------------------------------- */

  /** Carry `initData` and the human pass on every call the drop's own API receives, and on no others */
  configureApi() {
    const interceptor = this.api.interceptors.request.use((config) => {
      if (String(config.url || "").startsWith(API_URL)) {
        config.headers["Authorization"] = `tma ${this.getInitData()}`;

        if (this.humanPass) {
          config.headers["x-human-pass"] = this.humanPass;
        }
      }

      return config;
    });

    return () => {
      this.api.interceptors.request.eject(interceptor);
    };
  }

  /** Call the drop's API, re-passing the human check once if the backend asks for it */
  async callApi(method, path, data, { retryHuman = true } = {}) {
    const response = await this.api.request({
      method,
      url: `${API_URL}${path}`,
      data: method === "post" ? data || {} : undefined,
      signal: this.signal,
      validateStatus: () => true,
    });

    const payload = response.data || {};

    if (payload["code"] === BANNED_CODE) {
      await this.handleBan(payload);
    }

    if (payload["code"] === HUMAN_REQUIRED_CODE && retryHuman) {
      this.logger.warn("The human pass was refused, passing the check again.");
      await this.obtainHumanPass();
      return this.callApi(method, path, data, { retryHuman: false });
    }

    if (response.status >= 500 || typeof payload !== "object") {
      throw new Error(
        payload?.["error"] || `Request failed (${response.status})`,
      );
    }

    return payload;
  }

  /** Read from the drop's API, throwing a refusal */
  async getFromApi(path) {
    const result = await this.callApi("get", path);

    if (result["success"] === false) {
      throw new Error(result["error"] || `Failed to read ${path}`);
    }

    return result;
  }

  /** Act on the drop's API, returning a refusal as a payload */
  postToApi(path, data = {}) {
    return this.callApi("post", path, data);
  }

  /* --------------------------------------------------------------------- */
  /* Device                                                                */
  /* --------------------------------------------------------------------- */

  /** The account's phone, the same on every run */
  getDevice() {
    return (this.device ||= createVictorsDevice(
      this.getUserId(),
      this.userAgent,
    ));
  }

  /* --------------------------------------------------------------------- */
  /* Ban                                                                   */
  /* --------------------------------------------------------------------- */

  /** Remember the ban and the pass it carries, then stop whatever was running */
  async handleBan(payload) {
    if (payload["humanPass"]) {
      await this.storeHumanPass(payload["humanPass"]);
    }

    this.banInfo = {
      error: payload["error"] || "Account is banned",
      canReset: payload["canReset"] === true,
      termsVersion: String(payload["termsVersion"] || ""),
    };

    throw new Error(
      `${this.banInfo.error}${this.banInfo.canReset ? " (it can be reset from Account tools)" : ""}`,
    );
  }

  /* --------------------------------------------------------------------- */
  /* Session                                                               */
  /* --------------------------------------------------------------------- */

  /** Get Auth */
  fetchAuth() {
    return this.login();
  }

  /** Sign in on the stored pass, or pass the human check when there is none */
  async login() {
    await this.restoreHumanPass();

    if (this.humanPass) {
      this.logger.info("Using stored human pass.");
      return this.loadState();
    }

    await this.obtainHumanPass();

    return this.state_data;
  }

  /** Get Referral Link */
  getReferralLink() {
    return (
      this.state_data?.referral?.["link"] ||
      `https://t.me/VictorsCompanybot/app?startapp=ref_${this.state_data?.referral?.["code"] || ""}`
    );
  }
}
