import FarmerModule from "../../lib/farmer/FarmerModule.js";
import {
  API_URL,
  BANNED,
  TURNSTILE_REQUIRED,
  MISSIONS_PAGE_SIZE,
  WITHDRAWAL_HISTORY_LIMIT,
} from "./constants.js";

/** The game's API: its transport and one method per endpoint */
export default class MonsterlandApi extends FarmerModule {
  /* --------------------------------------------------------------------- */
  /* Transport                                                             */
  /* --------------------------------------------------------------------- */

  /** Carry `initData` on every call the game's own API receives, and on no others */
  configure() {
    const interceptor = this.api.interceptors.request.use((config) => {
      if (String(config.url || "").startsWith(API_URL)) {
        config.headers["Authorization"] = `tma ${this.core.initData()}`;
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
      await this.ctx.humanCheck.obtain();
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
  /* Endpoints                                                             */
  /* --------------------------------------------------------------------- */

  /** The full account state, monsters included, read the way the page reads it on launch */
  fetchUser() {
    return this.callApi("get", "/user", {
      params: { include: "monsters" },
      headers: { "x-app-signal": "initialize" },
    }).then((result) => {
      if (!result.ok) {
        throw new Error(
          result.data["error"] || `Failed to load user (${result.status})`,
        );
      }

      return result.data;
    });
  }

  /** The referral program's state */
  fetchReferral() {
    return this.getFromApi("/referral");
  }

  /** The game's live settings, withdrawal quota included, kept for the minimum */
  async fetchConfig() {
    this.ctx.state.config = await this.getFromApi("/config", { quota: 1 });
    return this.ctx.state.config;
  }

  /** Change the player's own settings, the wallet included */
  patchUser(data) {
    return this.callApi("patch", "/user", { data });
  }

  /** The newest payment history rows */
  fetchPaymentHistory(limit = WITHDRAWAL_HISTORY_LIMIT) {
    return this.getFromApi("/payments/history", { limit, skip: 0 }).then(
      (result) => result["history"] || [],
    );
  }

  /** One page of a mission bucket */
  fetchMissions(bucket, cursor) {
    const params = {
      tab: "available",
      bucket,
      limit: String(MISSIONS_PAGE_SIZE),
    };

    if (cursor) params.cursor = cursor;

    return this.getFromApi("/missions", params);
  }

  /** Claim today's streak reward */
  claimDailyStreak() {
    return this.postToApi("/daily-streak", { action: "claim" });
  }

  /** Have the backend check the account joined the official channel */
  checkStreakChannel() {
    return this.postToApi("/daily-streak", { action: "check_channel" });
  }

  /** Use or buy a vital item on a monster */
  applyVitalItem(monsterId, itemId, action) {
    return this.postToApi("/vitals", {
      monsterId,
      itemId,
      action,
      quantity: 1,
    });
  }

  /** Put a monster to sleep, or wake it */
  changeSleep(monsterId, action) {
    return this.postToApi("/sleep", { monsterId, action });
  }

  /** Spend XP and lumis on a level */
  levelUp(monsterId) {
    return this.postToApi("/xp", { action: "level_up", monsterId });
  }

  /** Trade five fragments for an egg */
  claimEggFromFragments(type) {
    return this.postToApi("/eggs/claim-from-fragments", { type });
  }

  /** Start incubating an egg from the inventory */
  incubateEgg(eggType) {
    return this.postToApi("/eggs/incubate", { egg_type: eggType });
  }

  /** Hatch an egg whose incubation has ended */
  hatchEgg(eggId) {
    return this.postToApi("/eggs/hatch", { egg_id: eggId });
  }

  /** Claim a referral reward: `lumis`, `initial_bonus`, or a `goal` by id */
  claimReferral(type, id) {
    return this.postToApi(
      "/referral/claim",
      id === undefined ? { type } : { type, id },
    );
  }

  /** Buy from the store with lumis, `monster_slot` and `mystery_egg` being what Grow buys */
  buyWithLumis(type, itemId) {
    return this.postToApi("/store", { type, itemId, paymentMethod: "lumis" });
  }

  /** Claim a finished mission */
  claimMission(missionId) {
    return this.postToApi("/missions/claim", { missionId });
  }

  /** Request a payout of lumis, keyed so a retry is not paid twice */
  requestWithdrawal(amount) {
    return this.postToApi(
      "/payments/withdraw",
      { amount: Number(amount) },
      { "X-Request-ID": crypto.randomUUID() },
    );
  }

  /** Ask the backend for an ad to watch on behalf of an action */
  createAdTask(action, metadata, fallback) {
    return this.postToApi("/ads/create-task", {
      action,
      metadata,
      ...fallback,
    });
  }

  /** Report a watched ad to the backend */
  completeAd(adTxId, provider, extra = {}) {
    return this.postToApi("/ads/complete", { adTxId, provider, ...extra });
  }

  /** Give up on an ad the backend handed out */
  abandonAd(adTxId, nonValued = false) {
    return this.postToApi("/ads/abandon", {
      adTxId,
      ...(nonValued && { nonValued: true }),
    }).catch(() => null);
  }

  /** Whether the backend has settled an ad, `null` while it is still pending */
  fetchAdTaskResult(txId) {
    return this.callApi("get", "/ads/task-result", { params: { txId } }).then(
      (result) =>
        result.ok && result.data && result.data["pending"] !== true
          ? result.data
          : null,
    );
  }
}
