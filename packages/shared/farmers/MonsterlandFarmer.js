import BaseFarmer from "../lib/BaseFarmer.js";
import AdsGramClient from "../lib/ads/AdsGramClient.js";
import GigaPubClient from "../lib/ads/GigaPubClient.js";
import MonetagClient from "../lib/ads/MonetagClient.js";
import TadsClient from "../lib/ads/TadsClient.js";

/** The game's backend, served from the mini app's own origin */
const API_URL = "https://lets.playmonsterland.com/api";

/** Bot the referral links point at */
const BOT_USERNAME = "monsterland_bot";

/** Cloudflare Turnstile guarding every API call, as the page renders it */
const TURNSTILE_SITE_KEY = "0x4AAAAAADdQlvzwXRHPB_GW";
const TURNSTILE_PAGE_URL = "https://lets.playmonsterland.com/";
const TURNSTILE_HEADER = "cf-turnstile-response";

/** The errors the backend answers a 403 with */
const TURNSTILE_REQUIRED = "TURNSTILE_REQUIRED";
const BANNED = "BANNED";

/** Ad networks the page loads, as its ad config declares them */
const ADSGRAM_BLOCK_ID = "37686";
const MONETAG_ZONE_ID = "11057880";
const GIGAPUB_PROJECT_ID = "7583";
const TADS_WIDGET_ID = "11616";

/** Providers the farmer can play, the rest are reported failed so the backend falls back */
const PLAYABLE_AD_PROVIDERS = ["adsgram", "monetag", "gigapub", "tads"];

/** How the page waits on an ad's server side settlement */
const AD_RESULT_POLL_SECONDS = 2.5;
const AD_RESULT_TIMEOUT_SECONDS = 60;
const MONETAG_COMPLETE_ATTEMPTS = 40;
const MONETAG_COMPLETE_INTERVAL_SECONDS = 0.5;

/** Vitals decay per hour, before personality modifiers */
const DECAY_RATES = { food: 20, hygiene: 12.5, energy: 50 / 3 };

/** Personalities that bend decay, and the hygiene floor a pristine monster keeps */
const DECAY_MODIFIERS = {
  zoomer: { energy: 1.5 },
  athlete: { energy: 0.5 },
  royal: { hygiene: 0.7 },
};
const PRISTINE_HYGIENE_FLOOR = 50;

/** Where each vital is topped up to: food pays most above 80, the others stop hurting above 30 */
const VITAL_TARGETS = { food: 80, hygiene: 50, energy: 50 };

/** Most items used on one vital in one pass */
const MAXIMUM_ITEMS_PER_VITAL = 6;

/** Vital items, cheapest first, with the ads they cost when ads can pay for them */
const VITAL_ITEMS = {
  food: [
    { id: "magic_apple", value: 15, price: 250, ads: 1 },
    { id: "fairy_berries", value: 30, price: 800, ads: 2 },
    { id: "dragon_steak", value: 50, price: 4500, ads: 0 },
    { id: "royal_feast", value: 100, price: 15000, ads: 0 },
  ],
  hygiene: [
    { id: "magic_towel", value: 20, price: 200, ads: 1 },
    { id: "fairy_bath", value: 40, price: 700, ads: 2 },
    { id: "royal_spa", value: 70, price: 4000, ads: 0 },
    { id: "crystal_shower", value: 100, price: 12000, ads: 0 },
  ],
  energy: [
    { id: "wizard_coffee", value: 20, price: 300, ads: 1 },
    { id: "spark_juice", value: 40, price: 1000, ads: 2 },
    { id: "thunder_tea", value: 70, price: 5000, ads: 0 },
    { id: "phoenix_elixir", value: 100, price: 18000, ads: 0 },
  ],
};

/** Lumis never spent on vitals, so purchases cannot drain the balance */
const LUMIS_RESERVE = 2000;

/** Sleep restores 25 energy an hour for up to 6 hours, and the game only allows it below 80 */
const SLEEP_MAX_HOURS = 6;
const SLEEP_ENERGY_PER_HOUR = 25;
const SLEEP_ENERGY_THRESHOLD = 30;

/** Dreamers recover energy twice as fast while asleep */
const DREAMER_SLEEP_MULTIPLIER = 2;

/** Monsters stop leveling at 25 */
const MAXIMUM_LEVEL = 25;

/** Accounts cap at 10 monster slots, the second unlocked by watching 3 ads */
const MAXIMUM_MONSTER_SLOTS = 10;
const SLOT_2_ADS_REQUIRED = 3;

/** Lumis price of each slot past the second, by slot number */
const MONSTER_SLOT_PRICES = {
  3: 25e3,
  4: 1e5,
  5: 25e4,
  6: 5e5,
  7: 15e5,
  8: 4e6,
  9: 1e7,
  10: 25e6,
};

/** Mystery eggs cost 50k lumis, rising 1.5x with each one bought, capped at 3M */
const MYSTERY_EGG_BASE_PRICE = 5e4;
const MYSTERY_EGG_PRICE_GROWTH = 1.5;
const MYSTERY_EGG_MAXIMUM_PRICE = 3e6;

/** A purchase must pay itself back within this many days of a new monster's output */
const GROW_PAYBACK_DAYS = 10;

/** A new monster starts at level 1 and is kept fed above 80, which pays 1.25x */
const NEW_MONSTER_VITALS_MULTIPLIER = 1.25;

/** A monster this close to the end of its lifespan gets a spare egg lined up, since incubation takes a day */
const REPLACEMENT_LEAD_HOURS = 36;

/** Most purchases in one pass */
const MAXIMUM_PURCHASES_PER_PASS = 5;

/** Fragments a single egg takes */
const FRAGMENTS_PER_EGG = 5;

/** Incubation ads an egg takes, by type */
const INCUBATION_MAXIMUM_ADS = {
  mystery_egg: 10,
  golden_egg: 15,
  celestial_egg: 20,
};
const EGG_TYPES = ["mystery_egg", "golden_egg", "celestial_egg"];

/** Monster lifespans: by the egg it hatched from, else by rarity */
const DAY_MS = 864e5;
const EGG_LIFESPAN_DAYS = {
  ancient_egg: 45,
  mystery_egg: 45,
  golden_egg: 75,
  celestial_egg: 95,
  arcane_egg: 55,
};
const RARITY_LIFESPAN_DAYS = {
  common: 45,
  uncommon: 60,
  rare: 75,
  epic: 90,
  mythic: 100,
};
const INFLUENCER_LIFESPAN_DAYS = 75;

/** Referral goal ids, which are the referral counts they unlock at */
const REFERRAL_GOAL_IDS = [
  1, 3, 5, 10, 15, 25, 40, 50, 75, 100, 150, 200, 300, 500, 700,
];

/** Referrals the newcomer bonus egg takes */
const INITIAL_BONUS_REFERRALS = 3;

/** Monster slots an account starts with */
const DEFAULT_MONSTER_SLOTS = 1;

/** Mission board buckets and the page size the page uses */
const MISSION_BUCKETS = ["official", "partners", "ads"];
const MISSIONS_PAGE_SIZE = 20;

/** How long the page waits before it lets an honor mission be claimed */
const MISSION_DWELL_SECONDS = 5;

/** Mission refusals that are not worth a warning */
const MISSION_SKIP_REASONS = ["NOT_MEMBER", "ALREADY_CLAIMED", "NOT_COMPLETED"];

/** Withdrawals wait for the fee ladder (40% down to 0%) to reach this */
const MAXIMUM_WITHDRAWAL_FEE = 0;

/** Safety margin above the game's minimum, so a run does not withdraw the instant it crosses it */
const WITHDRAWAL_BUFFER = 1000;

/** Fallback minimum in lumis, used until the game's config has been read */
const MINIMUM_WITHDRAWAL = 500000;

/** Withdrawal statuses, as the payment history and its live updates report them */
const SETTLED_WITHDRAWAL_STATUSES = ["completed"];
const FLAGGED_WITHDRAWAL_STATUSES = ["failed", "denied"];

/** How many history rows are read when looking for withdrawals */
const WITHDRAWAL_HISTORY_LIMIT = 10;

export default class MonsterlandFarmer extends BaseFarmer {
  static id = "monsterland";
  static title = "Monsterland";
  static emoji = "👾";
  static host = "lets.playmonsterland.com";
  static domains = [
    "lets.playmonsterland.com",
    "api.adsgram.ai",
    "libtl.com",
    "ill3.com",
    "my.rtmark.net",
    "ad.gigapub.tech",
    "munqu.com",
    "d3rem.com",
    "tads.me",
  ];
  static telegramLink = "https://t.me/monsterland_bot?startapp=ref_DBVMp4B";
  static path = "/";
  static interval = "*/30 * * * *";
  static apiDelay = 500;
  static rating = 4;

  /** The security pass may ride on a cookie, so keep the jar across runs */
  static cookies = true;

  /** Payouts are native TON (the game calls it GRAM), so the Auto has no jetton */
  static auto = {
    id: "monsterland-auto",
    title: "Monsterland Auto",
    token: "TON",
    currency: "LUMIS",
    jettonAddress: null,
    storagePrefix: "monsterland-auto",
    minWithdrawal: MINIMUM_WITHDRAWAL,
  };

  /* --------------------------------------------------------------------- */
  /* Transport                                                             */
  /* --------------------------------------------------------------------- */

  /** Carry `initData` on every call the game's own API receives, and on no others */
  configureApi() {
    const interceptor = this.api.interceptors.request.use((config) => {
      if (String(config.url || "").startsWith(API_URL)) {
        config.headers["Authorization"] = `tma ${this.getInitData()}`;
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
      await this.obtainHumanSession();
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
  /* Human session                                                         */
  /* --------------------------------------------------------------------- */

  /** Pass the Turnstile check, sharing one attempt between concurrent callers */
  obtainHumanSession() {
    return (this.humanSessionPromise ||= this.solveHumanCheck().finally(() => {
      this.humanSessionPromise = null;
    }));
  }

  /** Solve Turnstile and hand the token to the backend, which trusts the account for about an hour */
  async solveHumanCheck() {
    if (!this.canSolveTurnstile()) {
      throw new Error(
        "Captcha is required but no captcha provider is configured!",
      );
    }

    await this.logPreviousPassLifespan();

    this.logger.info("Solving the security check...");

    const token = await this.solveTurnstile({
      siteKey: TURNSTILE_SITE_KEY,
      pageUrl: TURNSTILE_PAGE_URL,
    });

    const result = await this.callApi("post", "/security/turnstile", {
      headers: { [TURNSTILE_HEADER]: token },
      retryTurnstile: false,
    });

    if (!result.ok) {
      throw new Error(
        result.data["error"] || `Security check was refused (${result.status})`,
      );
    }

    this.logger.success("Security check passed.");

    await this.storeTurnstilePass();
  }

  /** Log how long the last pass held, which tells whether it survives between runs */
  async logPreviousPassLifespan() {
    try {
      const stored = await this.storage?.get("turnstilePass");
      const solvedAt = Number(stored?.["solvedAt"]);

      if (solvedAt) {
        const minutes = Math.round((Date.now() - solvedAt) / 6e4);

        this.logger.info(`Security pass lasted ${minutes}m.`);
      }
    } catch (error) {
      this.logger.warn("Failed to read the security pass:", error.message);
    }
  }

  /** Remember when the pass was earned, so the next solve can report its lifespan */
  async storeTurnstilePass() {
    try {
      await this.storage?.set("turnstilePass", { solvedAt: Date.now() });
    } catch (error) {
      this.logger.warn("Failed to store the security pass:", error.message);
    }
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
    this.config_data = await this.getFromApi("/config", { quota: 1 });
    return this.config_data;
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

  /** Use or buy a vital item on a monster */
  applyVitalItem(monsterId, itemId, action) {
    return this.postToApi("/vitals", { monsterId, itemId, action });
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
  abandonAd(adTxId) {
    return this.postToApi("/ads/abandon", { adTxId }).catch(() => null);
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

  /* --------------------------------------------------------------------- */
  /* Session                                                               */
  /* --------------------------------------------------------------------- */

  /** Get Auth */
  fetchAuth() {
    return this.loadState();
  }

  /** Re-read the account into the farmer */
  async loadState() {
    this.state_data = await this.fetchUser();
    this.state_data.loadedAt = Date.now();
    return this.state_data;
  }

  /** Read the state once, for entry points that run without a full pass */
  async ensureStateLoaded() {
    if (!this.state_data) {
      await this.loadState();
    }

    return this.state_data;
  }

  /** The player's profile */
  getProfile() {
    return this.state_data?.profile || {};
  }

  /** The player's item and egg counts */
  getInventory() {
    return this.state_data?.inventory || {};
  }

  /** Every monster and egg the account holds */
  getMonsters() {
    return this.state_data?.monsters || [];
  }

  /** The lumis balance */
  getLumis() {
    return Number(this.getProfile()["lumis"]) || 0;
  }

  /** Fold a returned balance and inventory changes into the state */
  applyResult(result) {
    const profile = this.getProfile();
    const lumis = result?.["newLumis"] ?? result?.["new_balance"];

    if (lumis !== undefined && lumis !== null) {
      profile["lumis"] = Number(lumis);
    }

    if (result?.["inventoryUpdates"]) {
      Object.assign(this.getInventory(), result["inventoryUpdates"]);
    }
  }

  /** Get Referral Link */
  async getReferralLink() {
    await this.ensureStateLoaded();

    const hash =
      this.state_data?.referral?.["referral_hash"] ||
      this.getProfile()["referral_hash"];

    return `https://t.me/${BOT_USERNAME}?startapp=ref_${hash}`;
  }

  /** Get Referrals Count */
  async getReferralsCount() {
    await this.ensureStateLoaded();

    return Number(this.state_data?.referral?.["total_referrals"]) || 0;
  }

  /* --------------------------------------------------------------------- */
  /* Process                                                               */
  /* --------------------------------------------------------------------- */

  /** Process Farmer */
  async process() {
    await this.loadState();

    this.logAccountInfo();

    await this.executeTask("Streak", () => this.claimStreak());
    await this.executeTask("Referrals", () => this.claimReferrals());
    await this.executeTask("Eggs", () => this.manageEggs());
    await this.executeTask("Care", () => this.careForMonsters());
    await this.executeTask("Level", () => this.levelUpMonsters());
    await this.executeTask("Grow", () => this.growFarm());
    await this.executeTask("Missions", () => this.completeMissions());
    await this.executeTask("Withdraw", () => this.withdraw());
    await this.storeAutoSnapshot();
  }

  /** Log what the account looks like before the pass starts */
  logAccountInfo() {
    const profile = this.getProfile();
    const streak = profile["daily_streak_state"] || {};
    const payments = profile["payments"] || {};
    const monsters = this.getLiveMonsters();

    this.logger.newline();
    this.logCurrentUser();
    this.logger.keyValue("Lumis", this.formatAmount(this.getLumis()));
    this.logger.keyValue("Level", profile["level"] ?? "-");
    this.logger.keyValue("Streak", `${streak["days"] ?? 0} day(s)`);
    this.logger.keyValue(
      "Referrals",
      this.state_data?.referral?.["total_referrals"] ?? 0,
    );
    this.logger.keyValue(
      "Withdrawal Fee",
      payments["withdrawal_fee"] !== undefined
        ? `${payments["withdrawal_fee"]}%`
        : "-",
    );
    this.logger.keyValue("Wallet", payments["wallet"] || "Not connected", {
      valueStyle: payments["wallet"]
        ? this.logger.c.greenBright
        : this.logger.c.yellowBright,
    });

    this.logger.newline();
    this.logger.keyValue("Monsters", monsters.length);

    for (const monster of monsters) {
      const vitals = this.projectVitals(monster);

      this.logger.keyValue(
        monster["name"] || monster["_id"],
        `Lv ${monster["level"] ?? 1} | 🍎 ${Math.round(vitals.food)} 🧼 ${Math.round(vitals.hygiene)} ⚡ ${Math.round(vitals.energy)}${monster["is_sleeping"] ? " | 💤" : ""}`,
      );
    }
  }

  /* --------------------------------------------------------------------- */
  /* Streak                                                                */
  /* --------------------------------------------------------------------- */

  /** Claim today's streak reward once */
  async claimStreak() {
    const streak = this.getProfile()["daily_streak_state"];

    if (!streak) {
      this.logger.info("No streak state to read.");
      return;
    }

    if (streak["streak_reward_claimed_today"]) {
      this.logger.info("Streak already claimed today.");
      return;
    }

    if (streak["streak_is_lost"]) {
      this.logger.warn("The streak is lost, claim it once in the app.");
      return;
    }

    const result = await this.claimDailyStreak();

    if (!result.ok) {
      this.logger.warn("Failed to claim streak:", result.data["error"]);
      return;
    }

    this.applyResult(result.data);
    this.logger.success(`Claimed streak day ${(streak["days"] || 0) + 1}.`);
  }

  /* --------------------------------------------------------------------- */
  /* Referrals                                                             */
  /* --------------------------------------------------------------------- */

  /** Claim referral lumis, the newcomer bonus and every goal reached */
  async claimReferrals() {
    const referral = await this.fetchReferral();
    const total = Number(referral["total_referrals"]) || 0;

    if (Number(referral["claimable_lumis"]) > 0) {
      await this.claimReferralReward(
        "lumis",
        undefined,
        `${referral["claimable_lumis"]} referral lumis`,
      );
    }

    const bonusDeadline = referral["initial_bonus_deadline"]
      ? new Date(referral["initial_bonus_deadline"]).getTime()
      : Infinity;

    if (
      referral["initial_bonus_active"] &&
      !referral["initial_bonus_claimed"] &&
      total >= INITIAL_BONUS_REFERRALS &&
      Date.now() < bonusDeadline
    ) {
      await this.claimReferralReward(
        "initial_bonus",
        undefined,
        "the referral egg",
      );
    }

    const claimed = new Set((referral["goals_claimed"] || []).map(Number));

    for (const id of REFERRAL_GOAL_IDS) {
      if (id <= total && !claimed.has(id)) {
        await this.claimReferralReward("goal", id, `goal ${id}`);
      }
    }
  }

  /** Claim one referral reward and log it */
  async claimReferralReward(type, id, label) {
    const result = await this.claimReferral(type, id);

    if (!result.ok || result.data["success"] === false) {
      this.logger.warn(`Failed to claim ${label}:`, result.data["error"]);
      return;
    }

    this.applyResult(result.data);
    this.logger.success(`Claimed ${label}.`);
  }

  /* --------------------------------------------------------------------- */
  /* Eggs                                                                  */
  /* --------------------------------------------------------------------- */

  /** Turn fragments into eggs, incubate what fits, and hatch what is ready */
  async manageEggs() {
    for (const type of EGG_TYPES) {
      const fragments = Number(this.getInventory()[`${type}_fragment`]) || 0;

      if (fragments < FRAGMENTS_PER_EGG) continue;

      const result = await this.claimEggFromFragments(type);

      if (!result.ok) {
        this.logger.warn(
          `Failed to claim ${type} from fragments:`,
          result.data["error"],
        );
        continue;
      }

      if (result.data["inventory"]) {
        Object.assign(this.getInventory(), result.data["inventory"]);
      }

      this.logger.success(`Claimed a ${type} from fragments.`);
    }

    await this.hatchReadyEggs();
    await this.incubateEggs();
  }

  /** Hatch every egg whose incubation has ended */
  async hatchReadyEggs() {
    const now = this.getServerNow();
    const ready = this.getMonsters().filter(
      (egg) =>
        egg["is_egg"] &&
        egg["incubation"]?.["ends_at"] &&
        new Date(egg["incubation"]["ends_at"]).getTime() <= now,
    );

    for (const egg of ready) {
      const result = await this.hatchEgg(egg["_id"]);

      if (result.ok && result.data["monster"]) {
        this.logger.success(
          `Hatched ${result.data["monster"]["name"] || "a monster"} (${result.data["monster"]["rarity"] || "?"}).`,
        );
        continue;
      }

      if (result.data["code"] === "MONSTER_GENERATING") {
        this.logger.info("The monster is still being generated.");
        continue;
      }

      this.logger.warn("Failed to hatch egg:", result.data["error"]);
    }

    if (ready.length) {
      await this.loadState();
    }
  }

  /** Incubate eggs from the inventory while slots are free */
  async incubateEggs() {
    const slots =
      Number(this.getProfile()["monster_slots"]) || DEFAULT_MONSTER_SLOTS;
    let occupied = this.getMonsters().filter(
      (monster) => !monster["is_mentor"] && !this.hasLifespanExpired(monster),
    ).length;

    for (const type of EGG_TYPES) {
      while (
        occupied < slots &&
        (Number(this.getInventory()[type]) || 0) > 0 &&
        !this.signal.aborted
      ) {
        const result = await this.incubateEgg(type);

        if (!result.ok || !result.data["egg"]) {
          this.logger.warn(`Failed to incubate ${type}:`, result.data["error"]);
          return;
        }

        this.getInventory()[type] = Number(this.getInventory()[type]) - 1;
        this.getMonsters().push(result.data["egg"]);
        occupied++;

        this.logger.success(`Incubating a ${type}.`);
      }
    }
  }

  /* --------------------------------------------------------------------- */
  /* Care                                                                  */
  /* --------------------------------------------------------------------- */

  /** Server time, as the last state read reported it */
  getServerNow() {
    const serverTime = Number(this.state_data?.serverTime);
    const offset = this.state_data?.loadedAt
      ? Date.now() - this.state_data.loadedAt
      : 0;

    return serverTime ? serverTime + offset : Date.now();
  }

  /** How long a monster lives, the way the page works it out */
  getLifespanDays(monster) {
    if (
      monster["source_egg"] === "arcane_egg" ||
      monster["origin"] === "fusion"
    ) {
      return EGG_LIFESPAN_DAYS.arcane_egg;
    }

    if (monster["personality"] === "influencer") {
      return INFLUENCER_LIFESPAN_DAYS;
    }

    return (
      EGG_LIFESPAN_DAYS[monster["source_egg"]] ??
      RARITY_LIFESPAN_DAYS[monster["rarity"]] ??
      RARITY_LIFESPAN_DAYS.common
    );
  }

  /** Whether a hatched monster has outlived its lifespan */
  hasLifespanExpired(monster) {
    if (!monster["rarity"] || !monster["hatched_at"]) return false;

    const hatchedAt = new Date(monster["hatched_at"]).getTime();

    return (
      Number.isFinite(hatchedAt) &&
      this.getServerNow() - hatchedAt >= this.getLifespanDays(monster) * DAY_MS
    );
  }

  /** Hatched monsters that still produce */
  getLiveMonsters() {
    return this.getMonsters().filter(
      (monster) =>
        !monster["is_egg"] &&
        !monster["is_mentor"] &&
        !this.hasLifespanExpired(monster),
    );
  }

  /** A monster's vitals now, decayed from when the server last wrote them */
  projectVitals(monster) {
    const vitals = monster["vitals"] || {};
    const current = {
      food: Number(vitals["food"]) || 0,
      hygiene: Number(vitals["hygiene"]) || 0,
      energy: Number(vitals["energy"]) || 0,
    };

    /** Sleep freezes food and hygiene while energy recovers */
    if (monster["is_sleeping"]) {
      return {
        ...current,
        energy: Math.min(
          100,
          current.energy +
            this.getSleepHours(monster) * this.getSleepRecoveryRate(monster),
        ),
      };
    }

    const lastUpdated = vitals["last_updated"]
      ? new Date(vitals["last_updated"]).getTime()
      : this.getServerNow();
    const hours = Math.max(0, (this.getServerNow() - lastUpdated) / 36e5);
    const personality = String(monster["personality"] || "").toLowerCase();
    const modifiers = DECAY_MODIFIERS[personality] || {};
    const hungerStoppedUntil = monster["active_state"]?.[
      "hunger_decay_stopped_until"
    ]
      ? new Date(
          monster["active_state"]["hunger_decay_stopped_until"],
        ).getTime()
      : 0;
    const foodHours = Math.max(
      0,
      (this.getServerNow() - Math.max(lastUpdated, hungerStoppedUntil)) / 36e5,
    );
    const hygieneFloor =
      personality === "pristine" ? PRISTINE_HYGIENE_FLOOR : 0;

    return {
      food: Math.max(
        0,
        current.food - DECAY_RATES.food * (modifiers.food ?? 1) * foodHours,
      ),
      hygiene: Math.max(
        hygieneFloor,
        current.hygiene -
          DECAY_RATES.hygiene * (modifiers.hygiene ?? 1) * hours,
      ),
      energy: Math.max(
        0,
        current.energy - DECAY_RATES.energy * (modifiers.energy ?? 1) * hours,
      ),
    };
  }

  /** Hours a sleeping monster has been asleep */
  getSleepHours(monster) {
    const startedAt = monster["sleep_started_at"]
      ? new Date(monster["sleep_started_at"]).getTime()
      : this.getServerNow();

    return Math.max(0, (this.getServerNow() - startedAt) / 36e5);
  }

  /** Energy a monster recovers per hour of sleep */
  getSleepRecoveryRate(monster) {
    return String(monster["personality"] || "").toLowerCase() === "dreamer"
      ? SLEEP_ENERGY_PER_HOUR * DREAMER_SLEEP_MULTIPLIER
      : SLEEP_ENERGY_PER_HOUR;
  }

  /** Keep every monster fed, clean and rested */
  async careForMonsters() {
    await this.loadState();

    const monsters = this.getLiveMonsters();

    if (!monsters.length) {
      this.logger.info("No hatched monsters to care for.");
      return;
    }

    for (const monster of monsters) {
      if (this.signal.aborted) return;

      await this.careForMonster(monster);
    }
  }

  /** Wake, top up, or put one monster to sleep */
  async careForMonster(monster) {
    const name = monster["name"] || monster["_id"];

    if (monster["is_sleeping"]) {
      await this.wakeIfRested(monster, name);
      return;
    }

    const vitals = this.projectVitals(monster);

    for (const vital of ["food", "hygiene", "energy"]) {
      vitals[vital] = await this.topUpVital(
        monster,
        name,
        vital,
        vitals[vital],
      );
    }

    if (vitals.energy < SLEEP_ENERGY_THRESHOLD) {
      await this.startSleep(monster, name);
    }
  }

  /** Wake a monster once its sleep has run its course */
  async wakeIfRested(monster, name) {
    const hours = this.getSleepHours(monster);
    const energy = this.projectVitals(monster).energy;

    if (hours < SLEEP_MAX_HOURS && energy < 100) {
      const left = Math.min(
        SLEEP_MAX_HOURS - hours,
        (100 - energy) / this.getSleepRecoveryRate(monster),
      );

      this.logger.info(
        `${name} sleeps for another ${Math.ceil(left * 60)} minute(s).`,
      );
      return;
    }

    const result = await this.changeSleep(monster["_id"], "wake_up");

    if (!result.ok) {
      if (result.data["reason"] === "no_coffee") {
        this.logger.info(`${name} needs a coffee to wake yet.`);
      } else {
        this.logger.warn(`Failed to wake ${name}:`, result.data["error"]);
      }
      return;
    }

    this.applyResult(result.data);
    this.logger.success(
      `${name} woke up rested${result.data["xp_gained"] ? ` (+${result.data["xp_gained"]} XP)` : ""}.`,
    );
  }

  /** Put a tired monster to sleep */
  async startSleep(monster, name) {
    const result = await this.changeSleep(monster["_id"], "start_sleep");

    if (!result.ok) {
      this.logger.warn(`Failed to put ${name} to sleep:`, result.data["error"]);
      return;
    }

    this.logger.success(`${name} went to sleep.`);
  }

  /** Raise one vital to its target from the inventory, then ads, then lumis */
  async topUpVital(monster, name, vital, value) {
    const target = VITAL_TARGETS[vital];
    let used = 0;

    while (
      value < target &&
      used < MAXIMUM_ITEMS_PER_VITAL &&
      !this.signal.aborted
    ) {
      const result = await this.restoreVital(monster, vital);

      if (!result) break;

      if (result.data["reason"] === "monster_sleeping") {
        this.logger.info(`${name} is asleep.`);
        break;
      }

      used++;
      this.applyResult(result.data);

      const next = Number(result.data["newVitalValue"]);
      value = Number.isFinite(next) ? next : value + result.item.value;

      this.logger.success(
        `${result.source} ${result.item.id} on ${name}: ${vital} ${Math.round(value)}.`,
      );
    }

    return value;
  }

  /** Restore a vital once, the cheapest way available, or `null` when nothing is left to try */
  async restoreVital(monster, vital) {
    const items = VITAL_ITEMS[vital];
    const inventory = this.getInventory();
    const owned = items.find((item) => Number(inventory[item.id]) > 0);

    if (owned) {
      const result = await this.applyVitalItem(
        monster["_id"],
        owned.id,
        "use_inventory",
      );

      if (result.ok) {
        if (!result.data["inventoryUpdates"]) {
          inventory[owned.id] = Number(inventory[owned.id]) - 1;
        }

        return { ...result, item: owned, source: "Used" };
      }

      this.logger.warn(`Failed to use ${owned.id}:`, result.data["error"]);
      inventory[owned.id] = 0;
    }

    const adItem = items.find((item) => item.ads === 1);

    if (adItem && !this.adsUnavailable) {
      const data = await this.watchAdFor("vitals", {
        monsterId: monster["_id"],
        itemId: adItem.id,
      });

      if (data) {
        return { ok: true, data, item: adItem, source: "Watched ad for" };
      }
    }

    /** Sleep restores energy for free, so energy is never bought */
    if (vital === "energy") return null;

    const cheapest = items[0];

    if (this.getLumis() - cheapest.price < LUMIS_RESERVE) {
      this.logger.info(`Not enough lumis to buy ${cheapest.id}.`);
      return null;
    }

    const result = await this.applyVitalItem(
      monster["_id"],
      cheapest.id,
      "purchase",
    );

    if (!result.ok) {
      this.logger.warn(`Failed to buy ${cheapest.id}:`, result.data["error"]);
      return null;
    }

    return { ...result, item: cheapest, source: "Bought" };
  }

  /* --------------------------------------------------------------------- */
  /* Ads                                                                   */
  /* --------------------------------------------------------------------- */

  /** The page's AdsGram block, created once per run */
  get adsgram() {
    return (this._adsgram ||= new AdsGramClient(this));
  }

  /** The page's Monetag zone, created once per run */
  get monetag() {
    return (this._monetag ||= new MonetagClient(this, {
      zoneId: MONETAG_ZONE_ID,
    }));
  }

  /** The page's GigaPub project, created once per run */
  get gigapub() {
    return (this._gigapub ||= new GigaPubClient(this, {
      projectId: GIGAPUB_PROJECT_ID,
    }));
  }

  /** The page's TADS widget, created once per run */
  get tads() {
    return (this._tads ||= new TadsClient(this, { widgetId: TADS_WIDGET_ID }));
  }

  /** Watch an ad for an action, falling back across providers the way the page does
   * @returns {Promise<object|null>} the backend's settlement, or `null` when no ad paid
   */
  async watchAdFor(action, metadata) {
    const failedProviders = [];
    let lastTxId = null;
    let lastProvider = null;

    for (let attempt = 0; attempt < 6 && !this.signal.aborted; attempt++) {
      const fallback = lastTxId
        ? {
            fallback: true,
            fallbackOfTxId: lastTxId,
            lastFailedProvider: lastProvider,
            failedProviders,
          }
        : undefined;

      const task = await this.createAdTask(action, metadata, fallback);

      if (!task.ok) {
        const reason = task.data["reason"];

        if (
          (reason === "CONSECUTIVE_COOLDOWN" || reason === "BURST_COOLDOWN") &&
          task.data["waitSeconds"]
        ) {
          await this.utils.delayForSeconds(Number(task.data["waitSeconds"]), {
            signal: this.signal,
          });
          continue;
        }

        this.logger.warn("No ad available:", task.data["error"] || reason);
        this.adsUnavailable = true;
        return null;
      }

      const { adTxId, provider } = task.data;

      lastTxId = adTxId;
      lastProvider = provider;

      /** Monetag's pop format needs a real pop-under, so it is failed for the backend to fall back, as the page ends up doing */
      if (
        !PLAYABLE_AD_PROVIDERS.includes(provider) ||
        (provider === "monetag" && task.data["monetagFormat"] === "pop")
      ) {
        this.logger.info(`Skipping ${provider} ad.`);
        if (!failedProviders.includes(provider)) failedProviders.push(provider);
        await this.abandonAd(adTxId);
        continue;
      }

      try {
        const result = await this.playAd(provider, adTxId, task.data);

        if (result) return result;

        throw new Error("The ad was not settled");
      } catch (error) {
        this.logger.warn(`${provider} ad failed:`, error.message);
        if (!failedProviders.includes(provider)) failedProviders.push(provider);
        await this.abandonAd(adTxId);
      }
    }

    this.adsUnavailable = true;
    return null;
  }

  /** Play one ad through its provider and wait for the backend to settle it */
  async playAd(provider, adTxId, task) {
    this.logger.info(`Watching a ${provider} ad...`);

    switch (provider) {
      case "adsgram":
        await this.adsgram.watch(ADSGRAM_BLOCK_ID);
        return this.waitForAdResult(adTxId);

      case "monetag": {
        const { event } = await this.monetag.play(MONETAG_ZONE_ID, {
          ymid: `${this.getUserId()}_${adTxId}`,
        });

        return this.completeMonetagAd(adTxId, event, task);
      }

      case "tads":
        await this.tads.watch();
        return this.waitForAdResult(adTxId);

      case "gigapub": {
        await this.gigapub.watch();

        const result = await this.completeAd(adTxId, "gigapub");

        if (!result.ok) {
          throw new Error(result.data["error"] || "GigaPub was not verified");
        }

        return result.data;
      }
    }
  }

  /** Poll for an ad the provider settles with the backend directly */
  async waitForAdResult(adTxId) {
    const attempts = Math.ceil(
      AD_RESULT_TIMEOUT_SECONDS / AD_RESULT_POLL_SECONDS,
    );

    for (
      let attempt = 0;
      attempt < attempts && !this.signal.aborted;
      attempt++
    ) {
      const result = await this.fetchAdTaskResult(adTxId);

      if (result) {
        if (result["success"] === false) {
          throw new Error(result["error"] || "The ad was not paid");
        }

        return result;
      }

      await this.utils.delayForSeconds(AD_RESULT_POLL_SECONDS, {
        signal: this.signal,
      });
    }

    throw new Error("Timed out waiting for the ad to settle");
  }

  /** Confirm a Monetag ad, waiting out the postback the way the page does */
  async completeMonetagAd(adTxId, event) {
    const estimatedPrice = Number.parseFloat(
      event?.["estimated_price"] ?? event?.["estimatedPrice"],
    );

    for (let attempt = 0; attempt < MONETAG_COMPLETE_ATTEMPTS; attempt++) {
      const result = await this.completeAd(adTxId, "monetag", {
        monetagEstimatedPrice: Number.isFinite(estimatedPrice)
          ? estimatedPrice
          : null,
      });

      if (result.ok) return result.data;

      if (result.data["reason"] !== "WEBHOOK_PENDING") {
        throw new Error(result.data["error"] || result.data["reason"]);
      }

      await this.utils.delayForSeconds(MONETAG_COMPLETE_INTERVAL_SECONDS, {
        signal: this.signal,
      });
    }

    throw new Error("Monetag postback timed out");
  }

  /* --------------------------------------------------------------------- */
  /* Level                                                                 */
  /* --------------------------------------------------------------------- */

  /** XP a monster needs to leave a level */
  getXPRequiredForLevel(level) {
    return level >= MAXIMUM_LEVEL
      ? Infinity
      : Math.floor(500 * Math.pow(1.25, level - 1));
  }

  /** Level up every monster with the XP for it, leaving the lumis check to the backend */
  async levelUpMonsters() {
    for (const monster of this.getLiveMonsters()) {
      const name = monster["name"] || monster["_id"];
      let level = Number(monster["level"]) || 1;
      let experience = Number(monster["experience"]) || 0;

      while (
        experience >= this.getXPRequiredForLevel(level) &&
        !this.signal.aborted
      ) {
        const result = await this.levelUp(monster["_id"]);

        if (!result.ok) {
          this.logger.warn(`Failed to level up ${name}:`, result.data["error"]);
          break;
        }

        this.applyResult(result.data);

        level = Number(result.data["newLevel"]) || level + 1;
        experience = Number(result.data["remainingXP"]) || 0;

        this.logger.success(`${name} reached level ${level}.`);
      }
    }
  }

  /* --------------------------------------------------------------------- */
  /* Grow                                                                  */
  /* --------------------------------------------------------------------- */

  /** Add monsters: unlock slot 2 with ads, then buy slots and eggs while they pay back */
  async growFarm() {
    await this.loadState();
    await this.unlockSecondSlot();

    let purchases = 0;

    while (purchases < MAXIMUM_PURCHASES_PER_PASS && !this.signal.aborted) {
      const step = this.pickGrowthPurchase();

      if (!step) break;

      const result = await this.buyWithLumis(step.type, step.itemId);

      if (!result.ok || result.data["success"] === false) {
        this.logger.warn(`Failed to buy ${step.label}:`, result.data["error"]);
        break;
      }

      purchases++;
      this.logger.success(
        `Bought ${step.label} for ${this.formatAmount(step.price)} lumis.`,
      );

      await this.loadState();
    }

    await this.incubateEggs();
    await this.boostIncubations();
  }

  /** Watch incubation ads on every egg still incubating, so it hatches sooner */
  async boostIncubations() {
    const eggs = this.getMonsters().filter(
      (egg) =>
        egg["is_egg"] &&
        egg["incubation"]?.["ends_at"] &&
        new Date(egg["incubation"]["ends_at"]).getTime() > this.getServerNow(),
    );

    let boosted = 0;

    for (const egg of eggs) {
      const maximum =
        INCUBATION_MAXIMUM_ADS[egg["incubation"]["egg_type"]] ??
        INCUBATION_MAXIMUM_ADS["mystery_egg"];
      let watched = Number(egg["incubation"]["ads_watched"]) || 0;

      while (
        watched < maximum &&
        !this.adsUnavailable &&
        !this.signal.aborted
      ) {
        const result = await this.watchAdFor("incubation_boost", {
          eggId: egg["_id"],
        });

        if (!result) break;

        watched++;
        boosted++;

        if (result["egg"]?.["incubation"]) {
          egg["incubation"] = result["egg"]["incubation"];
        }

        this.logger.success(
          `Boosted ${egg["incubation"]["egg_type"]} incubation (${watched}/${maximum}).`,
        );

        if (
          new Date(egg["incubation"]["ends_at"]).getTime() <=
          this.getServerNow()
        ) {
          break;
        }
      }
    }

    if (boosted) {
      await this.loadState();
      await this.hatchReadyEggs();
    }
  }

  /** Slots the account has */
  getMonsterSlots() {
    return Number(this.getProfile()["monster_slots"]) || DEFAULT_MONSTER_SLOTS;
  }

  /** Slots taken by monsters and incubating eggs, leaving out mentors and the dead */
  getOccupiedSlots() {
    return this.getMonsters().filter(
      (monster) => !monster["is_mentor"] && !this.hasLifespanExpired(monster),
    ).length;
  }

  /** Eggs waiting in the inventory */
  getOwnedEggs() {
    return EGG_TYPES.reduce(
      (total, type) => total + (Number(this.getInventory()[type]) || 0),
      0,
    );
  }

  /** The next mystery egg's lumis price, as the store works it out */
  getMysteryEggPrice() {
    const bought =
      Number(this.getProfile()["mystery_egg_lumis_purchases"]) || 0;

    return Math.min(
      MYSTERY_EGG_MAXIMUM_PRICE,
      Math.floor(MYSTERY_EGG_BASE_PRICE * MYSTERY_EGG_PRICE_GROWTH ** bought),
    );
  }

  /** Lumis an hour a newly hatched monster is expected to make, judged from the monsters already owned */
  getExpectedNewMonsterRate() {
    const rates = this.getLiveMonsters()
      .map((monster) => Number(monster["base_production_rate"]))
      .filter((rate) => Number.isFinite(rate) && rate > 0);

    if (!rates.length) return null;

    const average = rates.reduce((sum, rate) => sum + rate, 0) / rates.length;

    return average * NEW_MONSTER_VITALS_MULTIPLIER;
  }

  /** Whether spending this much on one more monster pays back in time, always true with no monster to judge by */
  paysBack(price) {
    const rate = this.getExpectedNewMonsterRate();

    if (rate === null) return true;

    return price <= rate * 24 * GROW_PAYBACK_DAYS;
  }

  /** Whether the balance covers a price and still keeps the vitals reserve */
  canAfford(price) {
    return this.getLumis() - price >= LUMIS_RESERVE;
  }

  /** Whether a monster dies before a fresh egg could hatch in its place */
  needsReplacement() {
    const now = this.getServerNow();

    return this.getLiveMonsters().some((monster) => {
      const hatchedAt = new Date(monster["hatched_at"]).getTime();

      if (!Number.isFinite(hatchedAt)) return false;

      const endsAt = hatchedAt + this.getLifespanDays(monster) * DAY_MS;

      return endsAt - now <= REPLACEMENT_LEAD_HOURS * 36e5;
    });
  }

  /** The one purchase that adds a monster soonest, or null when nothing is worth buying */
  pickGrowthPurchase() {
    const slots = this.getMonsterSlots();
    const free = slots - this.getOccupiedSlots();
    const eggs = this.getOwnedEggs();
    const eggPrice = this.getMysteryEggPrice();
    const egg = {
      type: "egg",
      itemId: "mystery_egg",
      price: eggPrice,
      label: "a mystery egg",
    };

    /** A free slot, or a monster about to die, with no egg to fill it */
    if (eggs === 0 && (free > 0 || this.needsReplacement())) {
      if (!this.canAfford(eggPrice)) {
        this.logger.info(
          `A mystery egg costs ${this.formatAmount(eggPrice)} lumis, saving up.`,
        );
        return null;
      }

      if (!this.paysBack(eggPrice)) {
        this.logger.info(
          `A mystery egg at ${this.formatAmount(eggPrice)} lumis would not pay back in ${GROW_PAYBACK_DAYS} days.`,
        );
        return null;
      }

      return egg;
    }

    /** Every slot is taken, so the next monster needs a slot, and an egg unless one is spare */
    if (free <= 0 && slots >= 2 && slots < MAXIMUM_MONSTER_SLOTS) {
      const slotPrice = MONSTER_SLOT_PRICES[slots + 1];
      const total = slotPrice + (eggs > 0 ? 0 : eggPrice);

      if (!slotPrice || !this.canAfford(total)) return null;

      if (!this.paysBack(total)) {
        this.logger.info(
          `Slot ${slots + 1} at ${this.formatAmount(total)} lumis would not pay back in ${GROW_PAYBACK_DAYS} days.`,
        );
        return null;
      }

      return {
        type: "monster_slot",
        itemId: "monster_slot",
        price: slotPrice,
        label: `slot ${slots + 1}`,
      };
    }

    return null;
  }

  /** Unlock the second slot, which costs ads rather than lumis */
  async unlockSecondSlot() {
    if (this.getMonsterSlots() >= 2 || this.adsUnavailable) return;

    this.logger.info(`Unlocking slot 2 with ${SLOT_2_ADS_REQUIRED} ads...`);

    const result = await this.watchAdSequence("monster_slot");

    if (!result) {
      this.logger.warn("Slot 2 is still locked.");
      return;
    }

    this.logger.success("Unlocked slot 2.");

    await this.loadState();
  }

  /** Watch an action's whole ad sequence, waiting between ads as the backend asks
   * @returns {Promise<object|null>} the final settlement, or `null` when the sequence broke off
   */
  async watchAdSequence(action, metadata) {
    for (let index = 0; index < 10 && !this.signal.aborted; index++) {
      const result = await this.watchAdFor(action, metadata);

      if (!result) return null;

      if (!result["intermediate"]) return result;

      await this.utils.delayForSeconds(Number(result["nextWaitSeconds"]) || 0, {
        signal: this.signal,
      });
    }

    return null;
  }

  /* --------------------------------------------------------------------- */
  /* Missions                                                              */
  /* --------------------------------------------------------------------- */

  /** Claim every available mission across the board's buckets */
  async completeMissions() {
    for (const bucket of MISSION_BUCKETS) {
      const missions = await this.fetchAllMissions(bucket);

      for (const mission of missions) {
        if (this.signal.aborted) return;

        await this.completeMission(mission);
      }
    }
  }

  /** Every page of a bucket */
  async fetchAllMissions(bucket) {
    const missions = [];
    let cursor = null;

    do {
      const page = await this.fetchMissions(bucket, cursor);

      missions.push(...(page["missions"] || []));
      cursor = page["hasMore"] ? page["nextCursor"] : null;
    } while (cursor && !this.signal.aborted);

    return missions;
  }

  /** Open a mission's link, wait, and claim it */
  async completeMission(mission) {
    const url = mission["url"];

    if (url && !this.validateTelegramTask(url)) {
      return;
    }

    await this.openTaskLink(url, MISSION_DWELL_SECONDS);

    const result = await this.claimMission(mission["id"]);

    if (!result.ok) {
      const reason = result.data["reason"];

      if (reason === "RATE_LIMIT") {
        this.logger.info("Mission claims are rate limited, stopping.");
        throw new Error("Mission claims are rate limited");
      }

      if (!MISSION_SKIP_REASONS.includes(reason)) {
        this.logger.warn(
          `Failed to claim "${mission["title"]}":`,
          result.data["error"] || reason,
        );
      }
      return;
    }

    this.applyResult(result.data);
    this.logger.success(
      `Claimed "${mission["title"]}" for ${mission["rewardLumis"] ?? "?"} lumis.`,
    );
  }

  /* --------------------------------------------------------------------- */
  /* Withdrawal                                                            */
  /* --------------------------------------------------------------------- */

  /** Request a payout once the fee ladder bottoms out */
  async withdraw({ max, difference = 20, force = false } = {}) {
    const scheduledSkip = this.skipScheduledWithdrawal(force);

    if (scheduledSkip) return scheduledSkip;

    await this.ensureStateLoaded();

    const payments = this.getProfile()["payments"] || {};

    if (!payments["wallet"]) {
      return this.skipWithdrawal("No wallet connected!");
    }

    const fee = Number(payments["withdrawal_fee"]);

    if (Number.isFinite(fee) && fee > MAXIMUM_WITHDRAWAL_FEE && !force) {
      return this.skipWithdrawal(`Withdrawal fee is still ${fee}%!`, {
        log: "warn",
      });
    }

    const config = await this.fetchConfig();
    const minimum = this.getMinimumWithdrawal();
    const quota = config["withdraw_quota"] || {};
    const remaining = Number(
      quota["remaining_lumis"] ?? quota["remainingLumis"] ?? quota["cap_lumis"],
    );
    const balance = this.getLumis();
    const requiredBalance = force ? minimum : minimum + WITHDRAWAL_BUFFER;

    if (balance < requiredBalance) {
      this.logger.error("Not enough balance:", balance);
      return this.skipWithdrawal("Not enough balance!", {
        amount: balance,
        log: null,
      });
    }

    if (Number.isFinite(remaining) && remaining < minimum) {
      return this.skipWithdrawal("Withdrawal quota is used up!", {
        log: "warn",
      });
    }

    const amount = Math.floor(
      Number(
        this.pickWithdrawalAmount({
          balance,
          minimum,
          max,
          difference,
          ceiling: Number.isFinite(remaining) ? remaining : 0,
        }),
      ),
    );

    const result = await this.requestWithdrawal(amount);

    if (result.data["status"] === "requires_reconciliation") {
      return this.skipWithdrawal(
        "Monsterland wants the balance reconciled first, do it in the app!",
        { amount, log: "warn" },
      );
    }

    if (!result.ok || !result.data["success"]) {
      const message = result.data["error"] || "Withdrawal failed";

      this.logger.error("Failed to withdraw:", message);
      return { status: false, message, amount: String(amount) };
    }

    this.applyResult(result.data);
    this.logger.success(`Requested a withdrawal of ${amount} lumis.`);

    return { status: true, amount: String(amount) };
  }

  /** The game publishes its minimum in its config */
  getMinimumWithdrawal() {
    return (
      Number(this.config_data?.["min_withdrawal_lumis"]) ||
      super.getMinimumWithdrawal()
    );
  }

  /** Payout rows from the payment history, newest first */
  async getWithdrawals() {
    const history = await this.fetchPaymentHistory();

    return history.filter((item) => item["type"] === "withdrawal");
  }

  /** Whether the game still owes this account a payout */
  async hasPendingWithdrawal() {
    const withdrawals = await this.getWithdrawals();

    return withdrawals.some((item) => this.isPendingWithdrawal(item));
  }

  /** Anything not settled or refused is still in flight, `processing` and `pending_approval` included */
  isPendingWithdrawal(item) {
    const status = String(item["status"] || "");

    return (
      !SETTLED_WITHDRAWAL_STATUSES.includes(status) &&
      !FLAGGED_WITHDRAWAL_STATUSES.includes(status)
    );
  }

  /** The account's own withdrawal queue */
  async getAutoWithdrawals() {
    const withdrawals = await this.getWithdrawals();

    return {
      pending: withdrawals.filter((item) => this.isPendingWithdrawal(item)),
      approved: withdrawals.filter((item) =>
        SETTLED_WITHDRAWAL_STATUSES.includes(item["status"]),
      ),
      flagged: withdrawals.filter((item) =>
        FLAGGED_WITHDRAWAL_STATUSES.includes(item["status"]),
      ),
    };
  }

  /* --------------------------------------------------------------------- */
  /* Wallet                                                                */
  /* --------------------------------------------------------------------- */

  /** The bound address in its friendly, non-bounceable form */
  getConnectedWalletAddress() {
    const address = this.getProfile()["payments"]?.["wallet"];

    return address ? this.utils.toFriendlyAddress(address) : null;
  }

  /** Bind an address, sent friendly and non-bounceable the way TON Connect's `useTonAddress` hands it to the page */
  async connectWalletAddress(address) {
    if (!this.utils.toRawAddress(address)) {
      this.logger.error("Not a valid TON address:", address);
      return { status: false, message: "Not a valid TON address" };
    }

    const wallet = this.utils.toFriendlyAddress(address);
    const result = await this.patchUser({ wallet });

    if (!result.ok || result.data["success"] === false) {
      const message = result.data["error"] || "Failed to connect the wallet";

      this.logger.error(message);
      return { status: false, message };
    }

    const profile = this.getProfile();

    profile["payments"] = result.data["payments"] || {
      ...profile["payments"],
      wallet,
    };

    this.logger.success(`Wallet connected: ${wallet}`);

    return { status: true, message: "Wallet connected" };
  }

  /** Unbind the wallet, which the page does by saving an empty one */
  disconnectWallet() {
    return this.patchUser({ wallet: "" });
  }

  /** Bind a wallet, prompting for its address */
  async connectWalletInteractive() {
    const input = await this.promptInput("Enter your TON wallet address:");
    const address = (input || "").trim();

    if (!address) {
      this.logger.warn("No address provided.");
      return;
    }

    if (!this.utils.isTonAddress(address)) {
      this.logger.warn("Not a valid TON address.");
      return;
    }

    await this.ensureStateLoaded();
    await this.connectWalletAddress(address);
  }

  /** Unbind the wallet the account is on */
  async disconnectWalletInteractive() {
    await this.ensureStateLoaded();

    const result = await this.disconnectWallet();

    if (!result.ok || result.data["success"] === false) {
      this.logger.error("Failed to disconnect:", result.data["error"]);
      return;
    }

    const profile = this.getProfile();

    profile["payments"] = { ...profile["payments"], wallet: "" };

    await this.rememberWalletVersion(undefined);
    this.logger.success("Wallet disconnected.");
  }

  /* --------------------------------------------------------------------- */
  /* Auto adapter                                                          */
  /* --------------------------------------------------------------------- */

  /** Collect the day's free rewards so the summary reflects the current balance */
  async refreshAutoState() {
    await this.ensureStateLoaded();
    await this.claimStreak();
  }

  /** Re-read the state for a fresh summary */
  async refreshAutoSummary() {
    await this.loadState();

    if (!this.config_data) {
      await this.fetchConfig().catch(() => null);
    }

    return this.getAutoSummary();
  }

  /** Put the account to work and report it afresh */
  async startAutoMining() {
    await this.ensureStateLoaded();
    await this.claimStreak();
    await this.manageEggs();
    await this.careForMonsters();

    return this.refreshAutoSummary();
  }

  /** Normalized account snapshot, with no holding since the game does not level on one */
  getAutoSummary() {
    const profile = this.getProfile();
    const address = this.getConnectedWalletAddress();

    return {
      level: profile["level"] ?? 0,
      holding: null,
      balance: this.getLumis(),
      minWithdrawal: this.getMinimumWithdrawal(),
      verified: true,
      wallet: address
        ? { address, version: this.connectedWalletVersion }
        : null,
      banned: false,
      banReason: null,
    };
  }

  /* --------------------------------------------------------------------- */
  /* Tools (manual actions)                                                */
  /* --------------------------------------------------------------------- */

  createTools() {
    return [
      {
        name: "Wallet",
        list: this.createAutoWalletTools(),
      },
    ];
  }
}
