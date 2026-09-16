/** AdsGram's own API - never the drop's. */
const ADSGRAM_URL = "https://api.adsgram.ai";

/** The SDK version the drops' pages load, which AdsGram keys request validation on */
const SDK_VERSION = "2.2.0";

/** HMAC-SHA256 secret lifted from `sad.min.js`, re-extracted as the README describes */
const SIGNING_SECRET = "qK8FwLlQdPDlAXzvMJIdZJsvFtXIQBea";

/** How long to leave a banner playing, generous because AdsGram judges the view server side */
const PLAYBACK_SECONDS = 20;

/** Runs an AdsGram banner the way the SDK would. See `AdsGramClient.README.md` */
export default class AdsGramClient {
  /**
   * @param {object} farmer - the farmer instance, for its api/initData/signal
   * @param {object} [options]
   * @param {number} [options.playbackSeconds] - how long to let the ad play
   * @param {string} [options.topDomain] - defaults to the farmer's own host
   * @param {string} [options.platform] - `navigator.platform` to report
   * @param {string} [options.tgPlatform] - Telegram client platform
   * @param {string} [options.tmaVersion] - mini-app API version
   */
  constructor(farmer, options = {}) {
    this.farmer = farmer;

    this.playbackSeconds = options.playbackSeconds ?? PLAYBACK_SECONDS;
    this.topDomain = options.topDomain || `https://${farmer.constructor.host}`;
    this.platform = options.platform || "Linux x86_64";
    this.tgPlatform = options.tgPlatform || "android";
    this.tmaVersion = options.tmaVersion || "8.0";
  }

  /** The farmer's abort signal, read late so each run gets its own */
  get signal() {
    return this.farmer.signal;
  }

  /** Watch a rewarded block
   * @param {string|number} blockId
   */
  watch(blockId) {
    return this.play(blockId, { completion: "reward" });
  }

  /** Run a banner through to its completion tracker, firing each one in the SDK's order
   * @param {string|number} blockId
   * @param {object} [options]
   * @param {string} [options.completion] - `reward` for rewarded blocks, `skip` for interstitials
   */
  async play(blockId, { completion = "reward" } = {}) {
    const payload = await this.requestBanner(blockId);
    this.farmer.debugger?.log("AdsGram banner:", payload);

    const banner = payload?.banners?.[0]?.banner;
    const trackings = banner?.trackings || [];

    const tracker = (name) =>
      trackings.find((item) => item.name === name)?.value;

    const finish = tracker(completion);

    /** Tracking against the wrong completion would burn the impression for no credit */
    if (!finish) {
      throw new Error(`AdsGram returned a block with no "${completion}" step`);
    }

    await this.fireTracker(tracker("render"));
    await this.fireTracker(tracker("show"));

    await this.farmer.utils.delayForSeconds(this.playbackSeconds, {
      signal: this.signal,
    });

    await this.fireTracker(finish);

    return payload;
  }

  /** Ask AdsGram for a banner */
  async requestBanner(blockId) {
    const query = await this.buildQuery(blockId);
    return this.request(`${ADSGRAM_URL}/adv?${query}`);
  }

  /** Fire one tracker, if the banner carried it */
  async fireTracker(url) {
    if (!url) return;

    await this.request(url).catch((error) => {
      this.farmer.debugger?.log("AdsGram tracker failed:", error.message);
    });
  }

  /** Call AdsGram on the farmer's client, without the drop's `Authorization` */
  request(url) {
    return this.farmer.api
      .get(url, { signal: this.signal, headers: { Authorization: null } })
      .then((res) => res.data);
  }

  /** Build a signed `/adv` query, in the SDK's parameter order because the signature covers it */
  async buildQuery(blockId) {
    const farmer = this.farmer;

    /** Read raw, since JSON-parsing rounds off the 19-digit `chat_instance` */
    const initData = new URLSearchParams(farmer.getInitData() || "");
    const params = new URLSearchParams();

    params.set("envType", "telegram");
    params.set("blockId", String(blockId));
    params.set("platform", this.platform);
    params.set("language", farmer.getTelegramUser()?.["language_code"] || "en");

    /** Read from the Telegram user, the only place initData carries `is_premium` */
    if (farmer.getTelegramUser()?.["is_premium"]) {
      params.set("is_premium", "true");
    }

    if (initData.has("chat_type")) {
      params.set("chat_type", initData.get("chat_type"));
    }

    if (initData.has("chat_instance")) {
      params.set("chat_instance", initData.get("chat_instance"));
    }

    params.set("top_domain", this.topDomain);

    if (initData.has("signature")) {
      params.set("signature", initData.get("signature"));
    }

    params.set("data_check_string", this.buildDataCheckString());
    params.set("sdk_version", SDK_VERSION);
    params.set("tg_id", String(farmer.getUserId()));
    params.set("tg_platform", this.tgPlatform);
    params.set("tma_version", this.tmaVersion);
    params.set("request_id", this.makeRequestId());

    const query = params.toString();
    params.set("raw", await this.sign(query));

    return params.toString();
  }

  /** Three random 32-bit values run together, as the SDK builds it */
  makeRequestId() {
    return globalThis.crypto.getRandomValues(new Uint32Array(3)).join("");
  }

  /** The initData check string, base64url encoded and ordered the way the SDK orders it */
  buildDataCheckString() {
    const initData = this.farmer.getInitData();
    if (!initData) return "";

    const pairs = [];

    for (const [key, value] of new URLSearchParams(initData)) {
      if (key === "hash" || key === "signature") continue;
      pairs.push(`${key}=${value}`);
    }

    pairs.sort(new Intl.Collator("en").compare);

    return this.toBase64Url(new TextEncoder().encode(pairs.join("\n")));
  }

  /** Base64url without padding, built one byte at a time so a long input cannot blow the stack */
  toBase64Url(bytes) {
    let binary = "";
    for (const byte of bytes) binary += String.fromCodePoint(byte);

    return btoa(binary)
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=+$/, "");
  }

  /** Sign a query the way the SDK does, with a key that rotates itself hourly */
  async sign(query) {
    const hour = Math.floor(Date.now() / 1000 / 3600);

    const secret = Uint8Array.from(
      SIGNING_SECRET,
      (character, index) => character.charCodeAt(0) ^ ((hour + index) % 256),
    );

    const key = await globalThis.crypto.subtle.importKey(
      "raw",
      secret,
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign"],
    );

    const signature = await globalThis.crypto.subtle.sign(
      "HMAC",
      key,
      new TextEncoder().encode(query),
    );

    return Array.from(new Uint8Array(signature))
      .map((byte) => byte.toString(16).padStart(2, "0"))
      .join("");
  }
}
