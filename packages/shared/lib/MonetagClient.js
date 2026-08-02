/**
 * Where the SDK sends everything.
 *
 * The host is baked into each `sad`-style build as an obfuscated literal —
 * `Ys('l.xt#.)=ow')` in the copy this was written against, decoded by the same
 * cipher as `decodeSettings()` below. Publishers on a different SDK domain can
 * pass `host` instead. If Monetag rotates it, every call here starts failing
 * and this constant is the one thing that has gone stale.
 */
const MONETAG_HOST = "e8ys.com";

/** Where the drop's page loads the SDK from, reported back as `dmn` */
const SDK_HOST = "libtl.com";

/** The SDK build the drops' pages ship, sent as `sw_version` */
const SDK_VERSION = "v1.870.0";

/** Trades a locally generated device id for a stable one */
const GIDRATOR_URL = "https://my.rtmark.net/gid.js";

/**
 * The shape the SDK mints its device id in: `a` is a lowercase letter, `N` a
 * digit. Monetag never sees anything else, so anything else stands out.
 */
const DEVICE_ID_PATTERN = "aNaaNNNNNNaaNNNNNNNNNaNaNaaaaNNN";

/**
 * The alphabet the zone settings are encoded with, and the character that
 * marks a low code point. See `decodeSettings()`.
 */
const SETTINGS_ALPHABET =
  "YzR(vh&ekK7r-]syW5=9lH^3qS~MwEoZ*6#:i}NBtAcpV1)4T_0mjUO[xQJuCG2ndP!XI/LDF@8fb|ga,";
const SETTINGS_LOW_MARKER = ".";

/**
 * How long to leave the banner up before closing it.
 *
 * The zone's own `fakepushAutoclose` wins when the settings come back; this is
 * only the fallback, and is deliberately generous.
 */
const PLAYBACK_SECONDS = 15;

/** How hard to chase the reward event, matching the SDK's own retry */
const RESOLVE_ATTEMPTS = 3;
const RESOLVE_INTERVAL_SECONDS = 1.5;

/**
 * MonetagClient
 *
 * Runs a Monetag zone the way `show_<zoneId>()` would, for farmers whose drop
 * serves Monetag ads — either because the drop settles the reward itself and
 * merely expects the ad to have played, or because the zone pays through a
 * server-to-server postback keyed on `ymid`.
 *
 * The client covers Monetag and nothing else. Whether a reward landed on the
 * drop's balance is the drop's business, so that stays in the farmer.
 *
 * Usage:
 *   const monetag = new MonetagClient(this, { zoneId });
 *   await monetag.watch();
 */
export default class MonetagClient {
  /**
   * @param {object} farmer - the farmer instance, for its api/initData/signal
   * @param {object} [options]
   * @param {string|number} [options.zoneId] - default zone for `watch()`
   * @param {number} [options.playbackSeconds] - how long to let the ad play
   * @param {string} [options.host] - Monetag's own host
   * @param {string} [options.sdkHost] - the domain the page loads the SDK from
   * @param {string} [options.tgPlatform] - Telegram client platform
   * @param {object} [options.screen] - screen/window metrics to report
   */
  constructor(farmer, options = {}) {
    this.farmer = farmer;

    this.zoneId = options.zoneId;
    this.playbackSeconds = options.playbackSeconds;
    this.host = options.host || MONETAG_HOST;
    this.sdkHost = options.sdkHost || SDK_HOST;
    this.tgPlatform = options.tgPlatform || "android";

    this.screen = {
      width: 1600,
      height: 900,
      innerWidth: 358,
      innerHeight: 632,
      ...options.screen,
    };

    /** Per-run caches, keyed by zone where the value is zone-specific */
    this.settings = new Map();
  }

  /** The farmer's abort signal, read late so each run gets its own */
  get signal() {
    return this.farmer.signal;
  }

  /**
   * Watch a rewarded zone.
   *
   * `ymid` is what a postback is keyed on — it is the Telegram id the drop's
   * backend will be told about, so it has to be the account being farmed.
   *
   * @param {string|number} [zoneId]
   */
  watch(zoneId = this.zoneId) {
    return this.play(zoneId, { ymid: this.farmer.getUserId() });
  }

  /**
   * Run one ad from a zone, start to finish.
   *
   * The order is the SDK's: identify the device, read the zone's settings,
   * take a banner off the feed, count the impression, leave it up for as long
   * as the zone says, and only then ask what the view was worth.
   *
   * @param {string|number} [zoneId]
   * @param {object} [options]
   * @param {string|number} [options.ymid] - the id a postback is keyed on
   * @returns {Promise<object>} the banner, its `ruid`, and the resolved event
   */
  async play(zoneId = this.zoneId, { ymid } = {}) {
    const zone = String(zoneId ?? "");

    if (!zone) {
      throw new Error("Monetag needs a zone id");
    }

    const oaid = await this.getOaid();
    const settings = await this.getSettings(zone, oaid);
    const feed = await this.requestAd(zone, oaid, ymid, settings);

    const banner = feed?.ads?.[0];
    const ruid = feed?.ruid;

    /**
     * An empty feed is Monetag declining to serve, not a failure to handle:
     * there is nothing to count and nothing to be paid for.
     */
    if (!banner) {
      throw new Error("Monetag returned an empty feed");
    }

    this.farmer.debugger?.log("Monetag banner:", banner);

    await this.countImpression(banner, settings);

    await this.farmer.utils.delayForSeconds(
      this.getPlaybackSeconds(settings),
      { signal: this.signal },
    );

    const event = ruid ? await this.resolve(ruid) : null;

    return { banner, ruid, event };
  }

  /* --------------------------------------------------------------------- */
  /* Device identity                                                       */
  /*                                                                       */
  /* Monetag identifies the viewer by an `oaid` it hands out in exchange    */
  /* for a locally generated id. The generated one is kept for good: a      */
  /* fresh device on every run is the one thing a returning viewer never    */
  /* looks like.                                                           */
  /* --------------------------------------------------------------------- */

  /** The account's Monetag id, minted once and remembered */
  async getOaid() {
    if (this.oaid) return this.oaid;

    const deviceId = await this.getDeviceId();

    const gid = await this.request(`${GIDRATOR_URL}?userId=${deviceId}`)
      .then((data) => data?.gid)
      .catch((error) => {
        this.farmer.debugger?.log("Monetag gid failed:", error.message);
        return null;
      });

    /**
     * A device Monetag has never synced gets its own id handed straight back,
     * which is why this usually returns what it sent. A different id means the
     * exchange found an existing sync; no id at all means it failed, and the
     * SDK falls back to the generated one there too.
     */
    return (this.oaid = gid || deviceId);
  }

  /** The generated device id behind the `oaid`, persisted per account */
  async getDeviceId() {
    if (this.deviceId) return this.deviceId;

    try {
      const saved = await this.farmer.storage?.get("monetag-device");
      if (saved?.value) {
        return (this.deviceId = saved.value);
      }
    } catch (error) {
      this.farmer.debugger?.log("Failed to read Monetag device:", error.message);
    }

    this.deviceId = this.createDeviceId();

    try {
      await this.farmer.storage?.set("monetag-device", {
        value: this.deviceId,
      });
    } catch (error) {
      this.farmer.debugger?.log(
        "Failed to store Monetag device:",
        error.message,
      );
    }

    return this.deviceId;
  }

  /** A device id in the shape the SDK generates */
  createDeviceId() {
    const random = (min, max) =>
      min + (globalThis.crypto.getRandomValues(new Uint32Array(1))[0] %
        (max - min + 1));

    return Array.from(DEVICE_ID_PATTERN, (slot) =>
      slot === "a"
        ? String.fromCharCode(random(97, 122))
        : String.fromCharCode(random(48, 57)),
    ).join("");
  }

  /* --------------------------------------------------------------------- */
  /* Zone settings                                                         */
  /* --------------------------------------------------------------------- */

  /**
   * The zone's own settings, cached for the run.
   *
   * Everything here is best-effort: the settings carry the feed's address and
   * how long the banner is meant to stay up, and there are defaults for both,
   * so a zone that will not hand them over is still watchable.
   */
  async getSettings(zone, oaid) {
    if (this.settings.has(zone)) return this.settings.get(zone);

    const settings = await this.fetchSettings(zone, oaid).catch((error) => {
      this.farmer.debugger?.log("Monetag settings failed:", error.message);
      return null;
    });

    this.farmer.debugger?.log("Monetag settings:", settings);
    this.settings.set(zone, settings);

    return settings;
  }

  /** Ask Monetag how this zone is configured */
  async fetchSettings(zone, oaid) {
    const query = this.buildParams({
      oo: 1,
      "sw_version": SDK_VERSION,
      oaid,
      tgp: this.tgPlatform,
      tglc: this.getLanguage(),
      tgm: 1,
      "var_3": this.farmer.getUserId(),
    });

    /**
     * The page posts a pile of fingerprinting alongside this. The SDK has its
     * own path for when that collection fails and still expects settings back,
     * which is the path taken here.
     */
    const data = await this.farmer.api
      .post(
        `https://${this.host}/401/${zone}?${query}`,
        { "client_hints": {} },
        { signal: this.signal, headers: { Authorization: null } },
      )
      .then((res) => res.data);

    const decoded = this.decodeSettings(this.readText(data));

    return decoded ? JSON.parse(decoded) : null;
  }

  /**
   * Decode a settings response.
   *
   * Every character stands for one code point: its position in the alphabet,
   * plus the alphabet's length unless a `.` came first. So the printable
   * range is spelled with one character and everything below it with two.
   */
  decodeSettings(text) {
    let decoded = "";
    let high = true;

    for (const character of text) {
      if (character === SETTINGS_LOW_MARKER) high = false;

      const index = SETTINGS_ALPHABET.indexOf(character);
      if (index < 0) continue;

      decoded += String.fromCharCode(
        (high ? SETTINGS_ALPHABET.length : 0) + index,
      );
      high = true;
    }

    return decoded;
  }

  /* --------------------------------------------------------------------- */
  /* The ad itself                                                         */
  /* --------------------------------------------------------------------- */

  /** Take a banner off the zone's feed */
  async requestAd(zone, oaid, ymid, settings) {
    const feedUrl = settings?.["fakepushFeedUrl"] || `https://${this.host}/500/`;

    const query = this.buildParams({
      excludes: "",
      oaid,
      ymid: ymid || undefined,
      tgp: this.tgPlatform,
      tglc: this.getLanguage(),

      /** 1 = the page drives the ad itself, which is what this client does */
      sdkp: 1,
      "var_3": this.farmer.getUserId(),
      of: settings?.["fakepushOnlineFiltration"] || undefined,
    });

    const url = this.withCommonParams(
      `${feedUrl}${zone}?${query}`,
      settings,
    );

    return this.parseFeed(await this.request(url));
  }

  /**
   * Count the view.
   *
   * This is the request the money hangs on: it is the impression that becomes
   * the event Monetag pays and posts back on. Everything before it only
   * decides which banner is being counted.
   */
  async countImpression(banner, settings) {
    const impression = banner?.["impression_url"];

    if (!impression) {
      throw new Error("Monetag returned a banner with no impression URL");
    }

    const separator = impression.includes("?") ? "&" : "?";

    await this.request(
      this.withCommonParams(`${impression}${separator}sdkp=1`, settings),
    );

    /* Viewability is reported separately, and only some banners carry it */
    const viewability = banner?.["viewability_url"];

    if (viewability) {
      await this.request(this.withCommonParams(viewability, settings)).catch(
        (error) => {
          this.farmer.debugger?.log(
            "Monetag viewability failed:",
            error.message,
          );
        },
      );
    }
  }

  /**
   * Ask what the view resolved to.
   *
   * Monetag decides asynchronously whether an impression was worth paying
   * for, so this is retried the way the SDK retries it. It reports; it does
   * not settle. A view that never resolves may still have been counted.
   */
  async resolve(ruid) {
    for (let attempt = 0; attempt < RESOLVE_ATTEMPTS; attempt++) {
      if (this.signal?.aborted) break;

      const event = await this.request(
        `https://${this.host}/resolve?ruid=${ruid}`,
      ).catch(() => null);

      if (event) {
        this.farmer.debugger?.log("Monetag event:", event);
        return event;
      }

      await this.farmer.utils.delayForSeconds(
        RESOLVE_INTERVAL_SECONDS * (attempt + 1),
        { signal: this.signal },
      );
    }

    return null;
  }

  /* --------------------------------------------------------------------- */
  /* Requests                                                              */
  /* --------------------------------------------------------------------- */

  /**
   * Call Monetag on the farmer's client.
   *
   * `Authorization` is cleared per request: a drop's bearer token lives on the
   * shared axios defaults and has no business reaching an ad network.
   */
  request(url) {
    return this.farmer.api
      .get(url, { signal: this.signal, headers: { Authorization: null } })
      .then((res) => res.data);
  }

  /**
   * The parameters every call carries — where the page is, what it is running
   * in, and how big the window is. Monetag weighs these when deciding whether
   * a view was real, so they travel with the feed request and the impression
   * alike.
   */
  withCommonParams(url, settings) {
    const screen = this.screen;

    const query = this.buildParams({
      "sw_version": SDK_VERSION,
      "branchId": settings?.["fakepushBranchId"] || undefined,
      dmn: this.sdkHost,
      tgm: 1,
      fs: 0,
      cf: 0,
      sw: screen.width,
      sh: screen.height,
      sah: screen.height,
      wx: 0,
      wy: 0,
      ww: screen.width,
      wh: screen.height,
      cw: screen.innerWidth,
      wiw: screen.innerWidth,
      wih: screen.innerHeight,
      wfc: 1,
      pl: this.farmer.getLaunchURL(),
      drf: "",
      np: 1,
      pt: 0,
      nb: 1,
      ng: 1,
      ix: 1,
      nw: 1,
      tb: false,
      vsbl: true,
      navlng: this.getLanguage(),
      bto: this.getTimezoneOffset(),
      btz: this.getTimezone(),
      jsp: 1,
    });

    return `${url}${url.includes("?") ? "&" : "?"}${query}`;
  }

  /** Serialize, dropping what the SDK would have left out entirely */
  buildParams(values) {
    const params = new URLSearchParams();

    for (const [key, value] of Object.entries(values)) {
      if (value === undefined || value === null) continue;
      params.set(key, String(value));
    }

    return params.toString();
  }

  /**
   * Read a feed response.
   *
   * The same endpoint answers with plain JSON or with base64 depending on the
   * banner, so both are accepted. The decode goes through UTF-8 — banner
   * titles carry emoji, and `atob` alone would mangle them.
   */
  parseFeed(data) {
    if (data && typeof data === "object") return data;

    const text = String(data ?? "").trim();
    if (!text) return null;

    if (text.startsWith("{")) return JSON.parse(text);

    const bytes = Uint8Array.from(atob(text), (character) =>
      character.charCodeAt(0),
    );

    return JSON.parse(new TextDecoder().decode(bytes));
  }

  /** A response body as the string it was sent as */
  readText(data) {
    if (typeof data === "string") return data;

    /* A quoted string parses to a string; anything else is not settings */
    return typeof data === "object" ? "" : String(data ?? "");
  }

  /* --------------------------------------------------------------------- */
  /* Environment                                                           */
  /* --------------------------------------------------------------------- */

  /** How long to leave the ad up, as the zone asked */
  getPlaybackSeconds(settings) {
    if (this.playbackSeconds != null) return this.playbackSeconds;

    const autoclose = Number(settings?.["fakepushAutoclose"]);

    return autoclose > 0 ? autoclose : PLAYBACK_SECONDS;
  }

  getLanguage() {
    return this.farmer.getTelegramUser()?.["language_code"] || "en";
  }

  getTimezoneOffset() {
    try {
      return new Date().getTimezoneOffset();
    } catch {
      return 0;
    }
  }

  getTimezone() {
    try {
      return Intl.DateTimeFormat().resolvedOptions().timeZone;
    } catch {
      return "";
    }
  }
}
