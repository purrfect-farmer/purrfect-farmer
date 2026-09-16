import AdsGramClient from "../lib/AdsGramClient.js";
import BaseFarmer from "../lib/BaseFarmer.js";
import Decimal from "decimal.js";
import {
  getJettonBalance,
  getWalletAddressFromMnemonic,
} from "../lib/auto/wallet.js";

/** The drop's backend, which the mini app talks to for everything */
const API_URL = "https://mrg.up.railway.app/api";

/** Mine Rare Gram, the jetton whose holding sets the miner level */
const MRG_JETTON_ADDRESS = "EQDj-zlSvj4Au154XjsU7ATzt13p8JjYEs0weVv1rVbCJSn0";

/** The drop's only rewarded AdsGram block, exposed as a recurring task */
const ADSGRAM_TASK_ID = "task-47913";

/** How long the page leaves a task open before it lets the claim through */
const TASK_DWELL_SECONDS = 15;

/** The windows the backend enforces per task type, in milliseconds */
const TASK_COOLDOWNS = {
  recurring_1h: 60 * 60 * 1000,
  recurring_3h: 3 * 60 * 60 * 1000,
};

/** AdsGram settles the ad server to server, so the claim can arrive early */
const AD_CLAIM_ATTEMPTS = 3;
const AD_CLAIM_INTERVAL_SECONDS = 10;

/** Below this the drop's own claim button stays disabled */
const MINIMUM_CLAIMABLE_MINING = 0.0001;

/** The highest level the drop sells */
const MAXIMUM_LEVEL = 1000;

/** Holdings for the levels the drop prices by hand */
const EARLY_LEVEL_HOLDINGS = {
  2: 100,
  3: 102,
  4: 105,
  5: 107,
  6: 110,
  7: 113,
  8: 116,
  9: 119,
  10: 122,
};

/** The curve the drop prices every level above 10 with */
const LEVEL_HOLDING_SEGMENTS = [
  {
    maxLevel: 203,
    startLevel: 10,
    span: 193,
    startHolding: 122,
    endHolding: 10233,
    linearRate: 3.8,
    exponent: 2.3,
  },
  {
    maxLevel: 450,
    startLevel: 203,
    span: 247,
    startHolding: 10233,
    endHolding: 1162790,
    exponent: 2.2,
  },
  {
    maxLevel: 650,
    startLevel: 450,
    span: 200,
    startHolding: 1162790,
    endHolding: 27131780,
    exponent: 2.4,
  },
  {
    maxLevel: 850,
    startLevel: 650,
    span: 200,
    startHolding: 27131780,
    endHolding: 348837200,
    exponent: 2.5,
  },
  {
    maxLevel: MAXIMUM_LEVEL,
    startLevel: 850,
    span: 150,
    startHolding: 348837200,
    endHolding: 3875968992,
    exponent: 2.6,
  },
];

/** Mining speed, in TH/s, at both ends of the drop's speed curve */
const BASE_SPEED_THS = 0.2;
const SPEED_STEP_THS = 0.03643564356435643;
const MID_SPEED_LEVEL = 203;
const MID_SPEED_THS = 7.56;
const MAXIMUM_SPEED_THS = 5000;

/** MRG mined per day, per TH/s */
const DAILY_OUTPUT_PER_THS = 25;

/** What level 1 mines per day, before any holding */
const LEVEL_ONE_DAILY_OUTPUT = 5;

/** The drop's withdrawal rules */
const MINIMUM_WITHDRAWAL = 500;
const WITHDRAWAL_FEE = 70;
const STANDARD_WITHDRAWAL_LIMIT = 1000;
const PRIVILEGED_WITHDRAWAL_LIMIT = 500000;
const PRIVILEGED_HOLDING = 1000;

/**
 * Safety margin above the drop's minimum required by unattended runs, so a
 * scheduled farmer does not withdraw the instant it crosses the minimum.
 */
const WITHDRAWAL_BUFFER = 200;

/** A payout address the drop will accept */
const TON_ADDRESS_PATTERN = /^(EQ|UQ)[A-Za-z0-9_-]{46}$/;

export default class MRGFarmer extends BaseFarmer {
  static id = "mrg";
  static title = "MRG";
  static emoji = "⛏️";
  static host = "app.mrgtoken.xyz";
  static domains = ["app.mrgtoken.xyz", "mrg.up.railway.app", "api.adsgram.ai"];
  static telegramLink = "https://t.me/mrgminerbot/app?startapp=ref_T90OGL9E";
  static path = "/";
  static interval = "0 * * * *";
  static referrerMode = "random";
  static apiDelay = 500;
  static rating = 5;

  static auto = {
    id: "mrg-auto",
    title: "MRG Auto",
    token: "MRG",
    jettonAddress: MRG_JETTON_ADDRESS,
    storagePrefix: "mrg-auto",
    minWithdrawal: MINIMUM_WITHDRAWAL,
  };

  /** AdsGram, built once per run */
  get adsgram() {
    return (this._adsgram ||= new AdsGramClient(this));
  }

  /* --------------------------------------------------------------------- */
  /* Transport                                                             */
  /*                                                                       */
  /* Every endpoint is a POST carrying `initData` in the body - there is no */
  /* token and no auth header - so the interceptor adds it to each call the */
  /* drop's own API receives, and leaves third parties like AdsGram alone.  */
  /* --------------------------------------------------------------------- */

  configureApi() {
    const initDataInterceptor = this.api.interceptors.request.use((config) => {
      if (String(config.url || "").startsWith(API_URL)) {
        config.data = {
          ...config.data,
          initData: this.getInitData(),
        };
      }

      return config;
    });

    return () => {
      this.api.interceptors.request.eject(initDataInterceptor);
    };
  }

  /**
   * Call the drop's API.
   *
   * A refused action answers `400` with the reason in the body, so a 400 is
   * read as a payload rather than thrown - every caller decides for itself
   * whether `success: false` is a failure or a skip.
   */
  postToApi(path, data = {}) {
    return this.api
      .post(`${API_URL}${path}`, data, {
        signal: this.signal,
        validateStatus: (status) =>
          status === 400 || (status >= 200 && status < 300),
      })
      .then((response) => response.data);
  }

  /* --------------------------------------------------------------------- */
  /* Endpoints                                                             */
  /* --------------------------------------------------------------------- */

  /** Sign in, creating the account on first contact */
  verifyAccount() {
    return this.postToApi("/auth/verify");
  }

  /** The full account state: user, level, tasks, transactions */
  fetchAccount() {
    return this.postToApi("/user/me");
  }

  /** The squad and its commission counters */
  fetchFriends() {
    return this.postToApi("/user/friends");
  }

  /** Bind a wallet and report the holding read from the chain */
  connectWallet(address, balance) {
    return this.postToApi("/user/connect-wallet", { address, balance });
  }

  /** Unbind the wallet the account is on */
  disconnectWallet() {
    return this.postToApi("/user/disconnect-wallet");
  }

  /** Claim everything mined since the last sync */
  claimMining() {
    return this.postToApi("/user/claim-mining");
  }

  /** Claim one task */
  claimTask(taskId) {
    return this.postToApi("/user/claim-task", { taskId });
  }

  /** Claim the one-time bonus earned by qualified referrals */
  claimOneTimeBonus() {
    return this.postToApi("/user/claim-one-time-bonus");
  }

  /** Claim the commission the squad has mined */
  claimTeamCommission() {
    return this.postToApi("/user/claim-commission");
  }

  /** Unlock a level, which the backend grants against the wallet holding */
  unlockLevel(level) {
    return this.postToApi("/user/unlock-level", { level });
  }

  /** Request a payout to the connected wallet */
  requestWithdrawal(amount, destinationAddress) {
    return this.postToApi("/user/withdraw", {
      amount: Number(amount),
      destinationAddress,
    });
  }

  /* --------------------------------------------------------------------- */
  /* Session                                                               */
  /* --------------------------------------------------------------------- */

  /** Get Auth */
  fetchAuth() {
    return this.verifyAccount();
  }

  /** Get Meta */
  fetchMeta() {
    return this.loadAccount();
  }

  /** Get Auth Headers */
  getAuthHeaders(data) {
    return {};
  }

  /** Sign in and read the account */
  async login() {
    await this.verifyAccount();
    return this.loadAccount();
  }

  /** Re-read the account into the farmer's state */
  async loadAccount() {
    this.account_data = await this.fetchAccount();
    return this.account_data;
  }

  /** Read the account once, for entry points that run without a full pass */
  async ensureAccountLoaded() {
    if (!this.account_data) {
      await this.login();
    }

    return this.account_data;
  }

  /** Load data */
  async load() {
    this.taskClaims = (await this.storage?.get("taskClaims")) || {};
    this.connectedWalletVersion = await this.storage?.get("walletVersion");
  }

  /** Persist data */
  async persist() {
    await this.storage?.set("taskClaims", this.taskClaims || {});
  }

  /** Get User Details */
  getAccountDetails() {
    return this.account_data.user;
  }

  /** Get Referral Link */
  getReferralLink() {
    const referralCode = this.account_data?.user?.["referralCode"];

    return referralCode
      ? `https://t.me/mrgminerbot/app?startapp=ref_${referralCode}`
      : this.constructor.telegramLink;
  }

  /** Get Referrals Count */
  async getReferralsCount() {
    const friends = await this.fetchFriends();

    return friends?.["teamStats"]?.["totalFriends"] || 0;
  }

  /* --------------------------------------------------------------------- */
  /* Process                                                               */
  /* --------------------------------------------------------------------- */

  /** Process Farmer */
  async process() {
    await this.login();

    await this.logAccountInfo();
    await this.executeTask("Wallet", () => this.syncConnectedWallet());
    await this.executeTask("Level", () => this.unlockAffordableLevel());
    await this.executeTask("Mining", () => this.claimPendingMining());
    await this.executeTask("Tasks", () => this.completeTasks());
    await this.executeTask("Ads", () => this.watchAdTask());
    await this.executeTask("Squad", () => this.claimSquadRewards());
    await this.executeTask("Withdraw", () => this.withdraw());
    await this.storeAutoSnapshot();
  }

  /** Log what the account looks like before the pass starts */
  async logAccountInfo() {
    const user = this.getAccountDetails();
    const activeLevel = this.getActiveLevel();

    this.logger.newline();
    this.logCurrentUser();
    this.logger.keyValue("Balance", this.formatAmount(user["inAppBalance"]));
    this.logger.keyValue(
      "Pending Mining",
      this.formatAmount(user["unclaimedMiningBalance"]),
    );
    this.logger.keyValue("Level", activeLevel);
    this.logger.keyValue(
      "Speed",
      `${this.getSpeedForLevel(activeLevel)} TH/s`,
      { valueStyle: this.logger.c.greenBright },
    );
    this.logger.keyValue(
      "Daily Mining",
      this.formatAmount(this.getDailyOutputForLevel(activeLevel)),
      { valueStyle: this.logger.c.greenBright },
    );
    this.logger.keyValue(
      "Lifetime Mined",
      this.formatAmount(user["totalMinedLifetime"]),
    );

    this.logger.newline();
    this.logger.keyValue(
      "Wallet",
      user["tonWalletAddress"] || "Not connected",
      {
        valueStyle: user["tonWalletAddress"]
          ? this.logger.c.greenBright
          : this.logger.c.yellowBright,
      },
    );
    this.logger.keyValue(
      "Holding",
      this.formatAmount(user["tonWalletBalance"]),
    );
    this.logger.keyValue(
      "Verified",
      this.isAccountVerified(user) ? "Yes" : "No",
      {
        valueStyle: this.isAccountVerified(user)
          ? this.logger.c.greenBright
          : this.logger.c.yellowBright,
      },
    );

    if (this.isAccountBanned(user)) {
      this.logger.keyValue("Banned", user["banReason"] || "Yes", {
        valueStyle: this.logger.c.redBright,
      });
    }

    const pendingWithdrawals = this.getPendingWithdrawals();

    this.logger.keyValue("Pending Withdrawals", pendingWithdrawals.length, {
      valueStyle: pendingWithdrawals.length
        ? this.logger.c.yellowBright
        : this.logger.c.greenBright,
    });
  }

  /* --------------------------------------------------------------------- */
  /* Wallet                                                                */
  /*                                                                       */
  /* The drop binds an address without a proof, and takes the holding from  */
  /* whatever the page reports, so re-sending the connect call is how both  */
  /* the binding and the holding are refreshed.                             */
  /* --------------------------------------------------------------------- */

  /** The address the drop currently has the account on */
  getConnectedWalletAddress() {
    return this.account_data?.user?.["tonWalletAddress"] || null;
  }

  /** The holding the drop credits the account with */
  getWalletHolding() {
    return new Decimal(this.account_data?.user?.["tonWalletBalance"] || 0);
  }

  /** Re-read the connected wallet on-chain and send it to the drop */
  async syncConnectedWallet() {
    const address = this.getConnectedWalletAddress();

    if (!address) {
      this.logger.warn(
        "No wallet connected. Use the Connect Wallet tool to bind one.",
      );
      return { status: false, message: "No wallet connected" };
    }

    return this.connectWalletAddress(address);
  }

  /** Read an address on-chain and bind it to the account */
  async connectWalletAddress(address) {
    const holding = await this.readOnChainHolding(address);

    this.logger.info(
      `Syncing ${address} at ${this.formatAmount(holding)} MRG...`,
    );

    const result = await this.connectWallet(address, holding.toNumber());

    if (!result?.["success"]) {
      const message = result?.["error"] || "Failed to connect the wallet";

      this.logger.error(message);
      return { status: false, message };
    }

    this.account_data.user = result["user"];

    this.logger.success(
      `Wallet synced at ${this.formatAmount(this.getWalletHolding())} MRG.`,
    );

    return { status: true, message: "Wallet synced" };
  }

  /** The address' MRG balance, straight from the chain */
  async readOnChainHolding(address) {
    return getJettonBalance(MRG_JETTON_ADDRESS, address, {
      signal: this.signal,
    }).catch((error) => {
      this.logger.warn("Failed to read the holding on-chain:", error.message);
      return new Decimal(0);
    });
  }

  /** Whether an address is one the drop will accept */
  validateWalletAddress(address) {
    return TON_ADDRESS_PATTERN.test(String(address || "").trim());
  }

  /* --------------------------------------------------------------------- */
  /* Levels                                                                */
  /*                                                                       */
  /* Both curves are the ones the mini app prices its Miners Store with, so */
  /* the farmer can tell which level a holding covers without asking.       */
  /* --------------------------------------------------------------------- */

  /** The level the drop is currently mining at */
  getActiveLevel() {
    return Number(this.account_data?.["activeLevel"]) || 0;
  }

  /** The MRG holding a level is unlocked with */
  getRequiredHoldingForLevel(level) {
    if (level <= 0) return new Decimal(0);
    if (level === 1) return new Decimal(1e-6);
    if (level <= 10) return new Decimal(EARLY_LEVEL_HOLDINGS[level] || 100);
    if (level >= MAXIMUM_LEVEL) return new Decimal(3875968992);

    const segment = LEVEL_HOLDING_SEGMENTS.find(
      (item) => level <= item.maxLevel,
    );

    const progress = (level - segment.startLevel) / segment.span;
    const linear = (level - segment.startLevel) * (segment.linearRate || 0);
    const curved =
      (segment.endHolding -
        segment.startHolding -
        segment.span * (segment.linearRate || 0)) *
      Math.pow(progress, segment.exponent);

    return new Decimal(Math.round(segment.startHolding + linear + curved));
  }

  /** The mining speed, in TH/s, a level runs at */
  getSpeedForLevel(level) {
    if (level <= 0) return 0;
    if (level >= MAXIMUM_LEVEL) return MAXIMUM_SPEED_THS;

    if (level <= MID_SPEED_LEVEL) {
      return Number((BASE_SPEED_THS + (level - 1) * SPEED_STEP_THS).toFixed(2));
    }

    const progress =
      (level - MID_SPEED_LEVEL) / (MAXIMUM_LEVEL - MID_SPEED_LEVEL);

    return Number(
      (
        MID_SPEED_THS +
        (MAXIMUM_SPEED_THS - MID_SPEED_THS) * Math.pow(progress, 2.1)
      ).toFixed(2),
    );
  }

  /** The MRG a level mines per day */
  getDailyOutputForLevel(level) {
    if (level <= 0) return 0;
    if (level === 1) return LEVEL_ONE_DAILY_OUTPUT;

    return Number(
      (this.getSpeedForLevel(level) * DAILY_OUTPUT_PER_THS).toFixed(2),
    );
  }

  /** The highest level a holding covers */
  findLevelForHolding(holding) {
    const amount = new Decimal(holding);

    if (amount.lessThan(this.getRequiredHoldingForLevel(2))) {
      return amount.greaterThan(0) ? 1 : 0;
    }

    let lowestLevel = 2;
    let highestLevel = MAXIMUM_LEVEL;

    while (lowestLevel < highestLevel) {
      const middleLevel = Math.ceil((lowestLevel + highestLevel) / 2);

      if (
        amount.greaterThanOrEqualTo(
          this.getRequiredHoldingForLevel(middleLevel),
        )
      ) {
        lowestLevel = middleLevel;
      } else {
        highestLevel = middleLevel - 1;
      }
    }

    return lowestLevel;
  }

  /** Unlock the highest level the current holding covers */
  async unlockAffordableLevel() {
    const holding = this.getWalletHolding();
    const activeLevel = this.getActiveLevel();
    const targetLevel = this.findLevelForHolding(holding);

    if (targetLevel <= activeLevel) {
      this.logger.info(
        `Level ${activeLevel} is the highest ${this.formatAmount(holding)} MRG covers.`,
      );
      return;
    }

    const result = await this.unlockLevel(targetLevel);

    if (!result?.["success"]) {
      this.logger.warn(
        `Failed to unlock level ${targetLevel}: ${result?.["error"] || "Unknown error"}`,
      );
      return;
    }

    this.account_data["activeLevel"] = targetLevel;

    if (result["user"]) {
      this.account_data.user = result["user"];
    }

    this.logger.success(
      `Unlocked level ${targetLevel} at ${this.getSpeedForLevel(targetLevel)} TH/s.`,
    );
  }

  /* --------------------------------------------------------------------- */
  /* Mining                                                                */
  /* --------------------------------------------------------------------- */

  /** Claim what the miner has produced since the last claim */
  async claimPendingMining() {
    const user = this.getAccountDetails();

    if (!user["tonWalletAddress"]) {
      this.logger.warn("Mining only runs while a wallet is connected.");
      return;
    }

    const pending = new Decimal(user["unclaimedMiningBalance"] || 0);

    if (pending.lessThanOrEqualTo(MINIMUM_CLAIMABLE_MINING)) {
      this.logger.info("Nothing mined yet.");
      return;
    }

    const result = await this.claimMining();

    if (!result?.["success"]) {
      this.logger.warn(
        `Failed to claim mining: ${result?.["error"] || "Unknown error"}`,
      );
      return;
    }

    this.account_data.user = result["user"];

    this.logger.success(
      `Claimed ${this.formatAmount(result["claimedAmount"])} MRG.`,
    );
  }

  /* --------------------------------------------------------------------- */
  /* Tasks                                                                 */
  /*                                                                       */
  /* One-time completions come back in `completedTaskIds`; recurring ones   */
  /* report no cooldown at all, so each claim is remembered locally and a   */
  /* refused claim is read as "not ready yet" rather than as a failure.     */
  /* --------------------------------------------------------------------- */

  /** Every task the drop is currently offering */
  getTasks() {
    return this.account_data?.["tasks"] || [];
  }

  /** The tasks the drop has already settled for good */
  getCompletedTaskIds() {
    return this.account_data?.["completedTaskIds"] || [];
  }

  /** Whether a task is the AdsGram one, which is watched rather than opened */
  isAdTask(task) {
    return (
      task["taskId"] === ADSGRAM_TASK_ID ||
      task["verificationType"] === "adsgram_ad"
    );
  }

  /** Whether the local record says a recurring task is still cooling down */
  isTaskOnCooldown(task) {
    const claimedAt = Number(this.taskClaims?.[task["taskId"]]) || 0;
    const cooldown = TASK_COOLDOWNS[task["taskType"]] || 0;

    return claimedAt + cooldown > Date.now();
  }

  /** Whether the drop refused a claim only because the window is still open */
  isTaskCooldownError(result) {
    return /cooldown/i.test(result?.["error"] || "");
  }

  /** Remember when a task was claimed, so the next pass can wait it out */
  recordTaskClaim(taskId) {
    this.taskClaims = { ...(this.taskClaims || {}), [taskId]: Date.now() };
  }

  /** Whether a task is worth spending a claim on right now */
  isTaskClaimable(task) {
    if (task["isPaused"]) return false;
    if (this.isAdTask(task)) return false;

    if (!task["taskType"] || task["taskType"] === "one_time") {
      return !this.getCompletedTaskIds().includes(task["taskId"]);
    }

    return !this.isTaskOnCooldown(task);
  }

  /** Claim every task that is open to this account */
  async completeTasks() {
    const claimableTasks = this.getTasks().filter((task) =>
      this.isTaskClaimable(task),
    );

    if (!claimableTasks.length) {
      this.logger.info("No tasks to claim.");
      return;
    }

    for (const task of claimableTasks) {
      if (this.signal.aborted) break;

      await this.completeTask(task);
    }
  }

  /** Complete one task the way the page does: open it, dwell, then claim */
  async completeTask(task) {
    const url = task["url"];

    if (url && this.utils.isTelegramChatLink(url)) {
      await this.tryToJoinTelegramLink(url);
    }

    await this.utils.delayForSeconds(TASK_DWELL_SECONDS, {
      signal: this.signal,
    });

    const result = await this.claimTask(task["taskId"]);

    if (result?.["success"]) {
      this.recordTaskClaim(task["taskId"]);
      this.logger.success(
        `Claimed "${task["title"]}" for ${task["reward"]} MRG.`,
      );
    } else {
      this.logger.warn(
        `Skipped "${task["title"]}": ${result?.["error"] || "Unknown error"}`,
      );
    }

    await this.utils.delayForSeconds(5, { signal: this.signal });
  }

  /* --------------------------------------------------------------------- */
  /* Ads                                                                   */
  /*                                                                       */
  /* AdsGram credits the drop's backend directly, so the ad is run against  */
  /* AdsGram itself and the claim is retried while the postback lands.      */
  /* --------------------------------------------------------------------- */

  /** The ad task, while the drop is still offering it */
  findAdTask() {
    return this.getTasks().find((task) => this.isAdTask(task));
  }

  /** `task-47913` is the drop's task id; AdsGram knows the block as 47913 */
  getAdBlockId(task) {
    return String(task["taskId"]).replace(/^task-/, "");
  }

  /** Watch the ad task and claim what AdsGram credits for it */
  async watchAdTask() {
    const task = this.findAdTask();

    if (!task) {
      this.logger.info("No ad task on offer.");
      return;
    }

    if (this.isTaskOnCooldown(task)) {
      this.logger.info("The ad task is still cooling down.");
      return;
    }

    await this.adsgram.watch(this.getAdBlockId(task));

    const result = await this.claimAdTask(task);

    if (result?.["success"]) {
      this.recordTaskClaim(task["taskId"]);
      this.logger.success(`Claimed the ad task for ${task["reward"]} MRG.`);
    } else {
      this.logger.warn(
        `The ad reward was not credited: ${result?.["error"] || "Unknown error"}`,
      );
    }
  }

  /** Claim the ad task, giving AdsGram's postback time to arrive */
  async claimAdTask(task) {
    let result;

    for (let attempt = 1; attempt <= AD_CLAIM_ATTEMPTS; attempt++) {
      if (this.signal.aborted) break;

      result = await this.claimTask(task["taskId"]);

      if (result?.["success"] || this.isTaskCooldownError(result)) {
        return result;
      }

      await this.utils.delayForSeconds(AD_CLAIM_INTERVAL_SECONDS, {
        signal: this.signal,
      });
    }

    return result;
  }

  /* --------------------------------------------------------------------- */
  /* Squad                                                                 */
  /* --------------------------------------------------------------------- */

  /** Claim the squad bonus and the commission the squad has mined */
  async claimSquadRewards() {
    const friends = await this.fetchFriends();
    const teamStats = friends?.["teamStats"] || {};
    const unclaimedBonus = new Decimal(
      teamStats["unclaimedOneTimeBonusMRG"] || 0,
    );

    if (unclaimedBonus.greaterThan(0)) {
      const result = await this.claimOneTimeBonus();

      if (result?.["success"]) {
        this.logger.success(
          `Claimed ${this.formatAmount(unclaimedBonus)} MRG in squad bonuses.`,
        );
      } else {
        this.logger.warn(
          `Failed to claim the squad bonus: ${result?.["error"] || "Unknown error"}`,
        );
      }
    } else {
      this.logger.info("No squad bonus to claim.");
    }

    const unclaimedCommission = new Decimal(
      this.getAccountDetails()["unclaimedTeamCommission"] || 0,
    );

    if (unclaimedCommission.greaterThan(0)) {
      const result = await this.claimTeamCommission();

      if (result?.["success"]) {
        this.logger.success(
          `Claimed ${this.formatAmount(unclaimedCommission)} MRG in commission.`,
        );
      } else {
        this.logger.warn(
          `Failed to claim the commission: ${result?.["error"] || "Unknown error"}`,
        );
      }
    } else {
      this.logger.info("No commission to claim.");
    }
  }

  /* --------------------------------------------------------------------- */
  /* Withdrawal                                                            */
  /* --------------------------------------------------------------------- */

  /** The payouts the drop has not settled yet */
  getPendingWithdrawals() {
    const transactions = this.account_data?.["transactions"] || [];

    return transactions.filter((transaction) => {
      const type = String(transaction["type"] || "").toLowerCase();
      const status = String(transaction["status"] || "").toLowerCase();

      return (
        type.includes("withdraw") &&
        (status === "pending" || status === "processing")
      );
    });
  }

  /** Whether the drop still owes this account a settlement */
  async hasPendingWithdrawal() {
    await this.ensureAccountLoaded();

    return this.getPendingWithdrawals().length > 0;
  }

  /**
   * The most one request may carry.
   *
   * The drop lifts the ceiling for accounts holding a thousand MRG or a
   * Genesis NFT, and refuses anything above it outright.
   */
  getWithdrawalLimit() {
    const user = this.getAccountDetails();
    const isPrivileged =
      Boolean(user["isNftHolder"]) ||
      this.getWalletHolding().greaterThanOrEqualTo(PRIVILEGED_HOLDING);

    return isPrivileged
      ? PRIVILEGED_WITHDRAWAL_LIMIT
      : STANDARD_WITHDRAWAL_LIMIT;
  }

  /** Place withdrawal */
  async withdraw({ max, difference = 20, force = false } = {}) {
    if (this.scheduled && !force) {
      return {
        status: false,
        skipped: true,
        message: "Withdrawal is disabled in scheduled mode!",
        amount: "0",
      };
    }

    await this.ensureAccountLoaded();

    const user = this.getAccountDetails();
    const destinationAddress = user["tonWalletAddress"];

    if (!destinationAddress) {
      this.logger.error("No wallet connected!");
      return {
        status: false,
        skipped: true,
        message: "No wallet connected!",
        amount: "0",
      };
    }

    if (this.getPendingWithdrawals().length > 0) {
      this.logger.warn("A withdrawal is already awaiting processing.");
      return {
        status: false,
        skipped: true,
        message: "A withdrawal is already pending!",
        amount: "0",
      };
    }

    const balance = new Decimal(user["inAppBalance"] || 0);
    const minimum = this.getMinimumWithdrawal();
    const requiredBalance = force ? minimum : minimum + WITHDRAWAL_BUFFER;

    if (balance.lessThan(requiredBalance)) {
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

    /** Initial amount to withdraw */
    let amount = Decimal.min(balance, this.getWithdrawalLimit());

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
    amount = Decimal.max(amount, minimum).floor();

    const result = await this.requestWithdrawal(amount, destinationAddress);
    const status = Boolean(result?.["success"]);
    const message = result?.["error"] || result?.["message"] || "";

    if (status) {
      if (result["user"]) {
        this.account_data.user = result["user"];
      }

      if (result["transaction"]) {
        this.account_data["transactions"] = [
          result["transaction"],
          ...(this.account_data["transactions"] || []),
        ];
      }

      this.logger.success(`Requested ${amount.toString()} MRG.`);
      this.logger.keyValue("Destination", destinationAddress);
      this.logger.keyValue(
        "To be received",
        Decimal.max(amount.minus(WITHDRAWAL_FEE), 0).toString(),
      );

      /** Notify the admin, but only when the run was initiated by the scheduler */
      if (this.scheduled) {
        await this.notifyAdmin([
          `<b>🤑 MRG Withdrawal</b>`,
          `<b>Account</b>: ${this.formatAccountLink(this.getUserId())}`,
          `<b>Initial Balance</b>: ${balance.toString()}`,
          `<b>Requested</b>: ${amount.toString()}`,
          `<b>Destination</b>: <code>${destinationAddress}</code>`,
        ]);
      }
    } else {
      this.logger.error("Failed to request withdrawal:", message);
    }

    return {
      status,
      message,
      result,
      skipped: false,
      amount: amount.toString(),
    };
  }

  /** Log the payouts the drop has not settled yet */
  async logWithdrawalStatus() {
    await this.ensureAccountLoaded();

    const pending = this.getPendingWithdrawals();

    this.logger.newline();
    this.logCurrentUser();
    this.logger.keyValue(
      "Balance",
      this.formatAmount(this.getAccountDetails()["inAppBalance"]),
    );
    this.logger.keyValue("Minimum", this.getMinimumWithdrawal());
    this.logger.keyValue("Limit", this.getWithdrawalLimit());
    this.logger.keyValue("Fee", WITHDRAWAL_FEE);
    this.logger.keyValue("Pending Withdrawals", pending.length, {
      valueStyle: pending.length
        ? this.logger.c.yellowBright
        : this.logger.c.greenBright,
    });

    if (!pending.length) {
      this.logger.success("No withdrawal is awaiting processing.");
      return { status: true, pending };
    }

    for (const transaction of pending) {
      this.logger.newline();
      this.logger.keyValue("Amount", transaction["amount"]);
      this.logger.keyValue("Status", transaction["status"]);
      this.logger.keyValue("Requested", transaction["timestamp"]);
    }

    return { status: true, pending };
  }

  /* --------------------------------------------------------------------- */
  /* Auto adapter                                                          */
  /* --------------------------------------------------------------------- */

  /** Bind the wallet the orchestrator loaded onto this account */
  async connectAutoWallet({ phrase, address, version, refresh = false }) {
    try {
      await this.ensureAccountLoaded();

      const walletAddress =
        address ||
        (await getWalletAddressFromMnemonic(phrase, Number(version)));

      const { status, message } =
        await this.connectWalletAddress(walletAddress);

      if (!status) {
        return { status: false, message };
      }

      await this.rememberWalletVersion(version);

      return {
        status: true,
        summary: refresh
          ? await this.refreshAutoSummary()
          : this.getAutoSummary(),
      };
    } catch (error) {
      return { status: false, message: error.message || "Unknown error" };
    }
  }

  /**
   * The drop never reports which contract version an address belongs to, so
   * the version the wallet was loaded with is kept alongside the account.
   */
  async rememberWalletVersion(version) {
    this.connectedWalletVersion = version ? `v${version}` : undefined;

    await this.storage?.set("walletVersion", this.connectedWalletVersion);
  }

  /** Claim pending mining so the summary reflects the current balance */
  async refreshAutoState() {
    return this.claimPendingMining();
  }

  /**
   * Re-read the account afresh.
   *
   * Only re-sending the wallet makes the backend re-read the holding on-chain,
   * so the sync comes first - otherwise the summary reports a level from
   * before the tokens arrived.
   */
  async refreshAutoSummary() {
    await this.syncConnectedWallet();
    await this.loadAccount();

    return this.getAutoSummary();
  }

  /**
   * Put the account to work at the holding it now has.
   *
   * The level is what the miner runs at, and it is only granted on request, so
   * a boost that is not followed by an unlock mines at the old speed.
   */
  async startAutoMining() {
    await this.syncConnectedWallet();
    await this.unlockAffordableLevel();
    await this.claimPendingMining();

    return this.refreshAutoSummary();
  }

  /** Whether the drop has verified the account */
  isAccountVerified(user) {
    return Boolean(user["isVerified"] || user["isManuallyVerified"]);
  }

  /** Whether the drop has banned the account */
  isAccountBanned(user) {
    return user["status"] === "banned" || Boolean(user["bannedAt"]);
  }

  /** Normalized account snapshot */
  getAutoSummary() {
    const user = this.getAccountDetails();
    const address = user["tonWalletAddress"];

    return {
      level: this.getActiveLevel(),
      holding: user["tonWalletBalance"],
      balance: user["inAppBalance"],
      minWithdrawal: this.getMinimumWithdrawal(),
      verified: this.isAccountVerified(user),
      wallet: address
        ? { address, version: this.connectedWalletVersion }
        : null,
      banned: this.isAccountBanned(user),
      banReason: user["banReason"],
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
          {
            id: "refresh-holding",
            icon: "reconnect",
            title: "Refresh Holding",
            action: this.refreshHolding.bind(this),
            dispatch: false,
          },
        ],
      },
      {
        name: "Mining",
        list: [
          {
            id: "claim-mining",
            icon: "check",
            title: "Claim Mining",
            action: this.claimMiningInteractive.bind(this),
            dispatch: false,
          },
          {
            id: "estimate-mining",
            icon: "search",
            title: "Estimate Mining",
            action: this.estimateMining.bind(this),
            dispatch: false,
          },
        ],
      },
      {
        name: "Levels",
        list: [
          {
            id: "unlock-level",
            icon: "key",
            title: "Unlock Level",
            action: this.unlockLevelInteractive.bind(this),
            dispatch: false,
          },
        ],
      },
      {
        name: "Withdrawal",
        list: [
          {
            id: "withdrawal-status",
            icon: "history",
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

  /** Bind a wallet, prompting for its address */
  async connectWalletInteractive() {
    const input = await this.promptInput("Enter your TON wallet address:");
    const address = (input || "").trim();

    if (!address) {
      this.logger.warn("No address provided.");
      return;
    }

    /* Checked here so a typo is caught before it becomes the payout address */
    if (!this.validateWalletAddress(address)) {
      this.logger.warn(
        "Not a valid TON address - it should start with UQ or EQ.",
      );
      return;
    }

    await this.ensureAccountLoaded();
    await this.connectWalletAddress(address);
    await this.unlockAffordableLevel();
  }

  /** Re-read the connected wallet on-chain and unlock what it now covers */
  async refreshHolding() {
    await this.ensureAccountLoaded();

    const { status } = await this.syncConnectedWallet();

    if (status) {
      await this.unlockAffordableLevel();
    }
  }

  /** Claim mining on demand */
  async claimMiningInteractive() {
    await this.ensureAccountLoaded();
    await this.claimPendingMining();
  }

  /** Unlock a level, prompting for which one */
  async unlockLevelInteractive() {
    await this.ensureAccountLoaded();

    const input = await this.promptInput("Which level?");
    const level = Number((input || "").trim());

    if (!Number.isInteger(level) || level < 1 || level > MAXIMUM_LEVEL) {
      this.logger.warn(`Enter a level between 1 and ${MAXIMUM_LEVEL}.`);
      return;
    }

    const required = this.getRequiredHoldingForLevel(level);
    const holding = this.getWalletHolding();

    this.logger.newline();
    this.logger.keyValue("Level", level);
    this.logger.keyValue("Required Holding", this.formatAmount(required));
    this.logger.keyValue("Your Holding", this.formatAmount(holding));

    if (holding.lessThan(required)) {
      this.logger.warn(
        `${this.formatAmount(required.minus(holding))} MRG short of level ${level}.`,
      );
      return;
    }

    const result = await this.unlockLevel(level);

    if (result?.["success"]) {
      this.account_data["activeLevel"] = level;
      this.logger.success(
        `Unlocked level ${level} at ${this.getSpeedForLevel(level)} TH/s.`,
      );
    } else {
      this.logger.error(
        `Failed to unlock level ${level}: ${result?.["error"] || "Unknown error"}`,
      );
    }
  }

  /** Report what a holding would mine, prompting for the amount */
  async estimateMining() {
    const input = await this.promptInput("How much MRG?");
    const trimmed = (input || "").trim();

    if (!trimmed) return;

    let holding;

    try {
      holding = new Decimal(trimmed);
    } catch {
      this.logger.error("Invalid MRG amount:", trimmed);
      return;
    }

    if (holding.isNegative()) {
      this.logger.error("MRG amount must be non-negative");
      return;
    }

    const level = this.findLevelForHolding(holding);
    const speed = this.getSpeedForLevel(level);
    const dailyOutput = new Decimal(this.getDailyOutputForLevel(level));

    this.logger.newline();
    this.logger.keyValue("MRG Amount", this.formatAmount(holding));
    this.logger.keyValue("Reachable Level", level);
    this.logger.keyValue(
      "Level Cost",
      this.formatAmount(this.getRequiredHoldingForLevel(level)),
    );
    this.logger.keyValue("Speed", `${speed} TH/s`);

    this.logger.newline();
    this.logMiningRateBreakdown(dailyOutput);
  }

  /** Log a daily mining rate spread across every period */
  logMiningRateBreakdown(dailyRate) {
    const periods = [
      ["Per Second", new Decimal(1).div(86400)],
      ["Per Minute", new Decimal(1).div(1440)],
      ["Per Hour", new Decimal(1).div(24)],
      ["Per Day", new Decimal(1)],
      ["Per Week (7d)", new Decimal(7)],
      ["Per Month (30d)", new Decimal(30)],
    ];

    for (const [label, multiplier] of periods) {
      this.logger.keyValue(
        label,
        this.formatAmount(dailyRate.times(multiplier)),
        {
          valueStyle: this.logger.c.greenBright,
        },
      );
    }
  }

  /** Withdraw, prompting for the amount */
  async withdrawInteractive() {
    await this.logWithdrawalStatus();

    const input = await this.promptInput(
      `How much MRG? (minimum ${this.getMinimumWithdrawal()})`,
    );
    const trimmed = (input || "").trim();

    if (!trimmed) {
      this.logger.warn("No amount provided.");
      return;
    }

    const amount = Number(trimmed);

    if (!Number.isFinite(amount) || amount <= 0) {
      this.logger.error("Invalid MRG amount:", trimmed);
      return;
    }

    return this.withdraw({ max: amount, difference: 0, force: true });
  }

  /** Format an MRG amount, keeping sub-1 values readable */
  formatAmount(value) {
    const amount = new Decimal(value || 0);

    return amount
      .toDecimalPlaces(amount.abs().greaterThanOrEqualTo(1) ? 4 : 8)
      .toString();
  }
}
