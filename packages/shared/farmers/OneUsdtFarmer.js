import BaseFarmer from "../lib/BaseFarmer.js";

/** Every endpoint hangs off this one host. */
const API_URL = "https://usdtone.nirajdevbots.space/api";

/** The drop pays in BEP-20 USDT, so balances are read to 4 decimal places. */
const BALANCE_PRECISION = 4;

/* ------------------------------------------------------------------------- */
/* AdsGram                                                                    */
/* ------------------------------------------------------------------------- */

/** AdsGram's own API — not the drop's. */
const ADSGRAM_URL = "https://api.adsgram.ai";

/**
 * The SDK version the drop's page loads. AdsGram keys request validation on
 * it, so it travels with the values below rather than being invented.
 */
const ADSGRAM_SDK_VERSION = "2.2.0";

/**
 * HMAC-SHA256 secret lifted from AdsGram's `sad.min.js`, where it is hidden
 * behind a Vigenère-style string obfuscator.
 *
 * The key actually used is this secret XORed byte-wise with the current hour,
 * so it rotates hourly on its own — see `signAdsGramQuery`. If AdsGram ever
 * rotates the *secret* instead, `/adv` starts rejecting requests and this
 * constant is the thing that has gone stale.
 */
const ADSGRAM_SIGNING_SECRET = "qK8FwLlQdPDlAXzvMJIdZJsvFtXIQBea";

/**
 * How long to leave a rewarded ad "playing" before claiming it.
 *
 * AdsGram decides server-side whether a view was long enough to pay, so this
 * is deliberately generous rather than the shortest value that happens to work.
 */
const ADSGRAM_PLAYBACK_SECONDS = 20;

/** How long to wait for AdsGram's server-to-server postback to land. */
const ADSGRAM_POSTBACK_ATTEMPTS = 6;
const ADSGRAM_POSTBACK_INTERVAL_SECONDS = 5;

/* ------------------------------------------------------------------------- */
/* Ads                                                                        */
/* ------------------------------------------------------------------------- */

/**
 * Added on top of the `minWatchMs` the drop hands back with an ad session.
 * The server compares timestamps, so landing exactly on the boundary is the
 * one way to have a watch rejected for being too fast.
 */
const AD_SESSION_MARGIN_SECONDS = 3;

/** Fallback gap between ads, for the rare response with no `cooldownSeconds`. */
const AD_COOLDOWN_SECONDS = 30;

export default class OneUsdtFarmer extends BaseFarmer {
  static id = "one-usdt";
  static title = "ONE USDT";
  static emoji = "💵";
  static host = "usdtone.nirajdevbots.space";

  /**
   * AdsGram is listed alongside the drop's own host so the extension's
   * declarativeNetRequest rules — and the cloud's header defaults — present
   * the publisher's origin on ad calls too.
   */
  static domains = ["usdtone.nirajdevbots.space", "api.adsgram.ai"];

  static telegramLink =
    "https://t.me/oneusdtappbot/play?startapp=ref_1147265290";
  static path = "/";
  static referrerMode = "random";
  static apiDelay = 500;
  static singleton = true;
  static rating = 5;

  /* --------------------------------------------------------------------- */
  /* Transport                                                             */
  /*                                                                       */
  /* Every call after login carries `Authorization: Bearer <token>`, which  */
  /* BaseFarmer installs from `getAuthHeaders()` onto the shared axios      */
  /* defaults. Requests to AdsGram must therefore strip it explicitly —     */
  /* see `callAdsGram`.                                                     */
  /* --------------------------------------------------------------------- */

  /** GET an endpoint */
  get(path, config = {}) {
    return this.api
      .get(`${API_URL}${path}`, { signal: this.signal, ...config })
      .then((res) => res.data);
  }

  /** POST to an endpoint */
  post(path, payload = null, config = {}) {
    return this.api
      .post(`${API_URL}${path}`, payload, { signal: this.signal, ...config })
      .then((res) => res.data);
  }

  /** PATCH an endpoint */
  patch(path, payload = null, config = {}) {
    return this.api
      .patch(`${API_URL}${path}`, payload, { signal: this.signal, ...config })
      .then((res) => res.data);
  }

  /** The message the API puts behind a failure, which is never `message` */
  readError(error) {
    return error?.response?.data?.error || error?.message || "Unknown error";
  }

  /* --------------------------------------------------------------------- */
  /* API wrappers                                                          */
  /* --------------------------------------------------------------------- */

  /** Exchange initData for a bearer token */
  authenticate(fingerprint) {
    return this.post("/auth/telegram", {
      initData: this.getInitData(),
      fingerprint,
    });
  }

  /** Account state, plus the ad/referral/withdrawal rules for this account */
  getMe() {
    return this.get("/me");
  }

  /** Channels that must be joined before the account may earn */
  getVerification() {
    return this.get("/verify");
  }

  /** Re-check channel membership */
  checkVerification() {
    return this.post("/verify/check");
  }

  /** Per-provider ad allowance and cooldowns */
  getAds() {
    return this.get("/ads");
  }

  /** Open an ad session — only meaningful for providers that are not `s2s` */
  createAdSession(provider) {
    return this.post("/ads/session", { provider });
  }

  /** Redeem an ad session */
  submitAdWatch(provider, sessionToken) {
    return this.post("/ads/watch", { provider, sessionToken });
  }

  /** The task list, split into `official` and `ad` buckets */
  getTasks() {
    return this.get("/tasks");
  }

  /** Claim one task by its `key` */
  claimTask(key) {
    return this.post(`/tasks/${encodeURIComponent(key)}/claim`);
  }

  /** Referral link, rules and roster */
  getInvite() {
    return this.get("/invite");
  }

  /** Withdrawal rules, and the per-check blockers */
  getWithdrawal() {
    return this.get("/withdraw");
  }

  /** Request a payout */
  submitWithdrawal(amount, address) {
    return this.post("/withdraw", { amount, address });
  }

  /** Past payouts */
  getWithdrawalHistory() {
    return this.get("/withdraw/history");
  }

  /** Set the payout address */
  updateWalletAddress(address) {
    return this.patch("/me/wallet", { address });
  }

  /* --------------------------------------------------------------------- */
  /* Session                                                               */
  /* --------------------------------------------------------------------- */

  /** Get Auth */
  async fetchAuth() {
    return this.login();
  }

  /** Get Auth Headers */
  getAuthHeaders(data) {
    return data?.token ? { Authorization: `Bearer ${data.token}` } : {};
  }

  /**
   * Authenticate and adopt the returned session.
   *
   * The headers are configured here rather than left to `setAuth()` alone,
   * because `process()` logs in again on every run and the second token would
   * otherwise never reach the axios defaults.
   */
  async login() {
    const fingerprint = await this.getFingerprint();
    const session = await this.authenticate(fingerprint);

    this.debugger.log("Session:", session);

    this.configureAuthHeaders(session);
    this.session = session;
    this.user = session?.user || null;

    this.assertServiceable(session?.gating);

    return session;
  }

  /**
   * Stop a run the drop will not serve.
   *
   * A banned or under-maintenance account still answers most endpoints, so
   * without this the run would spend its whole ad allowance on rejections.
   */
  assertServiceable(gating) {
    if (gating?.isBanned) {
      throw new Error(`Account is banned: ${gating.banReason || "no reason"}`);
    }

    if (gating?.maintenanceMode) {
      throw new Error("The drop is in maintenance mode.");
    }
  }

  /** Re-read the account state */
  async refreshUser() {
    const payload = await this.getMe();
    this.meta = payload;
    this.user = payload?.user || this.user;
    return payload;
  }

  /** Get User Details */
  getUserDetails() {
    return this.user;
  }

  /** Get Referral Link */
  async getReferralLink() {
    const invite = await this.getInvite().catch(() => null);
    return invite?.link || this.telegramLink;
  }

  /* --------------------------------------------------------------------- */
  /* Fingerprint                                                           */
  /*                                                                       */
  /* The page derives this from the device — user agent, screen, canvas and */
  /* WebGL renderer — and caches it in `localStorage.usdtone_fp`. Reusing   */
  /* that scheme would hand every account farmed from one machine the same  */
  /* value, which is exactly the multi-account signal it exists to catch.   */
  /* A random per-account value is stored instead, and reused for good.     */
  /* --------------------------------------------------------------------- */

  /** The account's fingerprint, minted once and remembered */
  async getFingerprint() {
    if (this.fingerprint) return this.fingerprint;

    try {
      const saved = await this.storage?.get("fingerprint");
      if (saved?.value) {
        this.fingerprint = saved.value;
        return this.fingerprint;
      }
    } catch (error) {
      this.debugger.log("Failed to read stored fingerprint:", error.message);
    }

    this.fingerprint = this.createFingerprint();

    try {
      await this.storage?.set("fingerprint", { value: this.fingerprint });
    } catch (error) {
      this.debugger.log("Failed to store fingerprint:", error.message);
    }

    return this.fingerprint;
  }

  /** 32 hex characters, matching the shape the page would have produced */
  createFingerprint() {
    const bytes = globalThis.crypto.getRandomValues(new Uint8Array(16));

    return Array.from(bytes)
      .map((byte) => byte.toString(16).padStart(2, "0"))
      .join("");
  }

  /* --------------------------------------------------------------------- */
  /* Verification                                                          */
  /* --------------------------------------------------------------------- */

  /**
   * Satisfy the channel gate.
   *
   * Nothing else on the account earns while this is outstanding, so it runs
   * ahead of ads and tasks.
   */
  async completeVerification() {
    const status = await this.getVerification();
    this.debugger.log("Verification:", status);

    if (!status?.required || status?.verified) {
      this.logger.info("Account is verified.");
      return;
    }

    const channels = (status.channels || []).filter(
      (channel) => !channel.joined,
    );

    for (const channel of channels) {
      if (this.signal.aborted) break;

      if (!this.validateTelegramTask(channel.url)) {
        this.logger.info(`Cannot join channel: ${channel.title}`);
        continue;
      }

      await this.tryToJoinTelegramLink(channel.url);
    }

    const result = await this.checkVerification().catch((error) => {
      this.logger.warn("Verification check failed:", this.readError(error));
      return null;
    });

    this.debugger.log("Verification check:", result);

    if (result?.verified) {
      this.logger.success("Account verified!");
    } else {
      this.logger.warn("Account is still unverified.");
    }
  }

  /* --------------------------------------------------------------------- */
  /* Ads                                                                   */
  /*                                                                       */
  /* The drop's biggest earner, and the only part that talks to an ad       */
  /* network. The two providers are settled in opposite directions:         */
  /*                                                                       */
  /*   monetag  (s2s: false) — the drop issues a session token and credits  */
  /*                           the reward itself once it is handed back.    */
  /*   adsgram  (s2s: true)  — the drop credits nothing directly; AdsGram   */
  /*                           posts the reward to its backend, so the ad   */
  /*                           has to be run against AdsGram itself.        */
  /* --------------------------------------------------------------------- */

  /** Watch every ad both providers still owe today */
  async watchAds() {
    const state = await this.getAds();
    this.debugger.log("Ads:", state);

    const providers = state?.providers || [];

    if (!providers.length) {
      this.logger.warn("No ad providers available.");
      return;
    }

    const totals = state?.totals;

    if (totals && !totals.remaining) {
      this.logger.info(
        `Daily ad limit reached - ${totals.watchedToday}/${totals.dailyLimit} watched today.`,
      );
      return;
    }

    let watched = 0;

    for (const provider of providers) {
      if (this.signal.aborted) break;
      watched += await this.watchProviderAds(provider);
    }

    this.logger.success(`Watched ${watched} ad(s).`);
  }

  /** Spend one provider's remaining allowance */
  async watchProviderAds(provider) {
    const name = provider.provider;
    const remaining = Number(provider.remaining) || 0;

    if (remaining <= 0) {
      this.logger.info(
        `${name}: limit reached - ${provider.watchedToday}/${provider.dailyLimit} today.`,
      );
      return 0;
    }

    /* A cooldown left over from an earlier run still has to be waited out */
    await this.waitForAdCooldown(provider.cooldownMs);

    let watched = 0;

    for (let index = 0; index < remaining; index++) {
      if (this.signal.aborted) break;

      if (index > 0) {
        await this.utils.delayForSeconds(
          provider.cooldownSeconds || AD_COOLDOWN_SECONDS,
          { signal: this.signal },
        );
      }

      const credited = await this.watchSingleAd(provider).catch((error) => {
        this.logger.warn(
          `${name}: ad not credited -`,
          this.readError(error),
        );
        return null;
      });

      /* A provider that stops paying will not start again this run */
      if (!credited) break;

      watched++;
      this.logger.success(
        `${name}: +${this.formatAmount(provider.reward)} USDT` +
          ` (${watched}/${remaining})`,
      );
    }

    return watched;
  }

  /** Run one ad, by whichever route its provider settles on */
  async watchSingleAd(provider) {
    return provider.s2s
      ? this.watchServerSettledAd(provider)
      : this.watchSessionAd(provider);
  }

  /**
   * A provider the drop credits itself.
   *
   * The session token is the whole proof — the drop never learns whether an
   * ad played, only that the token came back no sooner than `minWatchMs`.
   */
  async watchSessionAd(provider) {
    const session = await this.createAdSession(provider.provider);
    this.debugger.log("Ad session:", session);

    const minWatchMs = Number(session?.minWatchMs) || 0;

    await this.utils.delayForSeconds(
      minWatchMs / 1000 + AD_SESSION_MARGIN_SECONDS,
      { signal: this.signal },
    );

    const result = await this.submitAdWatch(provider.provider, session?.token);
    this.debugger.log("Ad watch:", result);

    return Boolean(result?.ok);
  }

  /**
   * A provider that settles server-to-server.
   *
   * The reward is credited by AdsGram calling the drop's backend, so the run
   * confirms it by watching the drop's own counter rather than by trusting
   * the tracker responses — which are empty objects either way.
   */
  async watchServerSettledAd(provider) {
    /**
     * Re-read the counter rather than trusting the snapshot the loop started
     * with: after the first ad it is already stale, and comparing against it
     * would report every later ad credited the moment it was checked.
     */
    const before = await this.readWatchedToday(
      provider.provider,
      provider.watchedToday,
    );

    await this.playAdsGramAd(provider.blockId);

    return this.waitForAdPostback(provider.provider, before);
  }

  /** The provider's ad count as the drop currently reports it */
  async readWatchedToday(name, fallback = 0) {
    const state = await this.getAds().catch(() => null);
    const current = (state?.providers || []).find(
      (item) => item.provider === name,
    );

    return Number(current?.watchedToday ?? fallback) || 0;
  }

  /** Poll until the drop reports the ad, or give up */
  async waitForAdPostback(name, before) {
    for (let attempt = 0; attempt < ADSGRAM_POSTBACK_ATTEMPTS; attempt++) {
      await this.utils.delayForSeconds(ADSGRAM_POSTBACK_INTERVAL_SECONDS, {
        signal: this.signal,
      });

      if ((await this.readWatchedToday(name, before)) > before) return true;
    }

    this.logger.warn(`${name}: reward was not confirmed.`);
    return false;
  }

  /** Wait out a cooldown the API reports in milliseconds */
  async waitForAdCooldown(cooldownMs) {
    const remaining = Number(cooldownMs) || 0;
    if (remaining <= 0) return;

    this.logger.info(
      `Waiting ${Math.ceil(remaining / 1000)}s for the ad cooldown...`,
    );

    await this.utils.delay(remaining, { signal: this.signal });
  }

  /* --------------------------------------------------------------------- */
  /* AdsGram                                                               */
  /* --------------------------------------------------------------------- */

  /**
   * Request a rewarded banner and report it watched.
   *
   * The tracker URLs are handed back by `/adv` already signed, so the run
   * only has to fire them in the order the SDK would: the banner renders, it
   * is shown, it plays out, and only then does it count as rewarded.
   */
  async playAdsGramAd(blockId) {
    const payload = await this.requestAdsGramBanner(blockId);
    this.debugger.log("AdsGram banner:", payload);

    const banner = payload?.banners?.[0]?.banner;
    const trackings = banner?.trackings || [];

    const tracker = (name) =>
      trackings.find((item) => item.name === name)?.value;

    const reward = tracker("reward");

    /**
     * An interstitial block has no `reward` tracker. Firing the rest of the
     * sequence against one would burn the impression for nothing.
     */
    if (!reward) {
      throw new Error("AdsGram returned a block that pays no reward");
    }

    await this.pingAdsGram(tracker("render"));
    await this.pingAdsGram(tracker("show"));

    await this.utils.delayForSeconds(ADSGRAM_PLAYBACK_SECONDS, {
      signal: this.signal,
    });

    await this.pingAdsGram(reward);
  }

  /** Ask AdsGram for a banner */
  async requestAdsGramBanner(blockId) {
    const query = await this.buildAdsGramQuery(blockId);
    return this.callAdsGram(`${ADSGRAM_URL}/adv?${query}`);
  }

  /** Fire one tracker, if the banner carried it */
  async pingAdsGram(url) {
    if (!url) return;
    await this.callAdsGram(url).catch((error) => {
      this.debugger.log("AdsGram tracker failed:", error.message);
    });
  }

  /**
   * Call AdsGram on the shared client.
   *
   * `Authorization` is cleared per request: the drop's bearer token lives on
   * the axios defaults and has no business reaching a third party.
   */
  callAdsGram(url) {
    return this.api
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
  async buildAdsGramQuery(blockId) {
    /**
     * Read straight from the raw initData rather than `getInitDataUnsafe()`,
     * which JSON-parses every value. `chat_instance` is a 19-digit id — well
     * past `Number.MAX_SAFE_INTEGER` — so parsing it rounds off the last few
     * digits, and AdsGram would receive an id that never existed.
     */
    const initDataParams = new URLSearchParams(this.getInitData() || "");
    const params = new URLSearchParams();

    params.set("envType", "telegram");
    params.set("blockId", String(blockId));
    params.set("platform", "Linux x86_64");
    params.set("language", this.getTelegramUser()?.["language_code"] || "en");

    /**
     * Read from the Telegram user rather than `getIsPremiumUser()`, which
     * looks for a top-level `is_premium` this drop's initData does not carry.
     */
    if (this.getTelegramUser()?.["is_premium"]) {
      params.set("is_premium", "true");
    }

    if (initDataParams.has("chat_type")) {
      params.set("chat_type", initDataParams.get("chat_type"));
    }

    if (initDataParams.has("chat_instance")) {
      params.set("chat_instance", initDataParams.get("chat_instance"));
    }

    params.set("top_domain", `https://${this.constructor.host}`);

    if (initDataParams.has("signature")) {
      params.set("signature", initDataParams.get("signature"));
    }

    params.set("data_check_string", this.buildDataCheckString());
    params.set("sdk_version", ADSGRAM_SDK_VERSION);
    params.set("tg_id", String(this.getUserId()));
    params.set("tg_platform", "android");
    params.set("tma_version", "8.0");
    params.set("request_id", this.makeAdsGramRequestId());

    const query = params.toString();
    params.set("raw", await this.signAdsGramQuery(query));

    return params.toString();
  }

  /** Three random 32-bit values run together, as the SDK builds it */
  makeAdsGramRequestId() {
    return globalThis.crypto
      .getRandomValues(new Uint32Array(3))
      .join("");
  }

  /**
   * The initData check string, base64url encoded.
   *
   * The ordering is `Intl.Collator`'s rather than a plain sort, because that
   * is what the SDK uses and the two disagree on keys containing `_`.
   */
  buildDataCheckString() {
    const initData = this.getInitData();
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
  async signAdsGramQuery(query) {
    const hour = Math.floor(Date.now() / 1000 / 3600);

    const secret = Uint8Array.from(
      ADSGRAM_SIGNING_SECRET,
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

  /* --------------------------------------------------------------------- */
  /* Tasks                                                                 */
  /* --------------------------------------------------------------------- */

  /** Claim every task this account still has open */
  async completeTasks() {
    const payload = await this.getTasks();
    this.debugger.log("Tasks:", payload);

    const pending = [...(payload?.official || []), ...(payload?.ad || [])].filter(
      (task) => !task.claimed,
    );

    if (!pending.length) {
      this.logger.info("No tasks to complete.");
      return;
    }

    for (const task of pending) {
      if (this.signal.aborted) break;
      await this.completeTask(task);
    }
  }

  /** Meet one task's requirement, then claim it */
  async completeTask(task) {
    const label = task.title || task.key;

    /**
     * `chat_member` is checked against Telegram, so it can only be claimed by
     * an account that actually joined. Without a Telegram client attached the
     * claim would just be refused, so the task is left for a run that has one.
     */
    if (task.verify === "chat_member") {
      if (!this.validateTelegramTask(task.url)) {
        this.logger.info(`Skipped task: ${label} (cannot join ${task.url})`);
        return;
      }

      await this.tryToJoinTelegramLink(task.url);
    }

    try {
      const result = await this.claimTask(task.key);
      this.debugger.log(`Task result (${task.key}):`, result);

      if (result?.ok) {
        this.logger.success(
          `Completed task: ${label} (+${this.formatAmount(result.reward)} USDT)`,
        );
      } else {
        this.logger.info(`Task not credited: ${label}`);
      }
    } catch (error) {
      this.logger.warn(`Task "${label}" failed:`, this.readError(error));
    }
  }

  /* --------------------------------------------------------------------- */
  /* Referrals                                                             */
  /* --------------------------------------------------------------------- */

  /** Report the referral roster, which gates withdrawal */
  async logReferrals() {
    const invite = await this.getInvite();
    this.debugger.log("Invite:", invite);

    const summary = invite?.summary;

    this.logger.keyValue("Referrals", summary?.total ?? 0);
    this.logger.keyValue("Active", summary?.active ?? 0, {
      valueStyle: this.logger.c.greenBright,
    });
    this.logger.keyValue("Pending", summary?.pending ?? 0);
    this.logger.keyValue(
      "Referral Earnings",
      `${this.formatAmount(summary?.earned)} USDT`,
    );
  }

  /* --------------------------------------------------------------------- */
  /* Withdrawal                                                            */
  /*                                                                       */
  /* A run never moves funds. It reports what is standing in the way, and   */
  /* the payout itself is left to the tools below.                          */
  /* --------------------------------------------------------------------- */

  /** Report payout eligibility and whatever is blocking it */
  async logWithdrawalStatus() {
    const info = await this.getWithdrawal();
    this.debugger.log("Withdrawal:", info);

    this.logger.newline();
    this.logger.keyValue(
      "Balance",
      `${this.formatAmount(info?.balance)} USDT`,
      { valueStyle: this.logger.c.greenBright },
    );
    this.logger.keyValue(
      "Minimum",
      `${this.formatAmount(info?.minAmount)} USDT`,
    );
    this.logger.keyValue("Network", info?.networkLabel || info?.network || "-");
    this.logger.keyValue("Wallet", info?.walletAddress || "Not set", {
      valueStyle: info?.walletAddress
        ? this.logger.c.whiteBright
        : this.logger.c.redBright,
    });

    if (info?.eligible) {
      this.logger.success("Withdrawal is available.");
      return info;
    }

    const blockers = this.getWithdrawalBlockers(info);

    if (blockers.length) {
      this.logger.info("Withdrawal is blocked by:");
      for (const blocker of blockers) this.logger.warn(`- ${blocker}`);
    } else {
      this.logger.info("Withdrawal is unavailable.");
    }

    return info;
  }

  /**
   * The unmet requirements, in the drop's own words.
   *
   * `checks` already carries a display label per requirement, so there is no
   * second copy of the rules here to fall out of date.
   */
  getWithdrawalBlockers(info) {
    return Object.values(info?.checks || {})
      .filter((check) => check && !check.ok)
      .map((check) => check.label);
  }

  /* --------------------------------------------------------------------- */
  /* Tools (manual actions)                                                */
  /* --------------------------------------------------------------------- */

  createTools() {
    return [
      {
        name: "Wallet",
        list: [
          {
            id: "set-wallet",
            icon: "wallet",
            title: "Set Wallet",
            action: this.setWalletInteractive.bind(this),
            dispatch: false,
          },
        ],
      },
      {
        name: "Withdrawal",
        list: [
          {
            id: "withdrawal-status",
            icon: "check",
            title: "Withdrawal Status",
            action: this.logWithdrawalStatus.bind(this),
            dispatch: false,
          },
          {
            id: "withdraw",
            icon: "withdraw",
            title: "Withdraw",
            action: this.withdrawInteractive.bind(this),
            dispatch: false,
          },
        ],
      },
    ];
  }

  /** Set the payout address, prompting for it */
  async setWalletInteractive() {
    const input = await this.promptInput("Enter your BEP-20 USDT address:");
    const address = (input || "").trim();

    if (!address) {
      this.logger.warn("No address provided.");
      return;
    }

    const result = await this.updateWalletAddress(address);
    this.debugger.log("Wallet update:", result);

    await this.storeWalletAddress(address);

    this.logger.success(`Wallet set to ${address}`);
  }

  /**
   * Withdraw, prompting for the amount.
   *
   * The drop's own blockers are reported rather than worked around — a payout
   * it will refuse is not worth spending the 6h cooldown on.
   */
  async withdrawInteractive() {
    const info = await this.logWithdrawalStatus();

    if (!info?.eligible) {
      this.logger.warn("Withdrawal is not available yet.");
      return;
    }

    const address = info.walletAddress || (await this.getWalletAddress());

    if (!address) {
      this.logger.warn("No wallet address set - use \"Set Wallet\" first.");
      return;
    }

    const input = await this.promptInput(
      `Amount to withdraw (blank for all of ${this.formatAmount(info.balance)}):`,
    );

    const amount = (input || "").trim()
      ? Number((input || "").trim())
      : Number(info.balance);

    if (!Number.isFinite(amount) || amount <= 0) {
      this.logger.warn("Invalid amount.");
      return;
    }

    try {
      const result = await this.submitWithdrawal(amount, address);
      this.debugger.log("Withdrawal result:", result);

      this.logger.success(
        `Requested ${this.formatAmount(amount)} USDT to ${address}`,
      );
    } catch (error) {
      this.logger.error("Withdrawal failed:", this.readError(error));
    }
  }

  /** Remember the payout address, in the environments that offer storage */
  async storeWalletAddress(address) {
    this.walletAddress = address;

    try {
      await this.storage?.set("wallet", { address });
    } catch (error) {
      this.debugger.log("Failed to store wallet:", error.message);
    }
  }

  /** The payout address, from this run or a previous one */
  async getWalletAddress() {
    if (this.walletAddress) return this.walletAddress;

    try {
      const saved = await this.storage?.get("wallet");
      if (saved?.address) {
        this.walletAddress = saved.address;
      }
    } catch (error) {
      this.debugger.log("Failed to read stored wallet:", error.message);
    }

    return this.walletAddress || null;
  }

  /* --------------------------------------------------------------------- */
  /* Process                                                               */
  /* --------------------------------------------------------------------- */

  async process() {
    await this.login();

    await this.logUserInfo();
    await this.executeTask("Verification", () => this.completeVerification());
    await this.executeTask("Ads", () => this.watchAds());
    await this.executeTask("Tasks", () => this.completeTasks());
    await this.executeTask("Referrals", () => this.logReferrals());
    await this.executeTask("Withdrawal", () => this.logWithdrawalStatus());
  }

  /** Log the current account state */
  async logUserInfo() {
    const payload = await this.refreshUser();
    const user = payload?.user;
    const ads = payload?.ads;

    this.logger.newline();
    this.logCurrentUser();

    this.logger.keyValue("Balance", `${this.formatAmount(user?.balance)} USDT`, {
      valueStyle: this.logger.c.greenBright,
    });
    this.logger.keyValue(
      "Total Earned",
      `${this.formatAmount(user?.totalEarned)} USDT`,
    );
    this.logger.keyValue("Lifetime Ads", user?.lifetimeAds ?? 0);
    this.logger.keyValue(
      "Ads Today",
      `${ads?.watchedToday ?? 0}/${ads?.dailyLimit ?? 0}`,
    );
    this.logger.keyValue("Referrals", user?.referralCount ?? 0);

    const announcement = payload?.app?.announcement;
    if (announcement) {
      this.logger.info(announcement);
    }
  }

  /** Balances arrive as floats, and read badly unrounded */
  formatAmount(value) {
    const amount = Number(value);
    return Number.isFinite(amount) ? amount.toFixed(BALANCE_PRECISION) : "0.0000";
  }
}
