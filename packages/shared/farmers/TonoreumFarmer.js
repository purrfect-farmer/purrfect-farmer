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

/** Every endpoint hangs off this one host. */
const API_URL = "https://app.tonoreum.com/api";

/**
 * Two endpoints are spelled with a capital `I` where the word wants a
 * lowercase `l` — homoglyph obfuscation on the drop's side. They are declared
 * here so a well-meaning "typo fix" cannot silently break the farmer.
 */
const REGISTER_PATH = "Ioghero2137"; /* "loghero2137" */
const COMPLETE_AD_PATH = "compIete_ad_quests"; /* "complete_ad_quests" */

/**
 * Mining runs on a 24h cycle but re-activation unlocks halfway through, which
 * is why the page disables its button on `time_until_reactivation` rather than
 * on `mining_active`.
 */
const REACTIVATION_HOURS = 12;

/** The server's own daily ad cap, mirrored from the page's `maxCount`. */
const ADS_DAILY_LIMIT = 40;

/** Credited per ad, with no proof of playback. */
const AD_REWARD_TORPOWER = 15;

/** Tap-ore recharges just under 12h — the page uses 11h59m exactly. */
const ORE_COOLDOWN_MS = 11 * 60 * 60 * 1000 + 59 * 60 * 1000;

/** Ads that buy one free withdrawal, and the withdrawal's own floor. */
const FREE_WITHDRAWAL_ADS = 1000;
const MINIMUM_WITHDRAWAL = 10000;

/**
 * The ad quest, which the page runs from its own button rather than the quest
 * list, so the quest loop leaves it alone.
 */
const AD_QUEST_ID = 1001;

/**
 * Quest actions a headless run cannot honestly complete: one wants the URL of
 * a tweet the account actually posted, the other an on-chain TON payment.
 */
const SKIPPED_QUEST_ACTIONS = ["twitter_integration", "ton_quest"];

/** Every key a quest response hands back a joinable link under. */
const QUEST_LINK_KEYS = [
  "join_link",
  "follow_link_default",
  "follow_link_ios",
  "game_link",
  "doggame_link",
];

export default class TonoreumFarmer extends BaseFarmer {
  static id = "tonoreum";
  static title = "Tonoreum";
  static emoji = "⛏️";
  static host = "app.tonoreum.com";
  static domains = ["app.tonoreum.com"];
  static telegramLink =
    "https://t.me/Tonoreum_Bot/TorFreeMiner?startapp=875ae44b-90fc-4a64-becd-77e199463fcb";
  static path = "/";
  static referrerMode = "random";
  static apiDelay = 500;
  static singleton = true;
  static rating = 5;

  static auto = {
    id: "tonoreum-auto",
    title: "Tonoreum Auto",
    token: "TOR",
    jettonAddress: "EQCRhkvxiW9Ml44FLTxGePs1xMqBAf-axakBgCEfI8YwHTWW",
    storagePrefix: "tonoreum-auto",
    minWithdrawal: MINIMUM_WITHDRAWAL,
  };

  /** Ads to credit per run, capped by whatever the day has left. */
  static adsPerRun = ADS_DAILY_LIMIT;

  /* --------------------------------------------------------------------- */
  /* Transport                                                             */
  /*                                                                       */
  /* The API carries no token of any kind. Every call is keyed on the       */
  /* Telegram user id with `initData` echoed back, and the field holding it */
  /* is named differently per endpoint — `init_data` on some, `initData` on */
  /* others. The two shapes are spelled out below rather than normalized,   */
  /* because the server reads whichever one its own page sends.             */
  /* --------------------------------------------------------------------- */

  /** Post to an endpoint */
  post(path, payload = {}) {
    return this.api.post(`${API_URL}/${path}`, payload).then((res) => res.data);
  }

  /** `{ user_id, init_data, hash }` — the majority shape */
  authPayload(extra = {}) {
    return {
      ["user_id"]: this.getUserId(),
      ["init_data"]: this.getInitData(),
      hash: this.getInitDataHash(),
      ...extra,
    };
  }

  /** `{ user_id, initData, hash }` — the minority shape */
  camelAuthPayload(extra = {}) {
    return {
      ["user_id"]: this.getUserId(),
      initData: this.getInitData(),
      hash: this.getInitDataHash(),
      ...extra,
    };
  }

  /* --------------------------------------------------------------------- */
  /* API wrappers                                                          */
  /* --------------------------------------------------------------------- */

  /** Create the account row — a no-op for accounts already on file */
  registerUser() {
    return this.post(REGISTER_PATH, {
      ["user_id"]: this.getUserId()?.toString(),
      ["init_data"]: this.getInitData(),
      hash: this.getInitDataHash(),
      ["start_param"]: this.getStartParam() || null,
    });
  }

  /** The single state call: power, balances, level, timers */
  getMiningPower() {
    return this.post(
      "get_mining_power",
      this.camelAuthPayload({ ["start_param"]: this.getStartParam() }),
    );
  }

  /** Start a mining cycle */
  activateMining() {
    return this.post("activate_mining", this.authPayload());
  }

  /** Ads credited today, and any checkpoint blocking the next one */
  getAdQuestStatus() {
    return this.post("get_ad_quest_status", this.authPayload());
  }

  /** Credit one watched ad */
  completeAdQuest() {
    return this.post(COMPLETE_AD_PATH, this.authPayload());
  }

  /** Clear the checkpoint the ad quest raises every so often */
  confirmAdCheckpoint(checkpoint) {
    return this.post(
      "confirm_ad_checkpoint",
      this.authPayload({
        ["checkpoint_id"]: checkpoint.checkpointId,
        ["checkpoint_token"]: checkpoint.token,
        ["ad_count"]: checkpoint.adCount,
        ["expires_at"]: checkpoint.expiresAt,
      }),
    );
  }

  /** The quest list — the drop's only GET */
  getQuests() {
    return this.api
      .get(`${API_URL}/getQuests`, {
        params: { ["user_id"]: this.getUserId() },
      })
      .then((res) => res.data);
  }

  /** Run a quest, or claim it once its requirement is met */
  runQuest(questId) {
    return this.post(
      "runQuest",
      this.camelAuthPayload({ questid: questId, twitterLink: null }),
    );
  }

  /** Claim the tap-ore reward */
  claimOreReward() {
    return this.post("claim_reward", this.authPayload());
  }

  /** Unlock whatever achievements the account has earned */
  checkUserAchievements() {
    return this.post("check_user_achievements", this.authPayload());
  }

  /** This account's referral link and its referral counts */
  getReferral() {
    return this.post("get_referral", { ["user_id"]: this.getUserId() });
  }

  /** Lifetime ads watched, which is what free withdrawals are bought with */
  getDailyProgress() {
    return this.post("get_daily_progress", { ["user_id"]: this.getUserId() });
  }

  /** Link a TON wallet address to this account */
  updateWalletAddress(address) {
    return this.post("upa", this.authPayload({ ["wallet_address"]: address }));
  }

  /** Request a free TOR withdrawal */
  requestWithdrawal({ amount, payload, address }) {
    return this.post(
      "withdraw_tor",
      this.camelAuthPayload({
        unencodedPayload: payload,
        amount,
        ["wallet_address"]: address,
      }),
    );
  }

  /** TON won from tap-ore, held off-balance by the drop */
  checkTonBalance() {
    return this.post("check_tonbalance", { ["user_id"]: this.getUserId() });
  }

  /** Sweep the TON prize balance to a wallet */
  requestTonWithdrawal(address) {
    return this.post(
      "withdraw_ton",
      this.authPayload({ ["ton_wallet"]: address }),
    );
  }

  /* --------------------------------------------------------------------- */
  /* Auth                                                                  */
  /* --------------------------------------------------------------------- */

  /** Get Auth */
  async fetchAuth() {
    return this.login();
  }

  /** Register the account if it is new, then load its state */
  async login() {
    const registration = await this.registerUser();
    this.debugger.log("Registration:", registration);

    await this.refreshUserData();

    return this.user_data;
  }

  /**
   * Re-read the account state.
   *
   * A missing `torpower` is how the drop reports an account it will not serve
   * — the page treats the same case as a hard error.
   */
  async refreshUserData() {
    const data = await this.getMiningPower();
    this.debugger.log("Mining power:", data);

    if (!data || data.torpower === undefined || data.torpower === null) {
      throw new Error(data?.msg || data?.error || "Failed to load account");
    }

    this.user_data = data;
    return this.user_data;
  }

  /** Get User Details */
  getUserDetails() {
    return this.user_data;
  }

  /** Get Referral Link */
  async getReferralLink() {
    const result = await this.getReferral();
    return result?.["ref_link"] || this.telegramLink;
  }

  /* --------------------------------------------------------------------- */
  /* Wallet                                                                */
  /*                                                                       */
  /* The drop stores the address TON Connect hands its page — the           */
  /* user-friendly non-bounceable form — and no endpoint reads it back, so  */
  /* the farmer keeps its own copy. Withdrawals name the destination in the */
  /* request, so a run that has forgotten the address cannot withdraw.      */
  /* --------------------------------------------------------------------- */

  /** The `UQ...` form the drop's own page would have sent */
  normalizeAddress(address) {
    return Address.parse(address).toString({ bounceable: false });
  }

  /**
   * Link a wallet and remember it for later runs.
   *
   * `upa` is the drop's own re-bind path — its page calls it on every load,
   * with no prior check. `check_wallet` is deliberately not used as a guard:
   * it reports the wallet already on file for *this* account, so treating a
   * mismatch as a conflict would reject every legitimate wallet change.
   */
  async connectWallet(address) {
    const normalized = this.normalizeAddress(address);

    const result = await this.updateWalletAddress(normalized);
    this.debugger.log("Update wallet address:", result);

    if (result?.success === false) {
      throw new Error(result.error || "Failed to link wallet");
    }

    await this.storeWalletAddress(normalized);

    return normalized;
  }

  /** Persist the linked address, in the environments that offer storage */
  async storeWalletAddress(address) {
    this.walletAddress = address;

    try {
      await this.storage?.set("wallet", { address });
    } catch (error) {
      this.debugger.log("Failed to store wallet:", error.message);
    }
  }

  /** The linked address, from this run or a previous one */
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
  /* Mining                                                                */
  /*                                                                       */
  /* TOR accrues server-side from the account's share of the network's      */
  /* torpower, but only while a cycle is running — so the one thing a run   */
  /* must not miss is re-arming it.                                         */
  /* --------------------------------------------------------------------- */

  /** Format a duration for the log */
  formatDuration(ms) {
    return this.utils.dateFns.formatDistanceStrict(0, Math.max(0, ms));
  }

  /**
   * Hours left before mining can be re-armed.
   *
   * The server reports this directly, but only while a cycle is young; once it
   * lapses the field comes back null. `last_mining_activation` is the fallback,
   * for the case where the server has stopped counting but the page would
   * still be inside the window.
   */
  getReactivationHoursRemaining() {
    const reported = this.user_data?.["time_until_reactivation"];

    if (reported !== null && reported !== undefined) {
      return Math.max(0, Number(reported));
    }

    const lastActivation = Date.parse(
      this.user_data?.["last_mining_activation"] || "",
    );

    if (!lastActivation) return 0;

    const elapsedHours = (Date.now() - lastActivation) / 3600000;
    return Math.max(0, REACTIVATION_HOURS - elapsedHours);
  }

  /** Re-arm mining when the window is open */
  async startMining() {
    const remaining = this.getReactivationHoursRemaining();

    if (remaining > 0) {
      this.logger.info(
        `Mining active - can be re-activated in ${this.formatDuration(remaining * 3600000)}.`,
      );
      return;
    }

    const result = await this.activateMining();
    this.debugger.log("Activate mining:", result);

    if (!result?.success) {
      const reason = result?.["time_remaining"]
        ? `${result.error} - ${result["time_remaining"]}`
        : result?.error || "Failed to activate mining";

      this.logger.warn("Mining not activated:", reason);
      return;
    }

    this.logger.success("Mining activated!");
    await this.refreshUserData();
  }

  /* --------------------------------------------------------------------- */
  /* Ads                                                                   */
  /*                                                                       */
  /* Worth the most of anything a run can do: each ad is +15 torpower and   */
  /* one step towards the 1000 that buy a free withdrawal, and the reward   */
  /* is credited with no proof that anything was watched.                   */
  /* --------------------------------------------------------------------- */

  /** Watch the day's remaining ads */
  async watchAds() {
    const status = await this.getAdQuestStatus();
    this.debugger.log("Ad quest status:", status);

    let watchedToday = this.readAdCount(status, 0);
    const checkpoint = status?.["pending_checkpoint"] || null;

    /* A checkpoint left over from a previous run blocks every further ad */
    if (checkpoint) {
      const cleared = await this.clearCheckpoint(checkpoint);
      if (cleared === null) return;

      watchedToday = cleared;
    }

    const limit = Math.min(
      this.constructor.adsPerRun,
      ADS_DAILY_LIMIT - watchedToday,
    );

    if (limit <= 0) {
      this.logger.info(
        `Daily ad limit reached - ${watchedToday}/${ADS_DAILY_LIMIT} watched today.`,
      );
      return;
    }

    let watched = 0;

    for (let index = 0; index < limit; index++) {
      if (this.signal.aborted) break;

      const result = await this.completeAdQuest().catch((error) => {
        this.logger.warn(
          "Ad not credited:",
          error.response?.data?.error || error.message,
        );
        return null;
      });

      if (!result) break;

      this.debugger.log("Ad reward:", result);

      /**
       * The server interrupts the run every so often to confirm a token it
       * handed out. Clearing it credits the ad, so this is not a failure.
       */
      if (result["checkpointRequired"]) {
        const cleared = await this.clearCheckpoint(
          result["pending_checkpoint"],
        );
        if (cleared === null) break;

        watchedToday = cleared;
      } else {
        watchedToday = this.readAdCount(result, watchedToday + 1);
      }

      watched++;

      if (result["updated_torpower"]) {
        this.user_data.torpower = result["updated_torpower"];
      }

      await this.utils.delayForSeconds(15, { signal: this.signal });
    }

    this.logger.success(
      `Watched ${watched} ad(s) (+${watched * AD_REWARD_TORPOWER} torpower)` +
        ` - ${watchedToday}/${ADS_DAILY_LIMIT} today.`,
    );
  }

  /**
   * The ad counter an envelope reports.
   *
   * Zero is a real count on the first ad of the day, so it cannot be collapsed
   * into the fallback the way a truthiness check would.
   */
  readAdCount(payload, fallback) {
    const reported = payload?.["current_count"];
    if (reported === null || reported === undefined) return fallback;

    const count = Number(reported);
    return Number.isFinite(count) ? count : fallback;
  }

  /**
   * Confirm a pending ad checkpoint.
   *
   * @returns {Promise<number|null>} the credited count, or null when it could
   * not be cleared — in which case no further ad will be credited either.
   */
  async clearCheckpoint(checkpoint) {
    if (!checkpoint) return null;

    this.logger.info("Confirming ad checkpoint...");

    try {
      const result = await this.confirmAdCheckpoint(checkpoint);
      this.debugger.log("Checkpoint confirmed:", result);

      if (result?.["updated_torpower"]) {
        this.user_data.torpower = result["updated_torpower"];
      }

      return this.readAdCount(result, 0);
    } catch (error) {
      this.logger.warn(
        "Failed to confirm ad checkpoint:",
        error.response?.data?.error || error.message,
      );
      return null;
    }
  }

  /* --------------------------------------------------------------------- */
  /* Quests                                                                */
  /* --------------------------------------------------------------------- */

  /**
   * Run the quests this account has left.
   *
   * A quest is answered in one of three ways: it completes outright, it hands
   * back a link the account has to follow first, or it needs something a
   * headless run has no business faking.
   */
  async completeQuests() {
    const payload = await this.getQuests();
    this.debugger.log("Quests:", payload);

    const pending = (payload?.quests || []).filter(
      (quest) =>
        !quest.done &&
        quest.status === 1 &&
        quest.questid !== AD_QUEST_ID &&
        !SKIPPED_QUEST_ACTIONS.includes(quest.action),
    );

    if (!pending.length) {
      this.logger.info("No quests to complete.");
      return;
    }

    for (const quest of pending) {
      if (this.signal.aborted) break;
      await this.completeQuest(quest);
    }
  }

  /** Run one quest, following its link once if it asks for one */
  async completeQuest(quest) {
    const label = quest.name || quest.title || `Quest ${quest.questid}`;

    try {
      let result = await this.runQuest(quest.questid);
      this.debugger.log(`Quest result (${quest.questid}):`, result);

      const link = this.findQuestLink(result);

      /**
       * The link means the requirement is not met yet. Joining it is the only
       * honest way to meet it, and it is a no-op when no Telegram client is
       * attached — so the retry is skipped rather than spent.
       */
      if (link && !result?.completed) {
        const joined = await this.tryToJoinTelegramLink(link);

        if (!joined) {
          this.logger.info(`Skipped quest: ${label} (cannot follow ${link})`);
          return;
        }

        result = await this.runQuest(quest.questid);
        this.debugger.log(`Quest retry (${quest.questid}):`, result);
      }

      if (result?.completed) {
        this.logger.success(`Completed quest: ${label} (+${quest.reward})`);
      } else {
        this.logger.info(`Quest not credited: ${label}`);
      }
    } catch (error) {
      this.logger.warn(
        `Quest "${label}" failed:`,
        error.response?.data?.error || error.message,
      );
    }

    await this.utils.delayForSeconds(15, { signal: this.signal });
  }

  /** The first joinable link a quest response carries, if any */
  findQuestLink(result) {
    if (!result) return null;

    for (const key of QUEST_LINK_KEYS) {
      if (result[key]) return result[key];
    }

    return null;
  }

  /* --------------------------------------------------------------------- */
  /* Tap Ore                                                               */
  /* --------------------------------------------------------------------- */

  /** Milliseconds left before the ore recharges, or 0 when it is ready */
  getOreCooldownRemaining() {
    const last = Date.parse(this.user_data?.["last_ore_timestamp"] || "");
    if (!last) return 0;
    return Math.max(0, ORE_COOLDOWN_MS - (Date.now() - last));
  }

  /**
   * Break the ore.
   *
   * The page makes the user land twenty taps first, but the reward is decided
   * server-side on a single call — the taps are decoration.
   */
  async breakOre() {
    const remaining = this.getOreCooldownRemaining();

    if (remaining > 0) {
      this.logger.info(
        `Ore recharging - ready in ${this.formatDuration(remaining)}.`,
      );
      return;
    }

    const result = await this.claimOreReward();
    this.debugger.log("Ore reward:", result);

    if (!result?.success) {
      this.logger.warn("Ore not broken:", result?.error || "Unknown reason");
      return;
    }

    this.logger.success(
      `Broke the ore: ${result["reward_type"]} (${result["reward_value"] ?? "-"})`,
    );

    await this.refreshUserData();
  }

  /* --------------------------------------------------------------------- */
  /* Achievements                                                          */
  /* --------------------------------------------------------------------- */

  /** Unlock whatever the account has earned since the last run */
  async claimAchievements() {
    const result = await this.checkUserAchievements();
    this.debugger.log("Achievements:", result);

    const unlocked = result?.["achievements_unlocked"] || [];

    if (!unlocked.length) {
      this.logger.info("No new achievements.");
      return;
    }

    const power = unlocked.reduce(
      (total, achievement) => total + Number(achievement.power || 0),
      0,
    );

    for (const achievement of unlocked) {
      this.logger.success(
        `Achievement: ${achievement.name} (+${achievement.power} torpower)`,
      );
    }

    this.logger.keyValue("Torpower gained", power, {
      valueStyle: this.logger.c.greenBright,
    });

    if (result?.torpower) {
      this.user_data.torpower = result.torpower;
    }
  }

  /* --------------------------------------------------------------------- */
  /* Referrals                                                             */
  /* --------------------------------------------------------------------- */

  /** Log the referral summary */
  async logReferrals() {
    const result = await this.getReferral();
    this.debugger.log("Referral:", result);

    if (!result?.success) {
      this.logger.warn("Referral data unavailable.");
      return;
    }

    this.logger.keyValue("Referral Link", result["ref_link"], {
      valueStyle: this.logger.c.whiteBright,
    });
    this.logger.keyValue("Active Referrals", result["active_referrals"] ?? 0, {
      valueStyle: this.logger.c.greenBright,
    });
    this.logger.keyValue("Pending Referrals", result["pending_referrals"] ?? 0);
  }

  /* --------------------------------------------------------------------- */
  /* Withdrawal                                                            */
  /*                                                                       */
  /* The drop sells withdrawals two ways: 1000 watched ads buy one, or a    */
  /* 0.15 TON on-chain payment buys one. Only the free path is implemented  */
  /* — the paid one spends real TON per claim.                             */
  /* --------------------------------------------------------------------- */

  /** The spendable balance, as opposed to the lifetime-mined `balance` */
  getBalance() {
    return new Decimal(this.user_data?.["availableBalance"] || 0);
  }

  /** Free withdrawals earned, one per 1000 lifetime ads */
  async getFreeWithdrawals() {
    const progress = await this.getDailyProgress();
    this.debugger.log("Daily progress:", progress);

    if (progress?.pending) {
      this.adsWatchedTotal = null;
      return null;
    }

    this.adsWatchedTotal = Number(progress?.["total_count"]) || 0;
    return Math.floor(this.adsWatchedTotal / FREE_WITHDRAWAL_ADS);
  }

  /**
   * Everything the drop requires beyond the amount itself, as readable
   * reasons. The server re-checks all of it — this only avoids burning a
   * request that is certain to be rejected.
   */
  async getWithdrawalBlockers() {
    const blockers = [];

    const address = await this.getWalletAddress();
    const free = await this.getFreeWithdrawals();

    if (!address) {
      blockers.push("No wallet linked");
    }

    if (free === null) {
      blockers.push("A withdrawal is already pending");
    } else if (free < 1) {
      blockers.push(
        `Ads watched ${this.adsWatchedTotal}/${FREE_WITHDRAWAL_ADS}` +
          " towards a free withdrawal",
      );
    }

    return blockers;
  }

  /** Shape a request out of the balance, as ATF and SLPY do */
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

  /** The payload the drop signs its withdrawals with */
  buildWithdrawalPayload(amount) {
    return `${this.getUserId()}--${amount}--${Math.floor(Date.now() / 1000)}`;
  }

  /**
   * Place a withdrawal.
   *
   * `force` drops the safety buffer that keeps unattended runs from
   * withdrawing the moment they cross the minimum; cloud batch withdrawals
   * pass it.
   */
  async withdraw({ max, difference = 20, force = false } = {}) {
    /* The gates are all counted server-side, so decide on a fresh state */
    await this.refreshUserData();

    const blockers = await this.getWithdrawalBlockers();

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

    const address = await this.getWalletAddress();
    const amount = this.shapeAmount(balance, { max, difference });

    const result = await this.requestWithdrawal({
      amount: amount.toNumber(),
      payload: this.buildWithdrawalPayload(amount.toString()),
      address,
    }).catch((error) => error.response?.data || { error: error.message });

    this.debugger.log("Withdraw result:", result);

    if (!result?.success) {
      const message = result?.error || "Withdrawal could not be processed";
      this.logger.error("Failed to request withdrawal:", message);
      return { status: false, skipped: false, message, amount: "0" };
    }

    this.logger.success("Withdrawal requested!");
    this.logger.keyValue("Requested", amount.toString());
    this.logger.keyValue("Destination", address, {
      valueStyle: this.logger.c.whiteBright,
    });

    /**
     * Notify the admin, but only when the run was initiated by the scheduler.
     */
    if (this.scheduled) {
      await this.notifyAdmin([
        `<b>🤑 TOR Withdrawal</b>`,
        `<b>Account</b>: ${this.formatAccountLink(this.getUserId())}`,
        `<b>Initial Balance</b>: ${balance.toString()}`,
        `<b>Requested</b>: ${amount.toString()}`,
        `<b>Wallet</b>: <code>${address}</code>`,
      ]);
    }

    return {
      status: true,
      skipped: false,
      message: "Withdrawal requested!",
      amount: amount.toString(),
    };
  }

  /**
   * Sweep the TON won from tap-ore.
   *
   * Separate from the TOR balance and paid straight out to the linked wallet,
   * so there is nothing to shape or hold back.
   */
  async withdrawTonPrizes() {
    const result = await this.checkTonBalance();
    this.debugger.log("TON balance:", result);

    const balance = new Decimal(result?.tonbalance || 0);

    if (balance.lessThanOrEqualTo(0)) {
      this.logger.info("No TON prizes to withdraw.");
      return;
    }

    const address = await this.getWalletAddress();

    if (!address) {
      this.logger.warn(`Holding ${balance.toString()} TON - no wallet linked.`);
      return;
    }

    const withdrawal = await this.requestTonWithdrawal(address).catch(
      (error) => error.response?.data || { error: error.message },
    );

    this.debugger.log("TON withdrawal:", withdrawal);

    if (!withdrawal?.success) {
      this.logger.error(
        "Failed to withdraw TON:",
        withdrawal?.error || "Unknown error",
      );
      return;
    }

    this.logger.success(`Withdrew ${balance.toString()} TON to ${address}!`);

    if (this.scheduled) {
      await this.notifyAdmin([
        `<b>💎 TON Prize Withdrawal</b>`,
        `<b>Account</b>: ${this.formatAccountLink(this.getUserId())}`,
        `<b>Amount</b>: ${balance.toString()} TON`,
        `<b>Wallet</b>: <code>${address}</code>`,
      ]);
    }
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
        name: "Mining",
        list: [
          {
            id: "activate-mining",
            icon: "search",
            title: "Activate Mining",
            action: this.startMining.bind(this),
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
          {
            id: "withdraw-ton",
            icon: "withdraw",
            title: "Withdraw TON",
            action: this.withdrawTonPrizes.bind(this),
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

    const normalized = await this.connectWallet(address);

    this.logger.success("Wallet linked!");
    this.logger.keyValue("Address", normalized, {
      valueStyle: this.logger.c.whiteBright,
    });
  }

  /** Request a withdrawal, prompting for the amount */
  async withdrawInteractive() {
    await this.refreshUserData();

    const blockers = await this.getWithdrawalBlockers();

    if (blockers.length) {
      this.logger.warn("Withdrawal unavailable:");
      blockers.forEach((blocker) => this.logger.warn(`- ${blocker}`));
      return;
    }

    const balance = this.getBalance();
    const minimum = this.getMinimumWithdrawal();

    this.logger.keyValue("Balance", balance.toString());
    this.logger.keyValue("Minimum", minimum);

    const input = await this.promptInput("Enter amount of TOR to withdraw:");
    const amount = parseFloat((input || "").trim());

    if (!amount) {
      this.logger.warn("No amount provided.");
      return;
    }

    if (balance.lessThan(amount)) {
      this.logger.warn(`Balance is only ${balance.toString()} TOR.`);
      return;
    }

    if (amount < minimum) {
      this.logger.warn(`Minimum withdrawal is ${minimum} TOR.`);
      return;
    }

    const address = await this.getWalletAddress();

    const result = await this.requestWithdrawal({
      amount,
      payload: this.buildWithdrawalPayload(amount),
      address,
    }).catch((error) => error.response?.data || { error: error.message });

    if (result?.success) {
      this.logger.success(`Requested ${amount} TOR to ${address}!`);
    } else {
      this.logger.error(
        "Failed to request withdrawal:",
        result?.error || "Unknown error",
      );
    }
  }

  /* --------------------------------------------------------------------- */
  /* Process                                                               */
  /* --------------------------------------------------------------------- */

  async process() {
    await this.login();

    await this.logUserInfo();
    await this.executeTask("Mining", () => this.startMining());
    await this.executeTask("Ads", () => this.watchAds());
    await this.executeTask("Quests", () => this.completeQuests());
    await this.executeTask("Tap Ore", () => this.breakOre());
    await this.executeTask("Achievements", () => this.claimAchievements());
    await this.executeTask("Friends", () => this.logReferrals());
    await this.executeTask("Withdraw", () => this.withdraw());
    await this.executeTask("TON Prizes", () => this.withdrawTonPrizes());
  }

  /** Log the current account state */
  async logUserInfo() {
    const user = this.user_data;
    const reactivation = this.getReactivationHoursRemaining();
    const ore = this.getOreCooldownRemaining();
    const address = await this.getWalletAddress();

    this.logger.newline();
    this.logCurrentUser();

    this.logger.keyValue("Balance", user["availableBalance"]);
    this.logger.keyValue("Total Mined", user.balance);
    this.logger.keyValue("Torpower", user.torpower, {
      valueStyle: this.logger.c.greenBright,
    });
    this.logger.keyValue("Booster", `x${user["active_booster"] ?? 1}`);
    this.logger.keyValue(
      "Level",
      `${user["user_level"]}${user.title ? ` (${user.title})` : ""}`,
    );
    this.logger.keyValue("Torpower to next level", user["TorGainForNextLevel"]);

    this.logger.newline();
    const mining = Boolean(user["mining_active"]);

    this.logger.keyValue("Mining Active", mining ? "Yes" : "No", {
      valueStyle: mining ? this.logger.c.greenBright : this.logger.c.redBright,
    });
    this.logger.keyValue(
      "Re-activation",
      reactivation > 0
        ? this.formatDuration(reactivation * 3600000)
        : "Available now",
    );
    this.logger.keyValue(
      "Tap Ore",
      ore > 0 ? this.formatDuration(ore) : "Available now",
    );

    if (address) {
      this.logger.keyValue("Wallet", address, {
        valueStyle: this.logger.c.whiteBright,
      });
    }
  }

  /* --------------------------------------------------------------------- */
  /* Auto adapter                                                          */
  /* --------------------------------------------------------------------- */

  /**
   * Link a TON wallet.
   *
   * Only the address is needed — no key and no TON Connect proof — and the
   * drop never reads it back, so the farmer keeps its own copy for the
   * withdrawal that follows in a later run.
   */
  async connectAutoWallet({ address }) {
    try {
      await this.connectWallet(address);
      await this.refreshUserData();
      await this.readOnChainHolding();

      return { status: true, summary: this.getAutoSummary() };
    } catch (error) {
      return {
        status: false,
        message:
          error.response?.data?.error || error.message || "Unknown error",
      };
    }
  }

  /** Re-arm mining and break the ore so the summary reflects a current run */
  async refreshAutoState() {
    await this.startMining();
    await this.breakOre();
    await this.refreshUserData();
    await this.readOnChainHolding();
  }

  /**
   * The linked wallet's on-chain TOR.
   *
   * The drop publishes no holding of its own — mining is driven purely by
   * torpower — so this is read from the chain. It is cached because
   * `getAutoSummary` is called synchronously by the orchestrator, and it is
   * best-effort: a TonAPI hiccup must not fail a withdrawal batch.
   */
  async readOnChainHolding() {
    const address = await this.getWalletAddress();

    if (!address) {
      this.autoHolding = 0;
      return this.autoHolding;
    }

    try {
      const balance = await getJettonBalance(
        this.constructor.auto.jettonAddress,
        address,
      );
      this.autoHolding = balance.toNumber();
    } catch (error) {
      this.debugger.log("Failed to read on-chain holding:", error.message);
      this.autoHolding = 0;
    }

    return this.autoHolding;
  }

  /** Normalized account snapshot */
  getAutoSummary() {
    const user = this.user_data || {};

    return {
      level: user["user_level"] ?? 0,
      holding: this.autoHolding ?? 0,
      balance: user["availableBalance"] ?? 0,
      minWithdrawal: this.getMinimumWithdrawal(),
      wallet: this.walletAddress ? { address: this.walletAddress } : null,
      banned: false,
      banReason: null,

      /* Tonoreum publishes no risk data — the empty shape is what BaseAuto expects */
      risk: { score: null, updatedAt: null, flags: [] },
    };
  }
}
