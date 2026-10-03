/** TADS' ad server, which picks the ad and records its views */
const BACKEND_URL = "https://backend.tads.me";

/** The widget's own key for `write-view` and `write-click`, baked into widget.js */
const WIDGET_API_KEY =
  "d3793382349e86c7ee50a460b688f2cd9276deafee2fbf6732dded87c06ecba8";

/** The widget's types, a fullscreen one is what a rewarded placement uses */
const FULLSCREEN_TYPES = ["FULLSCREEN", "FULLSCREEN_REWARDED"];

/** Delay before an image ad counts as viewed, as the widget waits on it */
const VIEW_DELAY_SECONDS = 1;

/** Close countdowns: rewarded fullscreen, the rest */
const REWARDED_CLOSE_SECONDS = 8;
const CLOSE_SECONDS = 5;

/** The widget allows this many views per window, then refuses to show */
const VIEW_LIMIT = 10;
const VIEW_WINDOW_MS = 30 * 60 * 1000;

/** Runs a TADS widget the way `tads.init({ widgetId, type: "fullscreen" }).showAd()` would. See `TadsClient.README.md` */
export default class TadsClient {
  /**
   * @param {object} farmer - the farmer instance, for its api/initData/signal
   * @param {object} [options]
   * @param {string|number} [options.widgetId] - default widget for `watch()`
   * @param {boolean} [options.rewarded] - whether the widget has a reward callback, sent as `is_rewarded`
   * @param {string} [options.tgPlatform] - Telegram client platform
   * @param {string} [options.tgVersion] - Telegram WebApp version
   * @param {string} [options.referrer] - the drop's origin, which the widget reports as `referrer` and `ref`
   * @param {object} [options.screen] - screen metrics to report
   * @param {number} [options.playbackSeconds] - how long to keep the ad open
   */
  constructor(farmer, options = {}) {
    this.farmer = farmer;

    this.widgetId = options.widgetId;
    this.rewarded = options.rewarded ?? true;
    this.tgPlatform = options.tgPlatform || "android";
    this.tgVersion = options.tgVersion || "8.0";
    this.referrer =
      options.referrer || `https://${this.farmer.constructor.host}`;
    this.playbackSeconds = options.playbackSeconds;

    this.screen = {
      width: 393,
      height: 873,
      dpr: 2.75,
      touchPoints: 5,
      viewportHeight: 873,
      ...options.screen,
    };

    /** The widget's sessionStorage session, kept for the run */
    this.sessionId = crypto.randomUUID();
    this.sequence = 0;
    this.lastLoadMs = null;

    /** The widget's `adViewsTimestamps` */
    this.views = [];
  }

  /** The farmer's abort signal, read late so each run gets its own */
  get signal() {
    return this.farmer.signal;
  }

  /** Watch a rewarded fullscreen ad
   * @param {string|number} [widgetId]
   * @returns {Promise<object>} the ad that was shown
   */
  async watch(widgetId = this.widgetId) {
    if (!widgetId) {
      throw new Error("TADS needs a widget id");
    }

    this.checkViewLimit();

    const data = await this.requestAd(widgetId);
    const ad = data?.["ads"]?.[0];

    if (!ad) {
      throw new Error("TADS returned no ad");
    }

    this.farmer.debugger?.log("TADS ad:", ad);

    const type = String(data["type"] || "FULLSCREEN").toUpperCase();
    const requestId = data["request_id"];

    if (ad["html"]) {
      await this.playHtml(ad, widgetId, requestId, type);
    } else if (ad["vast"]) {
      await this.playVast(ad, widgetId, requestId);
    } else {
      await this.playImage(ad, widgetId, requestId, type);
    }

    return ad;
  }

  /* --------------------------------------------------------------------- */
  /* Formats                                                               */
  /* --------------------------------------------------------------------- */

  /** An HTML (RTB) ad: the win notice goes out with the render, the view a second later */
  async playHtml(ad, widgetId, requestId, type) {
    if (ad["nurl"]) {
      await this.request(this.getWinUrl(ad["nurl"], ad["cpm"]));
    }

    await this.countView(ad, widgetId, requestId);
    await this.wait(this.getCloseSeconds(type) - VIEW_DELAY_SECONDS);
  }

  /** An image ad renders from the template, then counts a second after the image loads */
  async playImage(ad, widgetId, requestId, type) {
    if (!ad["image_url"]) {
      throw new Error("TADS ad has no image");
    }

    await this.request(ad["image_url"]);
    await this.countView(ad, widgetId, requestId);
    await this.wait(this.getCloseSeconds(type) - VIEW_DELAY_SECONDS);
  }

  /** A VAST video counts once it plays, then fires each quartile's trackers */
  async playVast(ad, widgetId, requestId) {
    const vast = this.parseVast(ad["vast"]);
    const seconds =
      this.playbackSeconds ?? vast.skipOffset ?? vast.duration ?? 30;

    if (ad["nurl"]) {
      await this.request(this.getWinUrl(ad["nurl"], ad["cpm"]));
    }

    await this.fireAll(vast.events["start"]);
    await this.countView(ad, widgetId, requestId, 0);

    for (const event of ["firstQuartile", "midpoint", "thirdQuartile"]) {
      await this.wait(seconds / 4);
      await this.fireAll(vast.events[event]);
    }

    await this.wait(seconds / 4);
    await this.fireAll(vast.events["complete"]);
  }

  /* --------------------------------------------------------------------- */
  /* Backend                                                               */
  /* --------------------------------------------------------------------- */

  /** Ask TADS for an ad, with the launch and device data the widget collects */
  async requestAd(widgetId) {
    const user = this.farmer.getTelegramUser() || {};
    const initData = this.farmer.getInitData() || "";

    this.sequence++;

    const params = {
      wid: `${widgetId}`,
      platform: this.getPlatform(),
      locale: `${user["language_code"]}`,
      uid: `${user["id"]}`,
      is_premium: `${Boolean(user["is_premium"])}`,
      is_rewarded: `${this.rewarded}`,
      referrer: this.referrer,
      username: user["username"] ? `${user["username"]}` : "",
      ...(this.getTimezone() ? { tz: this.getTimezone() } : {}),
      wd: "0",
      hl: "0",
      sw: `${this.screen.width}`,
      sh: `${this.screen.height}`,
      dpr: `${this.screen.dpr}`,
      tp: `${this.screen.touchPoints}`,
      twa_v: this.tgVersion,
      twa_cs: "dark",
      twa_vh: `${this.screen.viewportHeight}`,
      twa_exp: "1",
      ...(initData && initData.length <= 4096 ? { tgd: initData } : {}),
      sid: this.sessionId,
      seq: `${this.sequence}`,
      ...(this.lastLoadMs != null ? { plt: `${this.lastLoadMs}` } : {}),
    };

    const startedAt = Date.now();
    const response = await this.farmer.api.get(`${BACKEND_URL}/ads_backend`, {
      params,
      signal: this.signal,
      headers: { Authorization: null, "Content-Type": "application/json" },
    });

    this.lastLoadMs = Date.now() - startedAt;

    return response.data;
  }

  /** Count the view the way the widget's debounced `write-view` does, then fire an RTB ad's pixel */
  async countView(ad, widgetId, requestId, delay = VIEW_DELAY_SECONDS) {
    if (delay) await this.wait(delay);

    const user = this.farmer.getTelegramUser() || {};
    const isRtb = Boolean(ad["isRtb"]);

    this.views.push(Date.now());

    await this.farmer.api.post(
      `${BACKEND_URL}/write-view`,
      {
        is_rtb: isRtb,
        wid: widgetId,
        uid: user["id"],
        username: user["username"],
        first_name: user["first_name"],
        last_name: user["last_name"],
        locale: user["language_code"],
        is_premium: user["is_premium"] || false,
        views: [ad["id"]],
        ...(isRtb ? {} : { viewability: { [ad["id"]]: 100 } }),
        request_id: requestId,
        ref: this.referrer,
      },
      {
        signal: this.signal,
        headers: { Authorization: null, "x-api-key": WIDGET_API_KEY },
      },
    );

    if (isRtb && ad["pixelUrl"]) {
      await this.request(ad["pixelUrl"]);
    }
  }

  /* --------------------------------------------------------------------- */
  /* Helpers                                                               */
  /* --------------------------------------------------------------------- */

  /** The widget refuses a show once 10 views fall inside 30 minutes */
  checkViewLimit() {
    const now = Date.now();

    this.views = this.views.filter((time) => now - time < VIEW_WINDOW_MS);

    if (this.views.length >= VIEW_LIMIT) {
      throw new Error("TADS: too many ads views within 30 minutes");
    }
  }

  /** The win notice with the auction macros filled, as the widget sends it */
  getWinUrl(url, cpm) {
    return cpm === undefined
      ? url
      : url
          .replace("${AUCTION_CURRENCY}", "USD")
          .replace("${AUCTION_PRICE}", encodeURIComponent(cpm));
  }

  /** How long the close button stays locked */
  getCloseSeconds(type) {
    if (this.playbackSeconds != null) return this.playbackSeconds;

    return this.rewarded && FULLSCREEN_TYPES.includes(type)
      ? REWARDED_CLOSE_SECONDS
      : CLOSE_SECONDS;
  }

  /** The widget folds Telegram's platform into ios, android or web */
  getPlatform() {
    switch (this.tgPlatform) {
      case "ios":
        return "ios";
      case "android":
      case "android_x":
        return "android";
      case "unknown":
        return "unknown";
      default:
        return "web";
    }
  }

  getTimezone() {
    try {
      return Intl.DateTimeFormat().resolvedOptions().timeZone || "";
    } catch {
      return "";
    }
  }

  /** The trackers, duration and skip offset out of a VAST document, as the widget's player reads them */
  parseVast(xml) {
    const text = (value) =>
      value
        .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/, "$1")
        .replace(/<[^>]+>/g, "")
        .trim();

    const toSeconds = (value) => {
      const [hours, minutes, seconds] = value.split(":").map(parseFloat);
      return hours * 3600 + minutes * 60 + seconds;
    };

    const events = {};

    for (const match of xml.matchAll(
      /<Tracking[^>]*event="([^"]+)"[^>]*>([\s\S]*?)<\/Tracking>/g,
    )) {
      const url = text(match[2]);
      if (url) (events[match[1]] ||= []).push(url);
    }

    const duration = xml.match(/<Duration>\s*([\d:.]+)/)?.[1];
    const linear = xml.match(/<Linear\b[^>]*>/)?.[0];
    const skipOffset = linear?.match(/skipoffset="([^"]+)"/)?.[1];

    return {
      events,
      duration: duration ? toSeconds(duration) : null,

      /** The player's skip time: none means 30, a percentage means the full video */
      skipOffset: !linear
        ? null
        : !skipOffset
          ? 30
          : skipOffset.endsWith("%")
            ? null
            : toSeconds(skipOffset),
    };
  }

  /** Fire every tracker once */
  async fireAll(urls = []) {
    for (const url of new Set(urls.filter(Boolean))) {
      await this.request(url);
    }
  }

  /** Fire a tracker on the farmer's client, without the drop's `Authorization` */
  request(url) {
    return this.farmer.api
      .get(url, { signal: this.signal, headers: { Authorization: null } })
      .catch((error) => {
        this.farmer.debugger?.log("TADS tracker failed:", error.message);
      });
  }

  wait(seconds) {
    if (seconds <= 0) return;

    return this.farmer.utils.delayForSeconds(seconds, { signal: this.signal });
  }
}
