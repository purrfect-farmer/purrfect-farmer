import { md5 } from "../../utils/core.js";

/** Where each publisher's widget config lives, keyed by the MD5 of its id */
const CONFIG_URL = "https://cdn.adx1.com/publisher-config/";

/** Bid endpoints, one per region, with the widget's SSP as the subdomain */
const BID_URLS = {
  eu: "https://{{ssp_id}}.xml.4armn.com/telegram-bid",
  us: "https://{{ssp_id}}.xml.adx1.com/telegram-bid",
};

/** Region-scoped helpers the SDK talks to */
const USERINFO_URL =
  "https://{{region}}.convers.link/users/info?callback=userinfo_rp_pu";
const ANTI_FRAUD_URL = "https://{{region}}.favorit.work/nty/taf";
const VIDEO_METRICS_URL = "https://{{region}}.favorit.work/nty/tg/video/metrics";

/** The two widget types a drop can trigger, and their defaults when the config is silent */
const WIDGET_TYPES = {
  native: { type: "PUSH_STYLE", sspId: 13988, bidFloor: 0.0001 },
  interstitial: { type: "INTERSTITIAL_MIXED", sspId: 14657, bidFloor: 0.05 },
};

/** How long an interstitial runs when the widget config does not say */
const INTERSTITIAL_SECONDS = 10;

/** GigaPub holds a native notification at least this long */
const NATIVE_SECONDS = 3.2;

/** Runs a RichAds widget the way `TelegramAdsController` would. See `RichAdsClient.README.md` */
export default class RichAdsClient {
  /**
   * @param {object} farmer - the farmer instance, for its api/initData/signal
   * @param {object} options
   * @param {string|number} options.pubId - the publisher id passed to `initialize`
   * @param {string|number} options.appId - the app id passed to `initialize`
   * @param {string} [options.tgPlatform] - Telegram client platform
   * @param {string} [options.tgVersion] - Telegram WebApp version
   * @param {number} [options.playbackSeconds] - how long to let the ad play
   */
  constructor(farmer, options = {}) {
    this.farmer = farmer;

    this.pubId = String(options.pubId ?? "");
    this.appId = String(options.appId ?? "");
    this.tgPlatform = options.tgPlatform || "android";
    this.tgVersion = options.tgVersion || "8.0";
    this.playbackSeconds = options.playbackSeconds;
  }

  /** The farmer's abort signal, read late so each run gets its own */
  get signal() {
    return this.farmer.signal;
  }

  /** Run the interstitial, as `triggerInterstitialVideo()` and `triggerInterstitialBanner()` do */
  interstitial() {
    return this.play("interstitial");
  }

  /** Run a native push-style notification, as `triggerNativeNotification()` does */
  native() {
    return this.play("native");
  }

  /** Take an ad for a widget type, count it and let it play
   * @param {"interstitial"|"native"} kind
   * @returns {Promise<object>} the ad the widget would have rendered
   */
  async play(kind) {
    await this.init();

    const widget = this.getWidget(kind);

    if (!widget) {
      throw new Error(`RichAds app ${this.appId} has no active ${kind} widget`);
    }

    const ads = await this.requestAds(widget);
    const ad = ads[0];

    /** The SDK falls back to Yandex here, which a headless run cannot play */
    if (!ad) {
      throw new Error("RichAds returned no ad");
    }

    this.farmer.debugger?.log("RichAds ad:", ad);

    if (ad["creative_type"] === "vast") {
      await this.playVast(ad, widget);
    } else if (ad["creative_type"] === "interstitial video") {
      await this.playVideo(ad, widget);
    } else {
      if (ad["notification_url"]) {
        await this.request(ad["notification_url"]);
      }

      await this.wait(this.getPlaybackSeconds(kind, widget));
    }

    return ad;
  }

  /* --------------------------------------------------------------------- */
  /* Session                                                               */
  /* --------------------------------------------------------------------- */

  /** Read the region, IP and widget config once, then send the daily anti-fraud ping */
  async init() {
    if (this.initialized) return;

    if (!this.pubId || !this.appId) {
      throw new Error("RichAds needs a pubId and an appId");
    }

    await Promise.all([this.loadConfig(), this.loadUserInfo()]);
    await this.sendAntiFraud();

    this.initialized = true;
  }

  /** The publisher's widget ids, active types and SSPs */
  async loadConfig() {
    const config = await this.farmer.api
      .get(`${CONFIG_URL}${md5(this.pubId)}.json`, {
        signal: this.signal,
        headers: { Authorization: null, accept: "application/json" },
      })
      .then((response) => response.data?.["telegram"]);

    const app = config?.["app_id"]?.[this.appId];

    if (!app) {
      throw new Error(`RichAds has no config for app ${this.appId}`);
    }

    this.app = app;
    this.widgetConfigs = config["widget"] || {};
  }

  /** The viewer's IP and region, from the SDK's JSONP lookup */
  async loadUserInfo() {
    const region = await this.getRegion();
    const text = await this.farmer.api
      .get(USERINFO_URL.replace("{{region}}", region), {
        signal: this.signal,
        responseType: "text",
        headers: { Authorization: null },
      })
      .then((response) => String(response.data || ""));

    const info = JSON.parse(text.match(/\((\{[\s\S]*\})\)/)?.[1] || "{}");

    this.ip = info["ip"];

    /** The lookup can move the viewer to the other region, which the SDK remembers */
    const next = String(info["region"] || "").toLowerCase();

    if (next in BID_URLS && next !== region) {
      this.region = next;
      await this.farmer.storage?.set("richads-region", { value: next });
    }
  }

  /** The region the SDK picked for this viewer, at random once and then remembered */
  async getRegion() {
    if (this.region) return this.region;

    const saved = await Promise.resolve(
      this.farmer.storage?.get("richads-region"),
    ).catch(() => null);

    if (saved?.value in BID_URLS) {
      return (this.region = saved.value);
    }

    this.region = Math.random() < 0.5 ? "eu" : "us";
    await this.farmer.storage?.set("richads-region", { value: this.region });

    return this.region;
  }

  /** The device report the SDK sends once a day */
  async sendAntiFraud() {
    const key = `richads-afd-${this.pubId}-${this.appId}`;
    const sentAt = Number((await this.farmer.storage?.get(key))?.value) || 0;

    if (Date.now() - sentAt < 864e5) return;

    const widgetTypes = this.app["widgetTypes"] || {};
    const sspIds = Object.values(WIDGET_TYPES)
      .filter(({ type }) => this.isActive(type))
      .map(({ type, sspId }) => this.getWidgetConfig(type)?.["ssp_id"] ?? sspId);

    await this.farmer.api
      .post(
        ANTI_FRAUD_URL.replace("{{region}}", this.region),
        JSON.stringify({
          ...this.getClientInfo(),
          ssp_id: sspIds,
          publisher_id: this.pubId,
          site_id: Object.values(widgetTypes),
          telegram_id: String(this.farmer.getUserId()),
          ip: String(this.ip),
          telegram_init: true,
          current_date: String(Math.floor(Date.now() / 1000)),
          auth_date: String(this.getAuthDate()),
        }),
        {
          signal: this.signal,
          headers: { Authorization: null, "Content-Type": "text/plain" },
        },
      )
      .then(() => this.farmer.storage?.set(key, { value: Date.now() }))
      .catch((error) => {
        this.farmer.debugger?.log("RichAds anti-fraud failed:", error.message);
      });
  }

  /* --------------------------------------------------------------------- */
  /* Widgets                                                               */
  /* --------------------------------------------------------------------- */

  isActive(type) {
    return Boolean(
      this.app?.["widgetTypes"]?.[type] &&
        this.app?.["activeWidgetTypes"]?.includes(type),
    );
  }

  getWidgetConfig(type) {
    return this.widgetConfigs?.[this.app?.["widgetTypes"]?.[type]];
  }

  /** A widget type's id, SSP, floor and interstitial settings, or null when inactive */
  getWidget(kind) {
    const defaults = WIDGET_TYPES[kind];

    if (!defaults || !this.isActive(defaults.type)) return null;

    const config = this.getWidgetConfig(defaults.type) || {};
    const mixed = config["config-interstitial-mixed"] || {};

    return {
      kind,
      widgetId: this.app["widgetTypes"][defaults.type],
      sspId: config["ssp_id"] ?? defaults.sspId,
      bidFloor: defaults.bidFloor,
      width: mixed["banner_width"] ? Number(mixed["banner_width"]) : null,
      height: mixed["banner_height"] ? Number(mixed["banner_height"]) : null,
      adDuration: Number(mixed["ad_duration"]) || INTERSTITIAL_SECONDS,
    };
  }

  /** Ask the widget's SSP for one rewarded ad */
  async requestAds(widget) {
    const url = BID_URLS[this.region].replace("{{ssp_id}}", widget.sspId);
    const body = {
      ...this.getPublisherInfo(),
      number_of_bids: 1,
      motivated: true,
      bid_floor: widget.bidFloor,
      widget_id: widget.widgetId,
    };

    /** Only interstitials carry a size; the SDK strips it for push-style */
    if (widget.kind === "interstitial") {
      body.width = widget.width;
      body.height = widget.height;
    }

    const data = await this.farmer.api
      .post(url, JSON.stringify(body), {
        signal: this.signal,
        headers: { Authorization: null, "Content-Type": "text/plain" },
      })
      .then((response) => response.data)
      .catch((error) => {
        this.farmer.debugger?.log("RichAds bid failed:", error.message);
        return [];
      });

    return Array.isArray(data) ? data : [];
  }

  /** What the SDK reads off `Telegram.WebApp` and sends with every bid */
  getPublisherInfo() {
    const user = this.farmer.getTelegramUser() || {};

    return {
      publisher_id: this.pubId,
      user_agent: this.farmer.userAgent || globalThis.navigator?.userAgent,
      language_code: user["language_code"] || "",
      premium: user["is_premium"] || false,
      last_name: user["last_name"] || "",
      first_name: user["first_name"] || "",
      telegram_id: String(user["id"] || ""),
      version: this.tgVersion,
      platform: this.tgPlatform,
      ip: this.ip,
    };
  }

  /* --------------------------------------------------------------------- */
  /* Video                                                                 */
  /* --------------------------------------------------------------------- */

  /** An interstitial video reports its quartiles to RichAds' own metrics */
  async playVideo(ad, widget) {
    if (ad["notification_url"]) {
      await this.request(ad["notification_url"]);
    }

    const bidId = this.getBidId(ad);
    const seconds = this.getPlaybackSeconds("interstitial", widget);

    await this.sendVideoMetrics(0, bidId);

    for (const percentage of [25, 50, 75, 100]) {
      await this.wait(seconds / 4);
      await this.sendVideoMetrics(percentage, bidId);
    }
  }

  /** A VAST video fires its impressions up front, then each quartile's trackers */
  async playVast(ad, widget) {
    const vast = this.parseVast(ad["html"] || "");
    const seconds =
      vast.duration || this.getPlaybackSeconds("interstitial", widget);
    const bidId = this.getBidId(ad);

    await this.fireAll([...vast.impressions, ad["notification_url"]]);
    await this.fireAll(vast.events["start"]);
    await this.sendVideoMetrics(0, bidId);

    for (const [event, percentage] of [
      ["firstQuartile", 25],
      ["midpoint", 50],
      ["thirdQuartile", 75],
      ["complete", 100],
    ]) {
      await this.wait(seconds / 4);
      await this.fireAll(vast.events[event]);
      await this.sendVideoMetrics(percentage, bidId);
    }
  }

  /** The bid id the SDK lifts from the ad's link for its video metrics */
  getBidId(ad) {
    try {
      const params = new URL(ad["link"]).searchParams;
      return params.get("key") || params.get("bid-id");
    } catch {
      return null;
    }
  }

  sendVideoMetrics(percentage, bidId) {
    if (!bidId) return;

    const params = new URLSearchParams({
      percentage,
      muted: true,
      "bid-id": bidId,
    });

    return this.farmer.api
      .post(
        `${VIDEO_METRICS_URL.replace("{{region}}", this.region)}?${params}`,
        null,
        { signal: this.signal, headers: { Authorization: null } },
      )
      .catch((error) => {
        this.farmer.debugger?.log("RichAds metrics failed:", error.message);
      });
  }

  /** The impressions, per-event trackers and duration out of a VAST document */
  parseVast(xml) {
    const text = (value) =>
      value
        .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/, "$1")
        .replace(/<[^>]+>/g, "")
        .trim();

    const impressions = [
      ...xml.matchAll(/<Impression[^>]*>([\s\S]*?)<\/Impression>/g),
    ]
      .map((match) => text(match[1]))
      .filter(Boolean);

    const events = {};

    for (const match of xml.matchAll(
      /<Tracking[^>]*event="([^"]+)"[^>]*>([\s\S]*?)<\/Tracking>/g,
    )) {
      const url = text(match[2]);
      if (url) (events[match[1]] ||= []).push(url);
    }

    const [, hours, minutes, seconds] =
      xml.match(/<Duration>\s*(\d+):(\d+):(\d+)/)?.map(Number) || [];

    return {
      impressions,
      events,
      duration: hours != null ? hours * 3600 + minutes * 60 + seconds : null,
    };
  }

  /* --------------------------------------------------------------------- */
  /* Helpers                                                               */
  /* --------------------------------------------------------------------- */

  /** Fire every tracker once, as the SDK dedupes them */
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
        this.farmer.debugger?.log("RichAds tracker failed:", error.message);
      });
  }

  wait(seconds) {
    return this.farmer.utils.delayForSeconds(seconds, { signal: this.signal });
  }

  getPlaybackSeconds(kind, widget) {
    if (this.playbackSeconds != null) return this.playbackSeconds;

    return kind === "native" ? NATIVE_SECONDS : widget.adDuration;
  }

  getAuthDate() {
    return new URLSearchParams(this.farmer.getInitData() || "").get(
      "auth_date",
    );
  }

  /** The device report, filled with the shape of a phone in Telegram */
  getClientInfo() {
    return {
      sah: 800,
      sh: 800,
      sw: 360,
      saw: 360,
      tzo: new Date().getTimezoneOffset(),
      ww: 360,
      wh: 800,
      wiw: 360,
      wih: 632,
      wx: 0,
      wy: 0,
      ix: 1,
      ri: null,
      ts_detected: 1,
      tz: Intl.DateTimeFormat().resolvedOptions().timeZone,
      nl: this.farmer.getTelegramUser()?.["language_code"] || "en",
      nls: this.farmer.getTelegramUser()?.["language_code"] || "en",
      bm: null,
    };
  }
}
