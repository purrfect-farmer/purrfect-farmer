import MonetagClient from "./MonetagClient.js";

/** GigaPub's own host, which serves the per-project script and the stats API */
const GIGAPUB_HOST = "ad.gigapub.tech";

/** The SDK build the project scripts ship, sent as `version` */
const SDK_VERSION = "v87";

/** Shows at or under this many seconds are reported by the SDK as too fast */
const MIN_SHOW_SECONDS = 2.9;

/** Where GigaPub's Monetag build is loaded from, and the ad host baked into it */
const MONETAG_SDK_HOST = "munqu.com";
const MONETAG_HOST = "d3rem.com";

/** Placement every project script ships, and the rotation it uses */
const DEFAULT_PLACEMENT = "main";
const ROTATION_TYPE = "chanceOrder";

/** Mediates a GigaPub project the way `window.showGiga()` would. See `GigaPubClient.README.md` */
export default class GigaPubClient {
  /**
   * @param {object} farmer - the farmer instance, for its api/initData/signal
   * @param {object} options
   * @param {string|number} options.projectId - the `id` in the page's `ad.gigapub.tech/script?id=` tag
   * @param {string} [options.token] - the project's bearer token, read from its script when left out
   * @param {string|number} [options.zoneId] - the project's Monetag zone, read from its script when left out
   * @param {string} [options.placementId] - the placement to report
   * @param {string} [options.tgPlatform] - Telegram client platform
   * @param {string} [options.tgVersion] - Telegram WebApp version
   * @param {number} [options.playbackSeconds] - how long to let the ad play
   */
  constructor(farmer, options = {}) {
    this.farmer = farmer;

    this.projectId = String(options.projectId ?? "");
    this.token = options.token;
    this.zoneId = options.zoneId;
    this.placementId = options.placementId || DEFAULT_PLACEMENT;
    this.tgPlatform = options.tgPlatform || "android";
    this.tgVersion = options.tgVersion || "8.0";

    this.monetag = new MonetagClient(farmer, {
      host: MONETAG_HOST,
      sdkHost: MONETAG_SDK_HOST,
      tgPlatform: this.tgPlatform,
      playbackSeconds: options.playbackSeconds,
    });

    /** When the "page" loaded, which `init` reports seconds against */
    this.loadedAt = Date.now();
    this.showCounter = 0;
  }

  /** The farmer's abort signal, read late so each run gets its own */
  get signal() {
    return this.farmer.signal;
  }

  /** Show one rewarded ad, as `showGiga()` would
   * @param {object} [options]
   * @param {string} [options.transactionId] - what the page passed to `showGiga`, used as Monetag's `ymid`
   * @param {string} [options.showTag] - what the page passed as `showTag`, reported with the show
   * @returns {Promise<object>} the Monetag result and how long the show took
   */
  async watch({ transactionId = null, showTag = null } = {}) {
    await this.init();

    const network = "monetag";
    const uniqShowId = this.createShowId();
    const anyData = {
      fallPriorityList: [network],
      fallRotationType: ROTATION_TYPE,
      showCounter: 0,
      showTryCounter: 0,
      uniqShowId,
      readyNetsCount: 1,
      showTag,
    };

    await this.report("adShowTryStart", {
      placementId: this.placementId,
      network,
      rotationType: ROTATION_TYPE,
      showCounter: this.showCounter,
      transactionId,
      version: SDK_VERSION,
      anyData,
    });

    const startedAt = Date.now();
    let result;

    try {
      result = await this.monetag.play(this.zoneId, {
        ymid: transactionId || undefined,
      });
    } catch (error) {
      await this.report("adShowError", {
        placementId: this.placementId,
        network,
        rotationType: ROTATION_TYPE,
        showCounter: this.showCounter,
        transactionId,
        error: null,
        anyData: { ...anyData, showTryCounter: 1 },
        version: SDK_VERSION,
      });

      throw error;
    }

    const seconds = (Date.now() - startedAt) / 1000;

    if (seconds <= MIN_SHOW_SECONDS) {
      throw new Error("GigaPub show finished too fast to count");
    }

    this.showCounter++;

    await this.report("adShowed", {
      placementId: this.placementId,
      network,
      rotationType: ROTATION_TYPE,
      showCounter: this.showCounter,
      transactionId,
      version: SDK_VERSION,
      seconds,
      anyData: { ...anyData, showDone: true, showTryCounter: 1 },
    });

    return { ...result, seconds };
  }

  /* --------------------------------------------------------------------- */
  /* Project                                                               */
  /* --------------------------------------------------------------------- */

  /** Read the project's script once and announce the session, as the SDK does on load */
  async init() {
    if (this.initialized) return;

    await this.loadProject();

    await this.report("init", {
      version: SDK_VERSION,
      seconds: (Date.now() - this.loadedAt) / 1000,
    });

    this.initialized = true;
  }

  /** Fill in the token and Monetag zone from the project's own script */
  async loadProject() {
    if (this.token && this.zoneId) return;

    if (!this.projectId) {
      throw new Error("GigaPub needs a project id");
    }

    const script = await this.farmer.api
      .get(`https://${GIGAPUB_HOST}/script`, {
        params: { id: this.projectId },
        responseType: "text",
        signal: this.signal,
        headers: { Authorization: null },
      })
      .then((response) => String(response.data || ""));

    /** The token sits in the string table as the only 32-character alphanumeric literal */
    this.token ||= script.match(/'([A-Za-z0-9]{32})'/)?.[1];
    this.zoneId ||= script.match(/show_(\d+)/)?.[1];

    if (!this.token || !this.zoneId) {
      throw new Error("Could not read the GigaPub project script");
    }

    this.farmer.debugger?.log("GigaPub project:", {
      projectId: this.projectId,
      zoneId: this.zoneId,
    });
  }

  /* --------------------------------------------------------------------- */
  /* Stats                                                                 */
  /* --------------------------------------------------------------------- */

  /** Post an event to GigaPub's stats API, best-effort as the SDK treats it */
  async report(method, args) {
    try {
      const response = await this.farmer.api.post(
        `https://${GIGAPUB_HOST}/v1/ad`,
        { method, args: { user: this.getUserData(), ...args } },
        {
          signal: this.signal,
          headers: {
            "project-id": this.projectId,
            Authorization: `Bearer ${this.token}`,
          },
        },
      );

      return response.data;
    } catch (error) {
      this.farmer.debugger?.log(`GigaPub ${method} failed:`, error.message);
      return null;
    }
  }

  /** The launch data the SDK lifts from `Telegram.WebApp` */
  getUserData() {
    return {
      user: this.farmer.getTelegramUser(),
      platform: this.tgPlatform,
      version: this.tgVersion,
      start_param: this.farmer.getStartParam() || null,
    };
  }

  /** A show id in the SDK's shape: ms into the week, a dot, then a random six-digit tail */
  createShowId() {
    return `${Date.now() % (7 * 864e5)}.${Math.floor(Math.random() * 1e6)}`;
  }
}
