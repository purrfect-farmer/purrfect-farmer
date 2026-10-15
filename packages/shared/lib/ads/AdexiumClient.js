import BaseAdClient from "./BaseAdClient.js";

/** Adexium's bid endpoint, `bidRequestURL` in the widget */
const BID_URL = "https://bid.tgads.live/bid-request";

/** The widget build the drops' pages load, sent as `version` */
const WIDGET_VERSION = 1.81;

/** The widget's countdown before an interstitial can be closed */
const PLAYBACK_SECONDS = 15;

/** Runs an Adexium widget the way `new AdexiumWidget({ wid }).requestAd()` would. See `AdexiumClient.README.md` */
export default class AdexiumClient extends BaseAdClient {
  /**
   * @param {object} [options] - shared context (api, initData, signal, ...), see `BaseAdClient`
   * @param {string} [options.wid] - default widget id for `watch()`
   * @param {string} [options.adFormat] - `interstitial`, `push-like` or `video`
   * @param {string} [options.tgPlatform] - Telegram client platform
   * @param {number} [options.playbackSeconds] - how long to let the ad play
   */
  constructor(options = {}) {
    super(options);

    this.wid = options.wid;
    this.adFormat = options.adFormat || "interstitial";
    this.tgPlatform = options.tgPlatform || "android";
    this.playbackSeconds = options.playbackSeconds;
  }

  /** Watch a rewarded ad, as `requestRewardedAd()` asks for it
   * @param {string} [wid]
   */
  watch(wid = this.wid) {
    return this.play(wid, { motivated: true });
  }

  /** Take an ad, count it and let it play
   * @param {string} [wid]
   * @param {object} [options]
   * @param {boolean} [options.motivated] - whether the viewer is rewarded for it
   * @returns {Promise<object>} the ad the widget would have rendered
   */
  async play(wid = this.wid, { motivated = false } = {}) {
    if (!wid) {
      throw new Error("Adexium needs a widget id");
    }

    const ads = await this.requestAd(wid, motivated);
    const ad = ads[0];

    if (!ad) {
      throw new Error("Adexium returned no ad");
    }

    this.log("Adexium ad:", ad);

    /** The widget fires this the moment the banner is in the page */
    if (ad["notificationUrl"]) {
      await this.request(ad["notificationUrl"]);
    }

    await this.wait(this.getPlaybackSeconds(ad));

    return ad;
  }

  /** Ask Adexium for an ad, as the widget's `requestAd` does */
  async requestAd(wid, motivated) {
    const response = await this.api.post(
      BID_URL,

      /** Sent as the widget's `fetch` sends a string body, as `text/plain` */
      JSON.stringify({
        ...this.getUser(wid),
        adFormat: this.adFormat,
        motivated,
        version: WIDGET_VERSION,

        /** 0 is the anti-fraud checks' clean result, for both generations */
        af: 0,
        afV2: 0,
      }),
      {
        signal: this.signal,
        headers: { Authorization: null, "Content-Type": "text/plain" },
        validateStatus: () => true,
      },
    );

    /** The widget reads a non-2xx or a non-array as "no ad" */
    return Array.isArray(response.data) ? response.data : [];
  }

  /** The viewer as the widget builds it from `Telegram.WebApp` */
  getUser(wid) {
    const user = this.user || {};

    return {
      wid,
      adFormat: this.adFormat,
      tz: new Date().getTimezoneOffset() / -60,
      language: user["language_code"] || "en",
      isPremium: user["is_premium"] || false,
      lastName: user["last_name"] || "",
      username: user["username"] || "",
      firstName: user["first_name"] || "",
      telegramId: Number(user["id"]),
      platform: this.tgPlatform,
      serialized: JSON.stringify(user),
      from: "window",
      initData: this.initData,
      tonConnected: false,
      motivated: false,
    };
  }

  /** Fire a tracker on the shared client, without the drop's `Authorization` */
  request(url) {
    return this.api
      .get(url, { signal: this.signal, headers: { Authorization: null } })
      .catch((error) => {
        this.log("Adexium tracker failed:", error.message);
      });
  }

  /** The ad's own duration plus the close delay, as GigaPub waits on it, or the countdown */
  getPlaybackSeconds(ad) {
    if (this.playbackSeconds != null) return this.playbackSeconds;

    const duration = Number(ad?.["duration"]);

    return duration >= 5 && duration <= 120 ? duration + 5 : PLAYBACK_SECONDS;
  }
}
