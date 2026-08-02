/** AdsGram's own API — never the drop's. */
const ADSGRAM_URL = "https://api.adsgram.ai";

/**
 * The SDK version the drops' pages load. AdsGram keys request validation on
 * it, so it travels with the values below rather than being invented.
 */
const SDK_VERSION = "2.2.0";

/**
 * HMAC-SHA256 secret lifted from AdsGram's `sad.min.js`, where it is hidden
 * behind a Vigenère-style string obfuscator.
 *
 * The key actually used is this secret XORed byte-wise with the current hour,
 * so it rotates hourly on its own — see `sign()`. If AdsGram ever rotates the
 * *secret* instead, `/adv` starts rejecting every request and this constant is
 * the single thing that has gone stale.
 *
 * It can be re-extracted from a fresh `sad.min.js` by evaluating the bundle
 * and reading the value passed to `Uint8Array.from(secret, c => c.charCodeAt(0))`.
 */
const SIGNING_SECRET = "qK8FwLlQdPDlAXzvMJIdZJsvFtXIQBea";

/**
 * How long to leave a banner "playing" before claiming it.
 *
 * AdsGram decides server-side whether a view was long enough to pay, so this
 * is deliberately generous rather than the shortest value that happens to work.
 */
const PLAYBACK_SECONDS = 20;

/**
 * AdsGramClient
 *
 * Runs an AdsGram banner the way the SDK would, for farmers whose drop settles
 * ads server-to-server — where the drop credits nothing directly and the reward
 * only arrives once AdsGram posts it to the drop's backend.
 *
 * The client covers AdsGram and nothing else. Confirming that the reward landed
 * is the drop's business, so it stays in the farmer.
 *
 * Usage:
 *   const adsgram = new AdsGramClient(this);
 *   await adsgram.watch(blockId);
 */
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
    this.topDomain =
      options.topDomain || `https://${farmer.constructor.host}`;
    this.platform = options.platform || "Linux x86_64";
    this.tgPlatform = options.tgPlatform || "android";
    this.tmaVersion = options.tmaVersion || "8.0";
  }

  /** The farmer's abort signal, read late so each run gets its own */
  get signal() {
    return this.farmer.signal;
  }

  /**
   * Watch a rewarded block.
   *
   * @param {string|number} blockId
   */
  watch(blockId) {
    return this.play(blockId, { completion: "reward" });
  }

  /**
   * Run a banner through to its completion tracker.
   *
   * The tracker URLs come back from `/adv` already signed, so this only has to
   * fire them in the order the SDK would: the banner renders, it is shown, it
   * plays out, and only then does it count.
   *
   * @param {string|number} blockId
   * @param {object} [options]
   * @param {string} [options.completion] - `reward` for rewarded blocks,
   *   `skip` for interstitials
   */
  async play(blockId, { completion = "reward" } = {}) {
    const payload = await this.requestBanner(blockId);
    this.farmer.debugger?.log("AdsGram banner:", payload);

    const banner = payload?.banners?.[0]?.banner;
    const trackings = banner?.trackings || [];

    const tracker = (name) =>
      trackings.find((item) => item.name === name)?.value;

    const finish = tracker(completion);

    /**
     * A rewarded block carries `reward`; an interstitial carries `skip` and
     * pays nothing. Firing the rest of the sequence against the wrong one
     * would burn the impression for no credit.
     */
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

  /**
   * Call AdsGram on the farmer's client.
   *
   * `Authorization` is cleared per request: a drop's bearer token lives on the
   * shared axios defaults and has no business reaching a third party.
   *
   * The publisher's `Origin`/`Referer` have to be on the request — AdsGram
   * answers `400 {"error":"Wrong referer"}` without them. The cloud runner
   * sets them for every call and the extension's declarativeNetRequest rules
   * cover whatever is listed in the farmer's `static domains`, which is why
   * `api.adsgram.ai` belongs there.
   */
  request(url) {
    return this.farmer.api
      .get(url, { signal: this.signal, headers: { Authorization: null } })
      .then((res) => res.data);
  }

  /**
   * Build a signed `/adv` query.
   *
   * Parameter order is the SDK's, and is load-bearing: the signature covers
   * the serialized query string, so the server recomputes it over exactly
   * what it received.
   */
  async buildQuery(blockId) {
    const farmer = this.farmer;

    /**
     * Read straight from the raw initData rather than `getInitDataUnsafe()`,
     * which JSON-parses every value. `chat_instance` is a 19-digit id — well
     * past `Number.MAX_SAFE_INTEGER` — so parsing it rounds off the last few
     * digits, and AdsGram would receive an id that never existed.
     */
    const initData = new URLSearchParams(farmer.getInitData() || "");
    const params = new URLSearchParams();

    params.set("envType", "telegram");
    params.set("blockId", String(blockId));
    params.set("platform", this.platform);
    params.set("language", farmer.getTelegramUser()?.["language_code"] || "en");

    /**
     * Read from the Telegram user rather than `getIsPremiumUser()`, which
     * looks for a top-level `is_premium` that initData does not carry.
     */
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

  /**
   * The initData check string, base64url encoded.
   *
   * The ordering is `Intl.Collator`'s rather than a plain sort, because that
   * is what the SDK uses and the two disagree on keys containing `_`.
   */
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

  /**
   * Base64url without padding.
   *
   * Built one byte at a time rather than by spreading into
   * `String.fromCodePoint`, which the SDK does and which blows the call stack
   * on a long enough input.
   */
  toBase64Url(bytes) {
    let binary = "";
    for (const byte of bytes) binary += String.fromCodePoint(byte);

    return btoa(binary)
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=+$/, "");
  }

  /**
   * Sign a query string the way AdsGram's SDK does.
   *
   * The HMAC key is the baked-in secret XORed with the current hour, so it
   * changes by itself every hour — a signature is only good for the hour it
   * was made in.
   */
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
