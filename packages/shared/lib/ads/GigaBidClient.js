/** GigaPub's own bid network */
const BID_NET_URL = "https://bid-net.gigapub.tech";

/** The core build `loader.js` pulls in, sent as `x-version` */
const SDK_VERSION = "v40";

/** Modes 2 and 4 bid in real time, the rest take from the offer list */
const RTB_MODES = [2, 4];

/** Modes 3 and 4 are interstitial, the rest rewarded */
const INTERSTITIAL_MODES = [3, 4];

/** When the creative's trackers fire after it is shown */
const SHOW_TRACKER_SECONDS = 2;
const REWARD_TRACKER_SECONDS = 10;

/** How long an ad stays up: rewarded placements run longer unless the ad says otherwise */
const REWARDED_SECONDS = 15;
const INTERSTITIAL_SECONDS = 8;

/** Runs a GigaPub bid-net placement the way `gigaBidInit()`'s show function would. See `GigaBidClient.README.md` */
export default class GigaBidClient {
  /**
   * @param {object} farmer - the farmer instance, for its api/initData/signal
   * @param {object} options
   * @param {string|number} options.projectId - the GigaPub project id
   * @param {string|number} options.placementId - the bid-net placement id
   * @param {number} [options.mode] - `m` in GigaPub's config, 2 for real-time bidding
   * @param {string} [options.tgPlatform] - Telegram client platform
   * @param {string} [options.tgVersion] - Telegram WebApp version
   */
  constructor(farmer, options = {}) {
    this.farmer = farmer;

    this.projectId = String(options.projectId ?? "");
    this.placementId = String(options.placementId ?? "");
    this.mode = Number(options.mode) || 1;
    this.tgPlatform = options.tgPlatform || "android";
    this.tgVersion = options.tgVersion || "8.0";
  }

  /** The farmer's abort signal, read late so each run gets its own */
  get signal() {
    return this.farmer.signal;
  }

  /** Show the next ad, or the whole stack it belongs to
   * @returns {Promise<object[]>} the ads shown
   */
  async watch() {
    const rewarded = !INTERSTITIAL_MODES.includes(this.mode);
    const stack = await this.getAdStack();

    if (!stack.length) {
      throw new Error("GigaPub bid-net has no ad");
    }

    const stackId = stack[0]["stackId"] || null;

    for (const [index, ad] of stack.entries()) {
      if (this.signal?.aborted) break;

      await this.show(ad, { rewarded, stackId, stackIndex: index });
    }

    return stack;
  }

  /** Run one ad through its events and trackers in the core's order */
  async show(ad, { rewarded, stackId, stackIndex }) {
    const transactionId = ad["tId"];
    const trackers = ad?.["ext"]?.["trackers"] || {};
    const startedAt = Date.now();
    const extra = { stackId, stackIndex };
    const passed = () => ({ passedTime: Date.now() - startedAt, ...extra });

    this.farmer.debugger?.log("GigaPub bid-net ad:", ad);

    await this.fireTracker(trackers["render"]);
    await this.sendEvent("adShowStart", transactionId, passed());
    await this.sendEvent("adShowed", transactionId, passed());

    const duration = this.getDuration(ad, rewarded);

    await this.wait(SHOW_TRACKER_SECONDS);
    await this.fireTracker(trackers["show"]);

    /** The reward tracker fires only if the ad is still open when it comes due */
    if (duration > REWARD_TRACKER_SECONDS) {
      await this.wait(REWARD_TRACKER_SECONDS - SHOW_TRACKER_SECONDS);
      await this.fireTracker(trackers["reward"]);
    }

    await this.wait(
      Math.max(0, duration - (Date.now() - startedAt) / 1000),
    );

    await this.sendEvent("adShowEnd", transactionId, passed());
  }

  /* --------------------------------------------------------------------- */
  /* Offers                                                                */
  /* --------------------------------------------------------------------- */

  /** The first ad and the rest of its stack, as `getAdStack` hands them out */
  async getAdStack() {
    const ads = await this.requestAds();
    const first = ads[0];

    if (!first) return [];

    return first["stackId"]
      ? ads.filter((ad) => ad["stackId"] === first["stackId"])
      : [first];
  }

  /** Ask bid-net for the placement's ads */
  async requestAds() {
    const path = RTB_MODES.includes(this.mode) ? "/v1/get-rtb" : "/v1/get-ad";
    const body = { user: this.getUserData() };
    const proof = this.getTelegramProof();

    if (proof) body.tg_proof = proof;

    const data = await this.farmer.api
      .post(`${BID_NET_URL}${path}`, body, {
        signal: this.signal,
        headers: { ...this.getHeaders(), Authorization: null },
      })
      .then((response) => response.data);

    if (!data || data["status"] <= 0) {
      throw new Error(data?.["message"] || "GigaPub bid-net refused the request");
    }

    return Array.isArray(data["ads"]) ? data["ads"] : [];
  }

  /* --------------------------------------------------------------------- */
  /* Reporting                                                             */
  /* --------------------------------------------------------------------- */

  /** Report a show event, best-effort as the core treats it */
  async sendEvent(event, transactionId, data) {
    const path =
      event === "adShowed"
        ? "/v1/ad-showed"
        : event === "adShowClicked"
          ? "/v1/ad-click"
          : "/v1/ad-event";

    try {
      await this.farmer.api.post(
        `${BID_NET_URL}${path}`,
        { event, data, userData: this.getUserData() },
        {
          signal: this.signal,
          headers: {
            ...this.getHeaders(),
            "transaction-id": String(transactionId),
            Authorization: null,
          },
        },
      );
    } catch (error) {
      this.farmer.debugger?.log(`GigaPub ${event} failed:`, error.message);
    }
  }

  /** Fire one of the creative's own trackers; only `https` ones count */
  async fireTracker(url) {
    if (typeof url !== "string" || !url.startsWith("https://")) return;

    await this.farmer.api
      .get(url, { signal: this.signal, headers: { Authorization: null } })
      .catch((error) => {
        this.farmer.debugger?.log("GigaPub tracker failed:", error.message);
      });
  }

  getHeaders() {
    return {
      "placement-id": this.placementId,
      "project-id": this.projectId,
      "x-version": SDK_VERSION,
    };
  }

  /** The launch data the core lifts from `Telegram.WebApp` */
  getUserData() {
    return {
      user: this.farmer.getTelegramUser(),
      platform: this.tgPlatform,
      version: this.tgVersion,
      start_param: this.farmer.getStartParam() || null,
    };
  }

  /** The init data's signed fields and its third-party `signature`, as the core proves the user */
  getTelegramProof() {
    const initData = this.farmer.getInitData();

    if (!initData || initData.length > 4096) return null;

    const fields = [];
    let signature = null;

    for (const [key, value] of new URLSearchParams(initData)) {
      if (key === "signature") signature = value;
      else if (key !== "hash") fields.push(`${key}=${value}`);
    }

    if (!signature || !fields.length) return null;

    return { dcs: fields.sort().join("\n"), sig: signature };
  }

  getDuration(ad, rewarded) {
    const duration = Number(ad?.["ext"]?.["duration"]);

    if (duration > 10) return duration;

    return rewarded ? REWARDED_SECONDS : INTERSTITIAL_SECONDS;
  }

  wait(seconds) {
    return this.farmer.utils.delayForSeconds(seconds, { signal: this.signal });
  }
}
