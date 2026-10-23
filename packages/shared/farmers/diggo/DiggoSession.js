import { API_URL, ERROR_MESSAGES } from "./constants.js";
import AdsGramClient from "../../lib/ads/AdsGramClient.js";
import { createVictorsDevice } from "../../lib/games/victorsDevice.js";

/** Trait: aPI transport, sign-in, browser signals and the risk challenge */
export default class DiggoSession {
  /* --------------------------------------------------------------------- */
  /* Transport                                                             */
  /* --------------------------------------------------------------------- */

  /** Get Auth Headers */
  getAuthHeaders(data) {
    return { Authorization: `Bearer ${data["token"]}` };
  }

  /** Call the game's API, throwing its error code on a refusal as the page does, and clearing a risk challenge once */
  async callApi(method, path, data, idempotencyKey, { retried = false } = {}) {
    const response = await this.api.request({
      method,
      url: `${API_URL}${path}`,
      data,
      headers: idempotencyKey ? { "Idempotency-Key": idempotencyKey } : {},
      signal: this.signal,
      validateStatus: () => true,
    });

    const payload =
      response.data && typeof response.data === "object" ? response.data : {};

    if (response.status < 200 || response.status >= 300) {
      const code = payload["error"] || "internal_error";

      if (
        code === "risk_challenge_required" &&
        !retried &&
        !path.startsWith("/account/risk-challenge")
      ) {
        await this.solveRiskChallenge();

        return this.callApi(method, path, data, idempotencyKey, {
          retried: true,
        });
      }

      const error = new Error(ERROR_MESSAGES[code] || code);
      error.code = code;
      error.status = response.status;
      throw error;
    }

    if (payload["state"]) {
      this.state_data = payload["state"];
    }

    return payload;
  }

  /** Read from the game's API */
  getFromApi(path) {
    return this.callApi("get", path);
  }

  /** Act on the game's API */
  postToApi(path, data = {}, idempotencyKey) {
    return this.callApi("post", path, data, idempotencyKey);
  }

  /** Act on the game's API under a fresh idempotency key, as the page's money writes go out */
  writeToApi(path, data = {}) {
    return this.postToApi(path, data, this.utils.uuid());
  }

  /** The AdsGram client the ad task is watched with */
  get adsgram() {
    return (this._adsgram ||= new AdsGramClient(this.getAdClientOptions()));
  }

  /* --------------------------------------------------------------------- */
  /* Endpoints                                                             */
  /* --------------------------------------------------------------------- */

  /** Sign in with `initData`, which also registers the referrer */
  fetchAuth() {
    return this.postToApi("/auth/telegram", { initData: this.getInitData() });
  }

  /** Get Meta */
  fetchMeta() {
    return this.loadState();
  }

  /** The account's phone, the same on every run, which the browser signals describe */
  getBrowserDevice() {
    return (this.browserDevice ||= createVictorsDevice(
      this.getUserId(),
      this.userAgent,
      { prefix: "diggo-device" },
    ));
  }

  /** Send the page's sign-in signals once per session, never failing the run */
  async reportBrowserSignals() {
    if (this.browserSignalsSent) return;
    this.browserSignalsSent = true;

    const { profile } = this.getBrowserDevice();

    /* Browsers report deviceMemory capped at 8 */
    await this.sendBrowserSignals({
      screen: [profile.screen.w, profile.screen.h, profile.screen.depth],
      cores: profile.cpu,
      memory: Math.min(8, Number(profile.ram) || 4),
      touch: profile.touch,
      webdriver: false,
    }).catch(() => null);
  }

  /** Get Referral Link */
  getReferralLink() {
    return (
      this.state_data?.["friends"]?.["inviteUrl"] ||
      this.constructor.telegramLink
    );
  }
}
