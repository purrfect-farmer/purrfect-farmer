import BaseFarmer from "../lib/BaseFarmer.js";
import Decimal from "decimal.js";
import { Address } from "@ton/core";
import { getJettonBalance } from "../lib/auto/wallet.js";

/**
 * Safety margin above the drop's minimum required by unattended runs, so a
 * scheduled farmer does not withdraw the instant it crosses the minimum.
 * Cloud batch withdrawals pass `force: true` to bypass it.
 */
const WITHDRAWAL_BUFFER = 200;

/** The drop's single API endpoint — a Supabase-shaped PHP bridge. */
const API_URL = "https://sleepymine.xyz/api/db.php";

/** Mining claims are gated to one every 4 hours, server-side. */
const CLAIM_COOLDOWN_MS = 4 * 60 * 60 * 1000;

/** Official tasks and the ad allowance both reset on a 24-hour cycle. */
const RESET_MS = 86400000;

/** Everyone mines 1.5 SLPY/day without holding anything. */
const FREE_MINER_SPEED = 1.5;

/** Reward for the two hardcoded Telegram tasks the app ships with. */
const STATIC_TASK_REWARD = 5;

/** Gates the drop enforces on every withdrawal, on top of the minimum. */
const WITHDRAWAL_MIN_HOLDING = 1000;
const WITHDRAWAL_MIN_ADS = 5;
const WITHDRAWAL_MIN_TASKS = 5;

/**
 * Holding tiers, indexed by level (0..100). `reward` is SLPY per day.
 * Mirrors `LEVEL_DATA` in the drop's own `assets/js/app.js`.
 */
const LEVEL_DATA = [
  { req: 0, reward: 0 },
  { req: 1000, reward: 10 },
  { req: 2000, reward: 12 },
  { req: 3000, reward: 14 },
  { req: 4000, reward: 16 },
  { req: 5000, reward: 18 },
  { req: 6500, reward: 20 },
  { req: 8000, reward: 22 },
  { req: 10000, reward: 24 },
  { req: 12500, reward: 26 },
  { req: 15000, reward: 30 },
  { req: 18000, reward: 35 },
  { req: 21000, reward: 40 },
  { req: 25000, reward: 45 },
  { req: 30000, reward: 50 },
  { req: 35000, reward: 55 },
  { req: 40000, reward: 60 },
  { req: 45000, reward: 65 },
  { req: 50000, reward: 70 },
  { req: 60000, reward: 80 },
  { req: 70000, reward: 90 },
  { req: 80000, reward: 100 },
  { req: 90000, reward: 110 },
  { req: 100000, reward: 120 },
  { req: 115000, reward: 130 },
  { req: 130000, reward: 140 },
  { req: 145000, reward: 150 },
  { req: 160000, reward: 160 },
  { req: 180000, reward: 175 },
  { req: 200000, reward: 190 },
  { req: 225000, reward: 200 },
  { req: 250000, reward: 220 },
  { req: 280000, reward: 240 },
  { req: 310000, reward: 260 },
  { req: 350000, reward: 280 },
  { req: 400000, reward: 300 },
  { req: 450000, reward: 325 },
  { req: 500000, reward: 350 },
  { req: 560000, reward: 375 },
  { req: 630000, reward: 400 },
  { req: 700000, reward: 450 },
  { req: 800000, reward: 500 },
  { req: 900000, reward: 550 },
  { req: 1000000, reward: 600 },
  { req: 1100000, reward: 650 },
  { req: 1250000, reward: 700 },
  { req: 1400000, reward: 750 },
  { req: 1600000, reward: 800 },
  { req: 1800000, reward: 850 },
  { req: 2000000, reward: 900 },
  { req: 2250000, reward: 1000 },
  { req: 2500000, reward: 1100 },
  { req: 2800000, reward: 1200 },
  { req: 3100000, reward: 1300 },
  { req: 3500000, reward: 1400 },
  { req: 4000000, reward: 1500 },
  { req: 4500000, reward: 1600 },
  { req: 5000000, reward: 1700 },
  { req: 5500000, reward: 1800 },
  { req: 6000000, reward: 1900 },
  { req: 6500000, reward: 2000 },
  { req: 7000000, reward: 2200 },
  { req: 7500000, reward: 2400 },
  { req: 8000000, reward: 2600 },
  { req: 8500000, reward: 2800 },
  { req: 9000000, reward: 3000 },
  { req: 10000000, reward: 3250 },
  { req: 11000000, reward: 3500 },
  { req: 12000000, reward: 3750 },
  { req: 13000000, reward: 4000 },
  { req: 14000000, reward: 4500 },
  { req: 15000000, reward: 5000 },
  { req: 16000000, reward: 5500 },
  { req: 17000000, reward: 6000 },
  { req: 18000000, reward: 6500 },
  { req: 20000000, reward: 7000 },
  { req: 22000000, reward: 7500 },
  { req: 24000000, reward: 8000 },
  { req: 26000000, reward: 8500 },
  { req: 28000000, reward: 9000 },
  { req: 30000000, reward: 10000 },
  { req: 32000000, reward: 11000 },
  { req: 34000000, reward: 12000 },
  { req: 36000000, reward: 13000 },
  { req: 38000000, reward: 14000 },
  { req: 40000000, reward: 15000 },
  { req: 42000000, reward: 16000 },
  { req: 45000000, reward: 17000 },
  { req: 48000000, reward: 18000 },
  { req: 50000000, reward: 19000 },
  { req: 55000000, reward: 20000 },
  { req: 60000000, reward: 22000 },
  { req: 65000000, reward: 24000 },
  { req: 70000000, reward: 26000 },
  { req: 75000000, reward: 28000 },
  { req: 80000000, reward: 30000 },
  { req: 85000000, reward: 35000 },
  { req: 90000000, reward: 40000 },
  { req: 95000000, reward: 45000 },
  { req: 100000000, reward: 50000 },
  { req: 120000000, reward: 60000 },
];

/**
 * The two Telegram tasks the app hardcodes in its markup rather than serving
 * from `official_tasks`. They share the 24h reset of the table-driven ones.
 */
const STATIC_OFFICIAL_TASKS = [
  {
    type: "tg_channel",
    title: "Join Telegram Channel",
    link: "https://t.me/SleepyMineNews",
    reward: STATIC_TASK_REWARD,
  },
  {
    type: "tg_group",
    title: "Join Telegram Group",
    link: "https://t.me/SleepyMineChats",
    reward: STATIC_TASK_REWARD,
  },
];

export default class SlpyFarmer extends BaseFarmer {
  static id = "slpy";
  static title = "SLPY";
  static emoji = "😴";
  static host = "sleepymine.xyz";
  static domains = ["sleepymine.xyz"];
  static telegramLink = "https://t.me/MineSLPYBot?startapp=ref1147265290";
  static path = "/";
  static referrerMode = "random";
  static apiDelay = 500;
  static singleton = true;
  static rating = 5;

  static auto = {
    id: "slpy-auto",
    title: "SLPY Auto",
    token: "SLPY",
    jettonAddress: "EQA-mXHQ6mjXr8avmEwSszgeCxAez3uMAwFX1XI1Z4z9VDVp",
    storagePrefix: "slpy-auto",
    minWithdrawal: 500,
  };

  /**
   * Ads are credited without any proof of playback, capped at 500/day by the
   * server. Each run takes a slice of that rather than draining it, and 5 of
   * them per day is also what unlocks withdrawal.
   */
  static adsPerRun = 5;

  /** Get Referral Link */
  getReferralLink() {
    return `https://t.me/MineSLPYBot?startapp=ref${this.getUserId()}`;
  }

  /** Get or create device ID */
  getOrCreateDeviceId() {
    if (!this.deviceId) {
      this.deviceId = `dev_${this.utils.uuid().replace(/-/g, "")}`;
    }

    return this.deviceId;
  }

  /* --------------------------------------------------------------------- */
  /* Transport                                                             */
  /*                                                                       */
  /* Everything goes through one endpoint that speaks two shapes: an RPC    */
  /* call, and a Supabase-style table query. Both answer `{ data, error }`  */
  /* with HTTP 200 even on failure, so the envelope is unwrapped here.      */
  /* --------------------------------------------------------------------- */

  /** Post an envelope and unwrap it */
  async request(payload) {
    const response = await this.api
      .post(API_URL, payload)
      .then((res) => res.data);

    if (response?.error) {
      throw new Error(response.error.message || "Request failed");
    }

    return response?.data;
  }

  /** Call a stored procedure */
  rpc(fn, args = {}) {
    return this.request({ action: "rpc", fn, args });
  }

  /** Run a table query */
  table({
    table,
    action = "select",
    select = "*",
    filters = [],
    order = null,
    limit = null,
    single = false,
    payload = null,
  }) {
    return this.request({
      table,
      action,
      select,
      filters,
      order,
      limit,
      single,
      payload,
    });
  }

  /* --------------------------------------------------------------------- */
  /* API wrappers                                                          */
  /* --------------------------------------------------------------------- */

  /** Admin-configured settings (min holding for mining, referral bonus, ...) */
  getPublicSettings() {
    return this.rpc("get_public_settings");
  }

  /** Report this device so the drop's multi-account detection sees it */
  trackAccess() {
    return this.rpc("track_access", {
      uid: this.getUid(),
      ["device_id"]: this.getOrCreateDeviceId(),
    });
  }

  /** Create the account row (INSERT IGNORE server-side) */
  registerUser(referrer) {
    return this.rpc("register_user", {
      uid: this.getUid(),
      name: this.getUserFirstName(),
      username: this.getUsername() || "",
      referrer,
    });
  }

  /** Fetch the account row */
  getUserRow() {
    return this.table({
      table: "airdrop_users",
      filters: [{ col: "uid", op: "eq", val: this.getUid() }],
      single: true,
    });
  }

  /** Patch columns on the account row */
  updateUserRow(payload) {
    return this.table({
      table: "airdrop_users",
      action: "update",
      filters: [{ col: "uid", op: "eq", val: this.getUid() }],
      payload,
    });
  }

  /** Accounts referred by this one */
  getReferrals() {
    return this.table({
      table: "airdrop_users",
      filters: [{ col: "referrer", op: "eq", val: this.getUid() }],
    });
  }

  /** Official tasks, newest first */
  getOfficialTasks() {
    return this.table({
      table: "official_tasks",
      order: { col: "created_at", ascending: false },
    });
  }

  /** User-created community missions, newest first */
  getCommunityTasks() {
    return this.table({
      table: "community_tasks",
      order: { col: "created_at", ascending: false },
    });
  }

  /** Claim accrued mining */
  claimMining(amount) {
    return this.rpc("claim_mining", {
      uid: this.getUid(),
      amount: Number(amount),
      ["cooldown_ms"]: CLAIM_COOLDOWN_MS,
    });
  }

  /** Credit an official task */
  completeTask(taskKey, reward) {
    return this.rpc("complete_task", {
      uid: this.getUid(),
      ["task_key"]: taskKey,
      reward,
    });
  }

  /** Credit a community task */
  completeCommunityTask(taskKey, reward) {
    return this.rpc("complete_community_task", {
      uid: this.getUid(),
      ["task_key"]: taskKey,
      reward,
    });
  }

  /** Credit a watched ad */
  creditAdReward() {
    return this.rpc("credit_ad_reward", { uid: this.getUid() });
  }

  /** Link a TON wallet to this account */
  bindWallet(address) {
    return this.rpc("bind_wallet", { uid: this.getUid(), address });
  }

  /** Pay this account's referrer their activation bonus */
  creditReferralBonus() {
    return this.rpc("credit_referral_bonus", { uid: this.getUid() });
  }

  /** Request a withdrawal */
  requestWithdrawal(amount) {
    return this.rpc("request_withdrawal", {
      uid: this.getUid(),
      amount: Number(amount),
    });
  }

  /* --------------------------------------------------------------------- */
  /* Auth                                                                  */
  /*                                                                       */
  /* The API carries no auth of any kind — no token, no initData, no        */
  /* signature. Every call is keyed purely on the Telegram user id.         */
  /* --------------------------------------------------------------------- */

  /** The account key every call is scoped by */
  getUid() {
    return this.getUserId()?.toString();
  }

  /** Referrer id carried by the `?startapp=ref<uid>` deep link */
  getReferrerFromStartParam() {
    const match = /^ref(\d+)$/.exec(this.getStartParam() || "");
    const referrer = match?.[1];

    /* The app refuses to record a user as their own referrer */
    return referrer && referrer !== this.getUid() ? referrer : null;
  }

  /** Get Auth */
  async fetchAuth() {
    return this.login();
  }

  /** Load settings and the account row, registering the account if it is new */
  async login() {
    this.settings = await this.getPublicSettings();
    this.debugger.log("Public settings:", this.settings);

    if (this.settings?.maintenance) {
      throw new Error("SleepyMine is under maintenance");
    }

    this.user_data = await this.getUserRow();

    if (!this.user_data) {
      const referrer = this.getReferrerFromStartParam();

      this.logger.info("Registering new account...");
      await this.registerUser(referrer);
      await this.utils.delayForSeconds(3, { signal: this.signal });

      this.user_data = await this.getUserRow();

      if (!this.user_data) {
        throw new Error("Failed to register account");
      }

      this.logger.success("Account registered!");
    }

    this.debugger.log("User data:", this.user_data);

    if (this.user_data.banned === true) {
      throw new Error(
        `Account is banned: ${this.user_data["ban_reason"] || "no reason given"}`,
      );
    }

    await this.trackAccess();

    return this.user_data;
  }

  /** Get User Details */
  getUserDetails() {
    return this.user_data;
  }

  /** Refresh the cached account row */
  async refreshUserRow() {
    this.user_data = await this.getUserRow();
    return this.user_data;
  }

  /** The holding required before a wallet raises the mining rate */
  getMinimumHolding() {
    return Number(this.settings?.["min_hold_mining"] ?? WITHDRAWAL_MIN_HOLDING);
  }

  /* --------------------------------------------------------------------- */
  /* Mining                                                                */
  /*                                                                       */
  /* Mining is accrued client-side: the server only stores the counters and */
  /* trusts whatever the page claims. `unclaimed_mined` is the progress at  */
  /* the last save and `last_sync_time` is when that was, so the amount     */
  /* owed is the stored progress plus whatever the elapsed time earned.     */
  /* --------------------------------------------------------------------- */

  /** Highest tier the given holding unlocks */
  calculateLevel(holding) {
    let level = 0;
    for (let i = 1; i < LEVEL_DATA.length; i++) {
      if (holding >= LEVEL_DATA[i].req) level = i;
      else break;
    }
    return level;
  }

  /** SLPY per day at the given tier */
  getSpeedForLevel(level, holding) {
    if (level === 0 || holding < this.getMinimumHolding()) {
      return new Decimal(FREE_MINER_SPEED);
    }
    return new Decimal(LEVEL_DATA[level].reward);
  }

  /** SLPY per day this account currently earns */
  getDailyMiningRate() {
    const holding = Number(this.user_data?.["wallet_holding"] || 0);
    return this.getSpeedForLevel(this.calculateLevel(holding), holding);
  }

  /**
   * Mining owed right now.
   *
   * Accrual is capped at 24h of elapsed time, matching the page — leaving the
   * account idle for longer than that earns nothing extra.
   */
  getAccruedMining() {
    const stored = new Decimal(this.user_data?.["unclaimed_mined"] || 0);
    const lastSync = Number(this.user_data?.["last_sync_time"]) || Date.now();
    const elapsed = Math.min(
      86400,
      Math.max(0, (Date.now() - lastSync) / 1000),
    );

    return stored
      .plus(this.getDailyMiningRate().div(86400).times(elapsed))
      .toDecimalPlaces(6);
  }

  /** Milliseconds left on the claim cooldown, or 0 when it is open */
  getClaimCooldownRemaining() {
    const lastClaim = Number(this.user_data?.["last_claim_time"]) || 0;
    if (!lastClaim) return 0;
    return Math.max(0, CLAIM_COOLDOWN_MS - (Date.now() - lastClaim));
  }

  /** Format a duration for the log */
  formatDuration(ms) {
    return this.utils.dateFns.formatDistanceStrict(0, Math.max(0, ms));
  }

  /**
   * Claim whatever mining has accrued.
   *
   * The server does not zero `unclaimed_mined` on a claim — the page only
   * appears to because its periodic save writes the post-claim zero back. This
   * writes it explicitly, otherwise the next run would re-claim the same
   * progress on top of a fresh accrual.
   */
  async startOrClaimMining() {
    const remaining = this.getClaimCooldownRemaining();

    if (remaining > 0) {
      this.logger.info(
        `Claim on cooldown - next claim in ${this.formatDuration(remaining)}.`,
      );
      return;
    }

    const amount = this.getAccruedMining();

    if (amount.lessThan(0.0001)) {
      this.logger.warn("No rewards to claim yet.");
      return;
    }

    this.logger.info(`Claiming ${amount.toString()} SLPY...`);
    const result = await this.claimMining(amount);
    this.debugger.log("Claim result:", result);

    if (!result?.success) {
      if (result?.reason === "cooldown") {
        this.logger.warn(
          `Claim on cooldown - next claim in ${this.formatDuration(result["ms_left"] || 0)}.`,
        );
        this.user_data["last_claim_time"] =
          Date.now() - CLAIM_COOLDOWN_MS + Number(result["ms_left"] || 0);
        return;
      }

      throw new Error("Failed to claim mining");
    }

    /* Reset the accrual window so the claimed progress is not counted twice */
    await this.updateUserRow({
      ["unclaimed_mined"]: 0,
      ["last_sync_time"]: Date.now(),
    });

    Object.assign(this.user_data, {
      points: result.points,
      ["mined_points"]: result["mined_points"],
      ["last_claim_time"]: result["last_claim_time"],
      ["unclaimed_mined"]: 0,
      ["last_sync_time"]: Date.now(),
    });

    this.logger.success(`Claimed! Balance: ${result.points}`);
  }

  /* --------------------------------------------------------------------- */
  /* Ads                                                                   */
  /* --------------------------------------------------------------------- */

  /** Ads watched inside the current 24h window, per the server's counters */
  getAdsWatchedToday() {
    const resetAt = Number(this.user_data?.["ads_watched_reset_at"]) || 0;
    if (!resetAt || Date.now() - resetAt >= RESET_MS) return 0;
    return Number(this.user_data?.["ads_watched_count"]) || 0;
  }

  /** Tasks completed inside the current 24h window */
  getTasksCompletedToday() {
    const resetAt = Number(this.user_data?.["tasks_completed_reset_at"]) || 0;
    if (!resetAt || Date.now() - resetAt >= RESET_MS) return 0;
    return Number(this.user_data?.["tasks_completed_count"]) || 0;
  }

  /**
   * Credit ads.
   *
   * The reward is granted server-side with no proof of playback, so this is
   * just a paced loop. Five a day is also one of the withdrawal requirements.
   */
  async watchAds() {
    const limit = this.constructor.adsPerRun;
    let watched = 0;

    for (let i = 0; i < limit; i++) {
      if (this.signal.aborted) break;

      const result = await this.creditAdReward();
      this.debugger.log("Ad reward:", result);

      if (!result?.success) {
        if (result?.reason === "daily_limit") {
          this.logger.warn("Daily ad limit reached.");
          break;
        }

        this.logger.warn("Ad reward rejected - stopping.");
        break;
      }

      watched++;

      Object.assign(this.user_data, {
        points: result.points,
        ["ads_watched_count"]: result.count,
        ["ads_watched_reset_at"]: result["reset_at"],
      });

      this.logger.info(
        `Watched ${watched} ad(s) - ${this.getAdsWatchedToday()} today.`,
      );

      await this.utils.delayForSeconds(10, { signal: this.signal });
    }

    this.logger.success(
      `Watched ${watched} ad(s) - ${this.getAdsWatchedToday()} today.`,
    );
  }

  /* --------------------------------------------------------------------- */
  /* Tasks                                                                 */
  /*                                                                       */
  /* Official tasks reset daily: a stored numeric value is the completion   */
  /* timestamp and only counts while inside the 24h window, whereas `true`  */
  /* marks a one-time task done for good. Community tasks never reset.      */
  /* --------------------------------------------------------------------- */

  /** Whether an official task's stored value still counts as done */
  isOfficialTaskDone(value) {
    if (value === true) return true;
    if (typeof value === "number") return Date.now() - value < RESET_MS;
    return false;
  }

  /** Complete the hardcoded and table-driven official tasks */
  async completeOfficialTasks() {
    const tasks = await this.getOfficialTasks();
    this.debugger.log("Official tasks:", tasks);

    const completed = this.user_data?.tasks || {};
    const pending = STATIC_OFFICIAL_TASKS.concat(
      (tasks || []).map((task) => ({
        type: task.type || `off_${task.id}`,
        title: task.title,
        link: task.link,
        reward: task.reward,
      })),
    ).filter((task) => !this.isOfficialTaskDone(completed[task.type]));

    if (!pending.length) {
      this.logger.info("No official tasks to complete.");
      return;
    }

    for (const task of pending) {
      if (this.signal.aborted) break;
      await this.creditTask(task, (key, reward) =>
        this.completeTask(key, reward),
      );
    }
  }

  /** Complete the community missions this account has not joined yet */
  async completeCommunityTasks() {
    const tasks = await this.getCommunityTasks();
    this.debugger.log("Community tasks:", tasks);

    const completed = this.user_data?.["c_tasks"] || {};
    const pending = (tasks || [])
      .filter((task) => {
        const target = Number(task.target) || 0;
        const done = Number(task.completed) || 0;

        /* Missions retire once they hit the completions they were paid for */
        return !(target > 0 && done >= target);
      })
      .filter((task) => !completed[task.id])
      .map((task) => ({
        type: task.id,
        title: task.name,
        link: task.link,
        reward: Number(task.reward) || 40,
      }));

    if (!pending.length) {
      this.logger.info("No community tasks to complete.");
      return;
    }

    for (const task of pending) {
      if (this.signal.aborted) break;
      await this.creditTask(task, (key, reward) =>
        this.completeCommunityTask(key, reward),
      );
    }
  }

  /**
   * Join a task's Telegram link where possible, then credit it.
   *
   * Crediting is unverified, but joining first is what the task is nominally
   * asking for; it is a no-op when no Telegram client is attached.
   */
  async creditTask(task, credit) {
    const label = task.title || task.type;

    try {
      await this.tryToJoinTelegramLink(task.link);

      const result = await credit(task.type, task.reward);
      this.debugger.log(`Task result (${task.type}):`, result);

      if (result?.success) {
        this.user_data.points = result.points;
        this.logger.success(`Completed task: ${label} (+${task.reward} SLPY)`);
      } else if (result?.reason === "already_completed") {
        this.user_data.points = result.points ?? this.user_data.points;
        this.logger.info(`Task already completed: ${label}`);
      } else {
        this.logger.warn(`Task not credited: ${label}`);
      }
    } catch (error) {
      this.logger.warn(`Task "${label}" failed:`, error.message);
    }

    await this.utils.delayForSeconds(15, { signal: this.signal });
  }

  /* --------------------------------------------------------------------- */
  /* Referrals                                                             */
  /* --------------------------------------------------------------------- */

  /**
   * Trigger the inviter's activation bonus.
   *
   * The server decides the amount and re-checks eligibility; the client only
   * signals that this account crossed the holding threshold.
   */
  async claimReferralBonus() {
    const { referrer, ["referral_rewarded"]: rewarded } = this.user_data;
    const holding = Number(this.user_data["wallet_holding"] || 0);

    if (!referrer) {
      this.logger.info("No referrer on this account.");
      return;
    }

    if (rewarded === true) {
      this.logger.info("Referral bonus already credited.");
      return;
    }

    if (holding < this.getMinimumHolding()) {
      this.logger.info(
        `Holding ${holding} SLPY - referrer is paid at ${this.getMinimumHolding()}.`,
      );
      return;
    }

    const result = await this.creditReferralBonus();
    this.debugger.log("Referral bonus result:", result);

    if (result?.success) {
      this.user_data["referral_rewarded"] = true;
      this.logger.success(`Referrer credited ${result.credited} SLPY!`);
    } else {
      this.logger.info("Referral bonus not credited yet.");
    }
  }

  /** Log the referral summary */
  async logReferrals() {
    const referrals = (await this.getReferrals()) || [];
    const minimum = this.getMinimumHolding();
    const active = referrals.filter(
      (referral) => Number(referral["wallet_holding"] || 0) >= minimum,
    );

    this.logger.keyValue("Referrals", referrals.length);
    this.logger.keyValue("Active Referrals", active.length, {
      valueStyle: this.logger.c.greenBright,
    });
  }

  /* --------------------------------------------------------------------- */
  /* Wallet                                                                */
  /* --------------------------------------------------------------------- */

  /**
   * The address form the drop stores.
   *
   * TON Connect hands the page a raw `0:<hex>` address and that is what ends
   * up in `wallet_address`, so anything entered by hand is normalized to match
   * — `bind_wallet` compares addresses as plain strings when enforcing that a
   * wallet belongs to one account only.
   */
  normalizeAddress(address) {
    return Address.parse(address).toRawString();
  }

  /** Read the wallet's on-chain SLPY and store it as the mining holding */
  async syncWalletHolding(address) {
    const holding = await getJettonBalance(
      this.constructor.auto.jettonAddress,
      address,
    );

    const value = holding.toNumber();

    await this.updateUserRow({
      ["wallet_holding"]: value,
      ["last_sync_time"]: Date.now(),
    });

    this.user_data["wallet_holding"] = value;
    this.user_data["last_sync_time"] = Date.now();

    return value;
  }

  /** Bind a wallet and refresh the drop's view of what it holds */
  async connectWallet(address) {
    const normalized = this.normalizeAddress(address);

    const result = await this.bindWallet(normalized);
    this.debugger.log("Bind wallet result:", result);

    if (result?.success === false) {
      throw new Error(
        result.reason === "wallet_in_use"
          ? "This wallet is already linked to another SleepyMine account"
          : `Failed to bind wallet: ${result.reason || "unknown reason"}`,
      );
    }

    this.user_data["wallet_address"] = normalized;

    /**
     * Mining accrues from `wallet_holding` in the database, not from the chain,
     * so the balance has to be pushed back after every bind — this is also what
     * makes an Auto boost show up as a higher mining rate.
     */
    const holding = await this.syncWalletHolding(normalized);

    return { address: normalized, holding };
  }

  /* --------------------------------------------------------------------- */
  /* Withdrawal                                                            */
  /* --------------------------------------------------------------------- */

  /** The drop's declared minimum, refined by whatever the server reports */
  getMinimumWithdrawal() {
    return Number(this.minimumWithdrawal ?? super.getMinimumWithdrawal());
  }

  /** Milliseconds left on the once-per-day withdrawal cooldown */
  getWithdrawalCooldownRemaining() {
    const last = Number(this.user_data?.["last_withdrawal_time"]) || 0;
    if (!last) return 0;
    return Math.max(0, RESET_MS - (Date.now() - last));
  }

  /**
   * Everything the drop requires beyond the amount itself, as human-readable
   * reasons. The server re-checks all of it — this only avoids burning a
   * request that is certain to be rejected.
   */
  getWithdrawalBlockers() {
    const blockers = [];
    const holding = Number(this.user_data?.["wallet_holding"] || 0);
    const ads = this.getAdsWatchedToday();
    const tasks = this.getTasksCompletedToday();
    const cooldown = this.getWithdrawalCooldownRemaining();

    if (!this.user_data?.["wallet_address"]) {
      blockers.push("No wallet linked");
    }
    if (holding < WITHDRAWAL_MIN_HOLDING) {
      blockers.push(
        `Holding ${holding}/${WITHDRAWAL_MIN_HOLDING} SLPY on-chain`,
      );
    }
    if (ads < WITHDRAWAL_MIN_ADS) {
      blockers.push(`Ads watched today ${ads}/${WITHDRAWAL_MIN_ADS}`);
    }
    if (tasks < WITHDRAWAL_MIN_TASKS) {
      blockers.push(`Tasks completed today ${tasks}/${WITHDRAWAL_MIN_TASKS}`);
    }
    if (cooldown > 0) {
      blockers.push(
        `Daily limit - next withdrawal in ${this.formatDuration(cooldown)}`,
      );
    }

    return blockers;
  }

  /**
   * The spendable balance.
   *
   * `points` is what every crediting RPC returns as the new balance;
   * `mined_points` is a lifetime-mined counter that the page mistakenly adds on
   * top for display.
   */
  getBalance() {
    return new Decimal(this.user_data?.points || 0);
  }

  /** Shape a gross request out of the balance, as ATF does */
  shapeAmount(balance, { max, difference }) {
    let amount = new Decimal(balance);

    /** Cap to max */
    if (max) {
      amount = Decimal.min(amount, max);
    }

    /** Apply difference */
    if (difference > 0) {
      const minPercent = new Decimal(100).minus(difference);
      const randomPercent = minPercent
        .plus(new Decimal(Math.random()).mul(difference + 1))
        .clamp(minPercent, 100);

      amount = amount.mul(randomPercent).div(100);
    }

    /** Reset amount to minimum */
    return Decimal.max(amount, this.getMinimumWithdrawal()).floor();
  }

  /** Turn a rejection envelope into a readable reason */
  describeWithdrawalRejection(result) {
    switch (result?.reason) {
      case "no_wallet":
        return "No wallet linked to this account";
      case "cooldown":
        return `Daily limit - next withdrawal in ${this.formatDuration(result["ms_left"] || 0)}`;
      case "insufficient_holding":
        return `On-chain holding ${result.holding} SLPY - ${result.required} required`;
      case "insufficient_balance":
        return `Insufficient balance - ${result.available} SLPY available`;
      case "min_amount":
        return `Minimum withdrawal is ${result.min} SLPY`;
      default:
        return "Withdrawal could not be processed";
    }
  }

  /** Send the request and narrate the outcome */
  async sendWithdrawal(amount) {
    const result = await this.requestWithdrawal(amount);
    this.debugger.log("Withdraw result:", result);

    if (result?.success !== true) {
      /* The server publishes its own minimum only when rejecting one */
      if (result?.reason === "min_amount" && result.min) {
        this.minimumWithdrawal = Number(result.min);
      }
      return { status: false, result };
    }

    Object.assign(this.user_data, {
      points: result.points,
      ["mined_points"]: result["mined_points"],
      ["last_withdrawal_time"]: Date.now(),
    });

    this.logger.success("Withdrawal requested!");
    this.logger.keyValue("Requested", result.amount);
    this.logger.keyValue("Fee", result.fee);
    this.logger.keyValue("Burn Tax", result["burn_tax"]);
    this.logger.keyValue("To receive", result["final_amount"], {
      valueStyle: this.logger.c.greenBright,
    });

    return { status: true, result };
  }

  /**
   * Place a withdrawal.
   *
   * `force` drops the safety buffer that keeps unattended runs from
   * withdrawing the moment they cross the minimum; cloud batch withdrawals
   * pass it.
   */
  async withdraw({ max, difference = 20, force = false } = {}) {
    /**
     * The gates below are counted server-side and `complete_task` reports only
     * the new balance, so the row has to be re-read — otherwise a run that just
     * completed its fifth task would still see four and skip the withdrawal.
     */
    await this.refreshUserRow();

    const blockers = this.getWithdrawalBlockers();

    if (blockers.length) {
      const message = blockers.join("; ");
      this.logger.warn("Withdrawal unavailable:", message);
      return { status: false, skipped: true, message, amount: "0" };
    }

    const balance = this.getBalance();
    const minimum = this.getMinimumWithdrawal();
    const required = force ? minimum : minimum + WITHDRAWAL_BUFFER;

    if (balance.lessThan(required)) {
      this.logger.error("Not enough balance:", balance.toString());
      return {
        status: false,
        skipped: true,
        message: "Not enough balance!",
        amount: balance.toString(),
      };
    }

    /** Log balance */
    this.logger.info("Available balance:", balance.toString());

    let amount = this.shapeAmount(balance, { max, difference });
    let { status, result } = await this.sendWithdrawal(amount);

    /**
     * The server is the authority on what is spendable. If it disagrees with
     * `points`, it says so — retry once against the figure it reported rather
     * than failing the account for the rest of the batch.
     */
    if (
      !status &&
      result?.reason === "insufficient_balance" &&
      result.available
    ) {
      const available = new Decimal(result.available);

      if (available.greaterThanOrEqualTo(minimum)) {
        amount = this.shapeAmount(available, { max, difference });
        this.logger.warn(`Retrying with ${amount.toString()} SLPY...`);
        ({ status, result } = await this.sendWithdrawal(amount));
      }
    }

    if (!status) {
      const message = this.describeWithdrawalRejection(result);
      this.logger.error("Failed to request withdrawal:", message);
      return { status: false, skipped: false, message, amount: "0" };
    }

    /**
     * Notify the admin, but only when the run was initiated by the scheduler.
     */
    if (this.scheduled) {
      await this.notifyAdmin([
        `<b>🤑 SLPY Withdrawal</b>`,
        `<b>Account</b>: ${this.formatAccountLink(this.getUserId())}`,
        `<b>Initial Balance</b>: ${balance.toString()}`,
        `<b>Requested</b>: ${result.amount}`,
        `<b>Fee</b>: ${result.fee}`,
        `<b>Burn Tax</b>: ${result["burn_tax"]}`,
        `<b>To receive</b>: ${result["final_amount"]}`,
        `<b>New Balance</b>: ${result.points}`,
      ]);
    }

    return {
      status: true,
      skipped: false,
      message: "Withdrawal requested!",
      amount: amount.toString(),
    };
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
            id: "connect-wallet",
            icon: "wallet",
            title: "Connect Wallet",
            action: this.connectWalletInteractive.bind(this),
            dispatch: false,
          },
        ],
      },
      {
        name: "Withdrawal",
        list: [
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

  /** Link a TON wallet address, prompting for it */
  async connectWalletInteractive() {
    const input = await this.promptInput("Enter your TON wallet address:");
    const address = (input || "").trim();

    if (!address) {
      this.logger.warn("No address provided.");
      return;
    }

    const { address: normalized, holding } = await this.connectWallet(address);

    this.logger.success("Wallet linked!");
    this.logger.keyValue("Address", normalized, {
      valueStyle: this.logger.c.whiteBright,
    });
    this.logger.keyValue("Holding", holding, {
      valueStyle: this.logger.c.greenBright,
    });
  }

  /** Request a withdrawal, prompting for the amount */
  async withdrawInteractive() {
    const blockers = this.getWithdrawalBlockers();

    if (blockers.length) {
      this.logger.warn("Withdrawal unavailable:");
      blockers.forEach((blocker) => this.logger.warn(`- ${blocker}`));
      return;
    }

    const balance = this.getBalance();
    const minimum = this.getMinimumWithdrawal();

    this.logger.keyValue("Balance", balance.toString());
    this.logger.keyValue("Minimum", minimum);

    const input = await this.promptInput("Enter amount of SLPY to withdraw:");
    const amount = parseFloat((input || "").trim());

    if (!amount) {
      this.logger.warn("No amount provided.");
      return;
    }

    if (balance.lessThan(amount)) {
      this.logger.warn(`Balance is only ${balance.toString()} SLPY.`);
      return;
    }

    if (amount < minimum) {
      this.logger.warn(`Minimum withdrawal is ${minimum} SLPY.`);
      return;
    }

    const { status, result } = await this.sendWithdrawal(amount);

    if (!status) {
      this.logger.error(this.describeWithdrawalRejection(result));
    }
  }

  /* --------------------------------------------------------------------- */
  /* Process                                                               */
  /* --------------------------------------------------------------------- */

  async process() {
    await this.login();

    this.logUserInfo();
    await this.executeTask("Mining", () => this.startOrClaimMining());
    await this.executeTask("Ads", () => this.watchAds());
    await this.executeTask("Tasks", () => this.completeOfficialTasks());
    await this.executeTask("Community Tasks", () =>
      this.completeCommunityTasks(),
    );
    await this.executeTask("Referral Bonus", () => this.claimReferralBonus());
    await this.executeTask("Friends", () => this.logReferrals());
    await this.executeTask("Withdraw", () => this.withdraw());
  }

  /** Log the current account state */
  logUserInfo() {
    const user = this.user_data;
    const holding = Number(user["wallet_holding"] || 0);
    const cooldown = this.getClaimCooldownRemaining();

    this.logger.newline();
    this.logCurrentUser();

    this.logger.keyValue("Balance", user.points);
    this.logger.keyValue("Wallet Holding", holding);
    this.logger.keyValue("Miner Level", this.calculateLevel(holding));
    this.logger.keyValue("Daily Mining", this.getDailyMiningRate().toString(), {
      valueStyle: this.logger.c.greenBright,
    });
    this.logger.keyValue("Unclaimed", this.getAccruedMining().toString(), {
      valueStyle: this.logger.c.yellowBright,
    });
    this.logger.keyValue(
      "Next Claim",
      cooldown > 0 ? this.formatDuration(cooldown) : "Available now",
    );

    this.logger.newline();
    this.logger.keyValue("Ads Today", this.getAdsWatchedToday());
    this.logger.keyValue("Tasks Today", this.getTasksCompletedToday());

    if (user["wallet_address"]) {
      this.logger.keyValue("Wallet", user["wallet_address"], {
        valueStyle: this.logger.c.whiteBright,
      });
    }
  }

  /* --------------------------------------------------------------------- */
  /* Auto adapter                                                          */
  /* --------------------------------------------------------------------- */

  /**
   * Link a TON wallet and let the drop re-read its SLPY holding.
   *
   * Only the address is needed — no key and no TON Connect proof — and
   * re-binding an address already on file is what refreshes the holding after
   * a boost.
   */
  async connectAutoWallet({ address }) {
    try {
      await this.connectWallet(address);

      return { status: true, summary: this.getAutoSummary() };
    } catch (error) {
      return { status: false, message: error.message || "Unknown error" };
    }
  }

  /** Claim pending mining so the summary reflects the current balance */
  async refreshAutoState() {
    await this.startOrClaimMining();
    await this.refreshUserRow();
  }

  /** Normalized account snapshot */
  getAutoSummary() {
    const user = this.user_data || {};
    const holding = Number(user["wallet_holding"] || 0);

    return {
      level: this.calculateLevel(holding),
      holding,
      balance: user.points ?? 0,
      minWithdrawal: this.getMinimumWithdrawal(),
      wallet: user["wallet_address"]
        ? { address: user["wallet_address"] }
        : null,
      banned: Boolean(user.banned),
      banReason: user["ban_reason"],

      /* SLPY publishes no risk data — the empty shape is what BaseAuto expects */
      risk: { score: null, updatedAt: null, flags: [] },
    };
  }
}
