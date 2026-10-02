import BaseFarmer from "../lib/BaseFarmer.js";
import Decimal from "decimal.js";
import GigaPubClient from "../lib/GigaPubClient.js";

/** The drop's backend, served from the mini app's own origin */
const API_URL = "https://tacairdrop.xyz/api";

/** The TAC jetton the drop pays out, 18 decimals */
const TAC_JETTON_ADDRESS = "EQBE_gBrU3mPI9hHjlJoR_kYyrhQgyCFD6EUWfa42W8T7EBP";

/** Bot the referral links point at, when the drop does not publish one */
const BOT_USERNAME = "TAC_AIRDROP_bot";

/** Wallet the drop is told the address came from, as TON Connect's `device.appName` reports it */
const WALLET_TYPE = "tonkeeper";

/** Smallest mined amount worth a claim */
const MINIMUM_CLAIMABLE_MINING = 0.0001;

/** How long a task is left open before it is claimed */
const TASK_DWELL_SECONDS = 15;

/** Miner levels come 20 to a page */
const LEVELS_PER_PAGE = 20;

/** Pause between levels when upgrading step by step */
const UPGRADE_STEP_DELAY_SECONDS = 1;

/** Whether to buy the highest level the assets cover on every pass */
const AUTO_UPGRADE_LEVEL = true;

/** Ads the drop pays for in one window */
const ADS_PER_WINDOW = 5;

/** The ad window runs 24 hours from its first ad */
const ADS_WINDOW_MS = 864e5;

/** The GigaPub project the page loads */
const GIGAPUB_PROJECT_ID = 8412;

/** How long to dwell instead when GigaPub has no ad to play */
const AD_WATCH_SECONDS = 15;

/** Pause between ads */
const AD_GAP_SECONDS = 5;

/** Fallback minimum, used until the drop's settings have been read */
const MINIMUM_WITHDRAWAL = 100;

/** Safety margin above the drop's minimum, so a scheduled run does not withdraw the instant it crosses it */
const WITHDRAWAL_BUFFER = 50;

export default class TACFarmer extends BaseFarmer {
  static published = true;
  static id = "tac";
  static title = "TAC";
  static emoji = "💎";
  static host = "tacairdrop.xyz";
  static domains = [
    "tacairdrop.xyz",
    "ad.gigapub.tech",
    "munqu.com",
    "d3rem.com",
    "my.rtmark.net",
  ];
  static telegramLink = "https://t.me/tacairdrop_bot?start=1147265290";
  static path = "/";
  static interval = "0 * * * *";
  static apiDelay = 500;
  static rating = 5;

  static auto = {
    id: "tac-auto",
    title: "TAC Auto",
    token: "TAC",
    jettonAddress: TAC_JETTON_ADDRESS,
    storagePrefix: "tac-auto",
    minWithdrawal: MINIMUM_WITHDRAWAL,
  };

  /* --------------------------------------------------------------------- */
  /* Transport                                                             */
  /* --------------------------------------------------------------------- */

  /** Carry `initData` and `userId` on every call the drop's own API receives, and on no others */
  configureApi() {
    const interceptor = this.api.interceptors.request.use((config) => {
      if (String(config.url || "").startsWith(API_URL)) {
        config.headers["X-Telegram-Init-Data"] = this.getInitData();

        if (String(config.method).toLowerCase() === "post") {
          config.data = {
            ...config.data,
            userId: String(this.getUserId()),
          };
        }
      }

      return config;
    });

    return () => {
      this.api.interceptors.request.eject(interceptor);
    };
  }

  /** Whether a status is a refusal the drop explains in its body, rather than a failure */
  isPayloadStatus(status) {
    return status === 400 || (status >= 200 && status < 300);
  }

  /** Read from the drop's API */
  getFromApi(path, params = {}) {
    return this.api
      .get(`${API_URL}${path}`, { params, signal: this.signal })
      .then((response) => response.data);
  }

  /** Call the drop's API, reading a refused action's `400` as a payload rather than throwing it */
  postToApi(path, data = {}) {
    return this.api
      .post(`${API_URL}${path}`, data, {
        signal: this.signal,
        validateStatus: this.isPayloadStatus,
      })
      .then((response) => response.data);
  }

  /* --------------------------------------------------------------------- */
  /* Endpoints                                                             */
  /* --------------------------------------------------------------------- */

  /** The full app state, registering the account and its referrer on first contact */
  fetchState() {
    const params = { userId: String(this.getUserId()) };
    const ref = this.getReferrerStartParam();
    const username = this.getUsername() || this.getUserFullName();

    if (ref) params.ref = ref;
    if (username) params.username = username;

    return this.getFromApi("/state", params);
  }

  /** One page of the miner store, or the page holding a single level */
  fetchMinerLevels(page = 1, level) {
    const params = { page: String(page), perPage: String(LEVELS_PER_PAGE) };

    if (level) params.level = String(level);

    return this.getFromApi("/miner-levels", params);
  }

  /** Bind a wallet to the account */
  connectWallet(address, walletType = WALLET_TYPE) {
    return this.postToApi("/user/connect-wallet", { address, walletType });
  }

  /** Unbind the wallet the account is on */
  disconnectWallet() {
    return this.postToApi("/user/disconnect-wallet");
  }

  /** Ask the drop to verify the account */
  verifyUser() {
    return this.postToApi("/user/verify");
  }

  /** Start a mining session */
  startMining() {
    return this.postToApi("/mining/start");
  }

  /** Claim what the session has mined into the pool wallet */
  claimMining() {
    return this.postToApi("/mining/claim");
  }

  /** Claim one task */
  completeTaskById(taskId) {
    return this.postToApi("/tasks/complete", { taskId });
  }

  /** The page's GigaPub project, created once per run */
  get gigapub() {
    return (this._gigapub ||= new GigaPubClient(this, {
      projectId: GIGAPUB_PROJECT_ID,
    }));
  }

  /** Report a watched ad */
  watchAd() {
    return this.postToApi("/ads/watch");
  }

  /** Buy a miner level */
  upgradeMiner(targetLevel) {
    return this.postToApi("/miners/upgrade", { targetLevel });
  }

  /** Claim the per-friend referral rewards */
  claimReferrals() {
    return this.postToApi("/referrals/claim");
  }

  /** Claim the team wallet commission */
  claimTeamWallet() {
    return this.postToApi("/referrals/claim-team");
  }

  /** Request a payout from the pool wallet */
  requestWithdrawal(amount, destinationAddress) {
    return this.postToApi("/withdraw", {
      destinationAddress,
      amountAtf: Number(amount),
    });
  }

  /* --------------------------------------------------------------------- */
  /* Session                                                               */
  /* --------------------------------------------------------------------- */

  /** Get Auth */
  fetchAuth() {
    return this.loadState();
  }

  /** Sign in and read the state */
  login() {
    return this.loadState();
  }

  /** Re-read the state into the farmer */
  async loadState() {
    this.state_data = await this.fetchState();
    return this.state_data;
  }

  /** Read the state once, for entry points that run without a full pass */
  async ensureStateLoaded() {
    if (!this.state_data) {
      await this.loadState();
    }

    return this.state_data;
  }

  /** Fold an action's returned user and mining status into the state */
  applyResult(result) {
    if (result?.["user"]) {
      this.state_data.currentUser = result["user"];
    }

    if (result?.["miningStatus"]) {
      this.state_data.miningStatus = result["miningStatus"];
    }
  }

  /** Get User Details */
  getUserDetails() {
    return this.state_data.currentUser;
  }

  /** The drop's live settings */
  getSettings() {
    return this.state_data?.settings || {};
  }

  /** Get Referral Link */
  getReferralLink() {
    const bot = this.getSettings()["telegramBotUsername"] || BOT_USERNAME;

    return `https://t.me/${bot}?start=${this.getUserId()}`;
  }

  /** Get Referrals Count */
  async getReferralsCount() {
    await this.ensureStateLoaded();

    return Number(this.getUserDetails()["referralCount"]) || 0;
  }

  /** The drop publishes its minimum in its settings */
  getMinimumWithdrawal() {
    return (
      Number(this.state_data?.settings?.["minWithdrawalAmount"]) ||
      super.getMinimumWithdrawal()
    );
  }

  /* --------------------------------------------------------------------- */
  /* Process                                                               */
  /* --------------------------------------------------------------------- */

  /** Process Farmer */
  async process() {
    await this.loadState();

    this.logAccountInfo();
    this.checkTokenContract(this.getSettings()["tokenContractAddress"]);

    await this.executeTask("Verify", () => this.verifyIfNeeded());
    await this.executeTask("Mining", () => this.startOrClaimMining());
    await this.executeTask("Squad", () => this.claimSquadRewards());
    await this.executeTask("Level", () => this.upgradeAffordableLevel());
    await this.executeTask("Tasks", () => this.completeTasks());
    await this.executeTask("Ads", () => this.watchAds());
    await this.executeTask("Withdraw", () => this.withdraw());
    await this.storeAutoSnapshot();
  }

  /** Log what the account looks like before the pass starts */
  logAccountInfo() {
    const user = this.getUserDetails();
    const address = this.getConnectedWalletAddress();

    this.logger.newline();
    this.logCurrentUser();
    this.logger.keyValue("Level", user["currentLevel"]);
    this.logger.keyValue(
      "Peak Level",
      user["peakLevel"] || user["currentLevel"],
    );
    this.logger.keyValue("Pool Wallet", this.formatAmount(user["poolWallet"]));
    this.logger.keyValue(
      "Holding Wallet",
      this.formatAmount(user["holdingWallet"]),
    );
    this.logger.keyValue(
      "Pending Mining",
      this.formatAmount(this.getPendingMining()),
    );
    this.logger.keyValue(
      "Mining Since",
      user["miningStartedAt"]
        ? new Date(Number(user["miningStartedAt"])).toLocaleString()
        : "Not mining",
    );

    this.logger.newline();
    this.logger.keyValue("Wallet", address || "Not connected", {
      valueStyle: address
        ? this.logger.c.greenBright
        : this.logger.c.yellowBright,
    });
    this.logger.keyValue("Verified", user["verified"] ? "Yes" : "No", {
      valueStyle: user["verified"]
        ? this.logger.c.greenBright
        : this.logger.c.yellowBright,
    });
    this.logger.keyValue("Referrals", user["referralCount"] || 0);
    this.logger.keyValue(
      "Ads Today",
      `${ADS_PER_WINDOW - this.getAdWindow(user).remaining}/${ADS_PER_WINDOW}`,
    );

    const pending = this.getPendingWithdrawals();

    this.logger.keyValue("Pending Withdrawals", pending.length, {
      valueStyle: pending.length
        ? this.logger.c.yellowBright
        : this.logger.c.greenBright,
    });
  }

  /** Verify the account once a wallet is bound */
  async verifyIfNeeded() {
    const user = this.getUserDetails();

    if (user["verified"]) return;

    if (!user["walletAddress"]) {
      this.logger.info("Verification needs a connected wallet.");
      return;
    }

    return this.verifyAccount();
  }

  /** Ask the drop to verify the account */
  async verifyAccount() {
    const result = await this.verifyUser();

    if (result?.["error"]) {
      this.logger.warn("Failed to verify:", result["error"]);
      return { status: false, message: result["error"] };
    }

    this.applyResult(result);
    this.logger.success("Account verified.");

    return { status: true };
  }

  /* --------------------------------------------------------------------- */
  /* Wallet                                                                */
  /* --------------------------------------------------------------------- */

  /** The bound address in its friendly, non-bounceable form */
  getConnectedWalletAddress() {
    const address = this.state_data?.currentUser?.["walletAddress"];

    return address ? this.utils.toFriendlyAddress(address) : null;
  }

  /** Bind an address to the account, sent as `0:hex` the way TON Connect hands it to the page */
  async connectWalletAddress(address) {
    const rawAddress = this.utils.toRawAddress(address);

    if (!rawAddress) {
      this.logger.error("Not a valid TON address:", address);
      return { status: false, message: "Not a valid TON address" };
    }

    const result = await this.connectWallet(rawAddress);

    if (!result?.["user"]) {
      const message = result?.["error"] || "Failed to connect the wallet";

      this.logger.error(message);
      return { status: false, message };
    }

    this.applyResult(result);
    this.logger.success(
      `Wallet connected: ${this.utils.toFriendlyAddress(address)}`,
    );

    return { status: true, message: "Wallet connected" };
  }

  /* --------------------------------------------------------------------- */
  /* Mining                                                                */
  /* --------------------------------------------------------------------- */

  /** What the current session has mined, as the drop reports it */
  getPendingMining() {
    return new Decimal(this.state_data?.miningStatus?.["currentMinedAtf"] || 0);
  }

  /** Start a session, or claim the running one and keep it going */
  async startOrClaimMining() {
    const user = this.getUserDetails();

    if (!user["walletAddress"]) {
      this.logger.warn("Mining only runs while a wallet is connected.");
      return;
    }

    if (!user["miningStartedAt"]) {
      return this.startMiningSession();
    }

    const pending = this.getPendingMining();

    if (pending.lessThanOrEqualTo(MINIMUM_CLAIMABLE_MINING)) {
      this.logger.info("Nothing mined yet.");
      return;
    }

    const result = await this.claimMining();

    if (result?.["error"]) {
      this.logger.warn("Failed to claim mining:", result["error"]);
      return;
    }

    this.applyResult(result);
    this.logger.success(`Claimed ${this.formatAmount(pending)} TAC.`);

    /** A claim that ends the session needs a new one */
    if (!this.getUserDetails()["miningStartedAt"]) {
      await this.utils.delayForSeconds(3, { signal: this.signal });
      await this.startMiningSession();
    }
  }

  /** Start a mining session */
  async startMiningSession() {
    const result = await this.startMining();

    if (result?.["error"]) {
      this.logger.warn("Failed to start mining:", result["error"]);
      return;
    }

    this.applyResult(result);
    this.logger.success("Mining started!");
  }

  /* --------------------------------------------------------------------- */
  /* Squad                                                                 */
  /* --------------------------------------------------------------------- */

  /** Claim the referral rewards and team commission into the holding wallet */
  async claimSquadRewards() {
    const referralRewards = new Decimal(
      this.getUserDetails()["unclaimedReferralRewards"] || 0,
    );

    if (referralRewards.greaterThan(0)) {
      const result = await this.claimReferrals();

      if (result?.["error"]) {
        this.logger.warn("Failed to claim referrals:", result["error"]);
      } else {
        this.applyResult(result);
        this.logger.success(
          `Claimed ${this.formatAmount(referralRewards)} TAC from referrals.`,
        );
      }

      await this.utils.delayForSeconds(2, { signal: this.signal });
    } else {
      this.logger.info("No referral rewards to claim.");
    }

    const teamWallet = new Decimal(
      this.getUserDetails()["unclaimedTeamWallet"] || 0,
    );

    if (teamWallet.greaterThan(MINIMUM_CLAIMABLE_MINING)) {
      const result = await this.claimTeamWallet();

      if (result?.["error"]) {
        this.logger.warn("Failed to claim the team wallet:", result["error"]);
      } else {
        this.applyResult(result);
        this.logger.success(
          `Claimed ${this.formatAmount(teamWallet)} TAC from the team wallet.`,
        );
      }
    } else {
      this.logger.info("No team wallet commission to claim.");
    }
  }

  /* --------------------------------------------------------------------- */
  /* Levels                                                                */
  /* --------------------------------------------------------------------- */

  /** Holding plus pool, which is what the drop unlocks levels against */
  getTotalAssets(user = this.getUserDetails()) {
    return new Decimal(user["holdingWallet"] || 0).plus(
      user["poolWallet"] || 0,
    );
  }

  /** One level's terms, looked up through the store's search */
  async fetchMinerLevel(level) {
    const response = await this.fetchMinerLevels(1, level);

    return (response?.["levels"] || []).find(
      (item) => Number(item["level"]) === Number(level),
    );
  }

  /** The highest level an amount covers, walking the store from a starting level */
  async findLevelForAssets(assets, fromLevel = 1) {
    const amount = new Decimal(assets);
    let page = Math.floor((Math.max(fromLevel, 1) - 1) / LEVELS_PER_PAGE) + 1;
    let reachable = null;

    while (!this.signal.aborted) {
      const response = await this.fetchMinerLevels(page);
      const levels = response?.["levels"] || [];

      for (const item of levels) {
        if (amount.lessThan(item["requiredHoldingAtf"] || 0)) {
          return reachable;
        }

        reachable = item;
      }

      if (!levels.length || page >= Number(response?.["totalPages"] || 0)) {
        return reachable;
      }

      page++;
    }

    return reachable;
  }

  /** Climb one level at a time to the highest level the holding and pool cover */
  async upgradeAffordableLevel() {
    if (!AUTO_UPGRADE_LEVEL) return;

    const user = this.getUserDetails();
    const currentLevel = Number(user["currentLevel"]) || 1;
    const assets = this.getTotalAssets(user);
    const target = await this.findLevelForAssets(assets, currentLevel);
    const targetLevel = Number(target?.["level"]) || 0;

    if (targetLevel <= currentLevel) {
      this.logger.info(
        `Level ${currentLevel} is the highest ${this.formatAmount(assets)} TAC covers.`,
      );
      return;
    }

    return this.upgradeStepByStep(targetLevel);
  }

  /** Buy a level, reporting whether the drop charged the pool for it */
  async upgradeToLevel(targetLevel) {
    const poolBefore = new Decimal(this.getUserDetails()["poolWallet"] || 0);
    const result = await this.upgradeMiner(targetLevel);

    if (result?.["error"]) {
      this.logger.warn(
        `Failed to upgrade to level ${targetLevel}:`,
        result["error"],
      );
      return { status: false, message: result["error"] };
    }

    this.applyResult(result);

    const user = this.getUserDetails();
    const poolAfter = new Decimal(user["poolWallet"] || 0);

    this.logger.success(`Upgraded to level ${user["currentLevel"]}.`);

    if (poolAfter.lessThan(poolBefore)) {
      this.logger.warn(
        `The upgrade cost ${this.formatAmount(poolBefore.minus(poolAfter))} TAC from the pool wallet.`,
      );
    }

    return { status: true };
  }

  /* --------------------------------------------------------------------- */
  /* Tasks                                                                 */
  /* --------------------------------------------------------------------- */

  /** The active tasks the account has not completed */
  getAvailableTasks() {
    const completed = this.getUserDetails()["completedTaskIds"] || [];

    return (this.state_data?.tasks || []).filter(
      (task) => task["active"] && !completed.includes(task["id"]),
    );
  }

  /** Claim every task that is open to this account */
  async completeTasks() {
    const tasks = this.getAvailableTasks();

    if (!tasks.length) {
      this.logger.info("No tasks to claim.");
      return;
    }

    for (const task of tasks) {
      if (this.signal.aborted) break;

      await this.completeTask(task);
    }
  }

  /** Complete one task the way the page does: open it, dwell, then claim */
  async completeTask(task) {
    await this.openTaskLink(task["url"], TASK_DWELL_SECONDS);

    const result = await this.completeTaskById(task["id"]);

    if (result?.["error"]) {
      this.logger.warn(`Skipped "${task["title"]}":`, result["error"]);
    } else {
      this.applyResult(result);
      this.logger.success(
        `Claimed "${task["title"]}" for ${task["rewardAtf"]} TAC.`,
      );
    }

    await this.utils.delayForSeconds(5, { signal: this.signal });
  }

  /* --------------------------------------------------------------------- */
  /* Ads                                                                   */
  /* --------------------------------------------------------------------- */

  /** The ads left in the current window, read the way the page reads them */
  getAdWindow(user = this.getUserDetails()) {
    const now = Date.now();
    let watched = Number(user["adsWatchedToday"]) || 0;
    let startedAt = Number(user["adsWindowStartedAt"]) || 0;

    if (!startedAt || now - startedAt >= ADS_WINDOW_MS) {
      watched = 0;
      startedAt = 0;
    }

    return {
      remaining: Math.max(0, ADS_PER_WINDOW - watched),
      resetInMs: startedAt ? Math.max(0, ADS_WINDOW_MS - (now - startedAt)) : 0,
    };
  }

  /** Play an ad through GigaPub, dwelling instead when it has none to serve */
  async playGigaAd() {
    try {
      await this.gigapub.watch();
    } catch (error) {
      this.logger.warn("GigaPub ad failed:", error.message);

      await this.utils.delayForSeconds(AD_WATCH_SECONDS, {
        signal: this.signal,
      });
    }
  }

  /** Watch every ad left in the window, stopping at the first refusal */
  async watchAds() {
    let { remaining, resetInMs } = this.getAdWindow();

    if (remaining <= 0) {
      const hours = Math.floor(resetInMs / 36e5);
      const minutes = Math.floor((resetInMs % 36e5) / 6e4);

      this.logger.info(`No ads left today, resets in ${hours}h ${minutes}m.`);
      return;
    }

    while (remaining > 0 && !this.signal.aborted) {
      await this.playGigaAd();

      const result = await this.watchAd();

      if (result?.["error"]) {
        this.logger.warn("Failed to watch ad:", result["error"]);
        return;
      }

      this.applyResult(result);

      remaining = Number(result?.["adsRemaining"]) || 0;

      this.logger.success(
        `Watched ad for ${result?.["reward"]} TAC (${remaining} left today).`,
      );

      if (remaining > 0) {
        await this.utils.delayForSeconds(AD_GAP_SECONDS, {
          signal: this.signal,
        });
      }
    }
  }

  /* --------------------------------------------------------------------- */
  /* Withdrawal                                                            */
  /* --------------------------------------------------------------------- */

  /** The account's payouts, newest first */
  getWithdrawals() {
    return this.state_data?.withdrawals || [];
  }

  /** The payouts the drop has not settled yet */
  getPendingWithdrawals() {
    return this.getWithdrawals().filter((item) => item["status"] === "PENDING");
  }

  /** Whether the drop still owes this account a settlement */
  async hasPendingWithdrawal() {
    await this.ensureStateLoaded();

    return this.getPendingWithdrawals().length > 0;
  }

  /** The account's own withdrawal queue */
  async getAutoWithdrawals() {
    await this.ensureStateLoaded();

    const withdrawals = this.getWithdrawals();

    return {
      pending: withdrawals.filter((item) => item["status"] === "PENDING"),
      approved: withdrawals.filter((item) =>
        ["APPROVED", "COMPLETED"].includes(item["status"]),
      ),
      flagged: withdrawals.filter((item) => item["status"] === "REJECTED"),
    };
  }

  /** Place withdrawal */
  async withdraw({ max, difference = 20, force = false } = {}) {
    const scheduledSkip = this.skipScheduledWithdrawal(force);

    if (scheduledSkip) return scheduledSkip;

    await this.ensureStateLoaded();

    const user = this.getUserDetails();
    const destinationAddress = this.getConnectedWalletAddress();

    if (!destinationAddress) {
      return this.skipWithdrawal("No wallet connected!");
    }

    if (this.getPendingWithdrawals().length > 0) {
      return this.skipWithdrawal("A withdrawal is already pending!", {
        log: "warn",
      });
    }

    const balance = new Decimal(user["poolWallet"] || 0);
    const minimum = this.getMinimumWithdrawal();
    const requiredBalance = force ? minimum : minimum + WITHDRAWAL_BUFFER;

    if (balance.lessThan(requiredBalance)) {
      this.logger.error("Not enough balance:", balance.toString());
      return this.skipWithdrawal("Not enough balance!", {
        amount: balance,
        log: null,
      });
    }

    /** Log balance */
    this.logger.info("Available balance:", balance.toString());

    const amount = this.pickWithdrawalAmount({
      balance,
      minimum,
      max,
      difference,
    });

    const result = await this.requestWithdrawal(amount, destinationAddress);
    const status = Boolean(result?.["withdrawal"] || result?.["user"]);
    const message = result?.["error"] || result?.["message"] || "";

    if (status) {
      this.applyResult(result);

      if (result["withdrawal"]) {
        this.state_data.withdrawals = [
          result["withdrawal"],
          ...this.getWithdrawals(),
        ];
      }

      this.logger.success(`Requested ${amount.toString()} TAC.`);
      this.logger.keyValue("Destination", destinationAddress);

      await this.notifyWithdrawal([
        ["Initial Balance", balance.toString()],
        ["Requested", amount.toString()],
        ["Destination", `<code>${destinationAddress}</code>`],
      ]);
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
    await this.ensureStateLoaded();

    const pending = this.getPendingWithdrawals();

    this.logger.newline();
    this.logCurrentUser();
    this.logger.keyValue(
      "Pool Wallet",
      this.formatAmount(this.getUserDetails()["poolWallet"]),
    );
    this.logger.keyValue("Minimum", this.getMinimumWithdrawal());
    this.logger.keyValue("Pending Withdrawals", pending.length, {
      valueStyle: pending.length
        ? this.logger.c.yellowBright
        : this.logger.c.greenBright,
    });

    if (!pending.length) {
      this.logger.success("No withdrawal is awaiting processing.");
      return { status: true, pending };
    }

    for (const item of pending) {
      this.logger.newline();
      this.logger.keyValue("Amount", item["amountAtf"]);
      this.logger.keyValue("Destination", item["destinationAddress"]);
      this.logger.keyValue(
        "Requested",
        new Date(item["createdAt"]).toLocaleString(),
      );
    }

    return { status: true, pending };
  }

  /* --------------------------------------------------------------------- */
  /* Auto adapter                                                          */
  /* --------------------------------------------------------------------- */

  /** A wallet bound by the Auto is verified straight away */
  async afterAutoWalletConnected() {
    await this.verifyIfNeeded();
  }

  /** Claim pending mining so the summary reflects the current balance */
  async refreshAutoState() {
    await this.ensureStateLoaded();

    return this.startOrClaimMining();
  }

  /** Re-read the state for a fresh summary */
  async refreshAutoSummary() {
    await this.loadState();

    return this.getAutoSummary();
  }

  /** Put the account to work and report it afresh */
  async startAutoMining() {
    await this.ensureStateLoaded();
    await this.startOrClaimMining();
    await this.claimSquadRewards();
    await this.upgradeAffordableLevel();
    await this.watchAds();

    return this.refreshAutoSummary();
  }

  /** Normalized account snapshot */
  getAutoSummary() {
    const user = this.getUserDetails();
    const address = this.getConnectedWalletAddress();

    return {
      level: user["currentLevel"],
      mining: {
        startedAt: Math.floor(Number(user["miningStartedAt"] || 0) / 1000),
        freezesAt: 0,
        frozen: false,
      },
      holding: user["holdingWallet"],
      balance: user["poolWallet"],
      minWithdrawal: this.getMinimumWithdrawal(),
      verified: Boolean(user["verified"]),
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
        list: [
          ...this.createAutoWalletTools(),
          {
            id: "verify-account",
            icon: "kyc",
            title: "Verify Account",
            action: this.verifyAccountInteractive.bind(this),
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
        name: "Squad",
        list: [
          {
            id: "claim-squad",
            icon: "check",
            title: "Claim Referrals",
            action: this.claimSquadRewardsInteractive.bind(this),
            dispatch: false,
          },
        ],
      },
      {
        name: "Tasks",
        list: [
          {
            id: "complete-tasks",
            icon: "check",
            title: "Complete Tasks",
            action: this.completeTasksInteractive.bind(this),
            dispatch: false,
          },
          {
            id: "watch-ads",
            icon: "check",
            title: "Watch Ads",
            action: this.watchAdsInteractive.bind(this),
            dispatch: false,
          },
        ],
      },
      {
        name: "Levels",
        list: [
          {
            id: "upgrade-level",
            icon: "key",
            title: "Upgrade Level",
            action: this.upgradeLevelInteractive.bind(this),
            dispatch: false,
          },
          {
            id: "upgrade-to-level",
            icon: "reconnect",
            title: "Upgrade Step by Step",
            action: this.upgradeStepByStepInteractive.bind(this),
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

    if (!this.utils.isTonAddress(address)) {
      this.logger.warn("Not a valid TON address.");
      return;
    }

    await this.ensureStateLoaded();

    const { status } = await this.connectWalletAddress(address);

    if (!status) return;

    this.logger.keyValue(
      "On-chain TAC",
      this.formatAmount(await this.readOnChainHolding(address)),
    );

    await this.verifyIfNeeded();
  }

  /** Unbind the wallet the account is on */
  async disconnectWalletInteractive() {
    await this.ensureStateLoaded();

    const result = await this.disconnectWallet();

    if (result?.["error"]) {
      this.logger.error("Failed to disconnect:", result["error"]);
      return;
    }

    this.applyResult(result);
    await this.rememberWalletVersion(undefined);
    this.logger.success("Wallet disconnected.");
  }

  /** Verify on demand */
  async verifyAccountInteractive() {
    await this.ensureStateLoaded();

    if (this.getUserDetails()["verified"]) {
      this.logger.success("Account is already verified.");
      return;
    }

    await this.verifyAccount();
  }

  /** Claim mining on demand */
  async claimMiningInteractive() {
    await this.ensureStateLoaded();
    await this.startOrClaimMining();
  }

  /** Claim referral rewards and team commission on demand */
  async claimSquadRewardsInteractive() {
    await this.ensureStateLoaded();
    await this.claimSquadRewards();
  }

  /** Claim every open task on demand */
  async completeTasksInteractive() {
    await this.ensureStateLoaded();
    await this.completeTasks();
  }

  /** Watch the window's ads on demand */
  async watchAdsInteractive() {
    await this.ensureStateLoaded();
    await this.watchAds();
  }

  /** Buy a level, prompting for which one and leaving the assets to the drop to judge */
  async upgradeLevelInteractive() {
    await this.ensureStateLoaded();

    const input = await this.promptInput("Which level?");
    const level = Number((input || "").trim());

    if (!Number.isInteger(level) || level < 1) {
      this.logger.warn("Enter a valid level.");
      return;
    }

    const item = await this.fetchMinerLevel(level);
    const assets = this.getTotalAssets();

    this.logger.newline();
    this.logger.keyValue("Level", level);

    if (item) {
      this.logger.keyValue(
        "Required Assets",
        this.formatAmount(item["requiredHoldingAtf"]),
      );
      this.logger.keyValue("Speed", `${item["speedTh"]} TH/s`);
    }

    this.logger.keyValue("Your Assets", this.formatAmount(assets));

    /** Reported rather than refused, so a level can be tried whatever the assets read */
    if (item && assets.lessThan(item["requiredHoldingAtf"] || 0)) {
      this.logger.warn(
        `${this.formatAmount(new Decimal(item["requiredHoldingAtf"]).minus(assets))} TAC short of level ${level}, asking anyway.`,
      );
    }

    await this.upgradeToLevel(level);
  }

  /** Buy every level from the next one up to a target, prompting for the target */
  async upgradeStepByStepInteractive() {
    await this.ensureStateLoaded();

    const currentLevel = Number(this.getUserDetails()["currentLevel"]) || 1;
    const input = await this.promptInput(
      `Upgrade from level ${currentLevel} up to which level?`,
    );
    const targetLevel = Number((input || "").trim());

    if (!Number.isInteger(targetLevel) || targetLevel <= currentLevel) {
      this.logger.warn(`Enter a level above ${currentLevel}.`);
      return;
    }

    return this.upgradeStepByStep(targetLevel);
  }

  /** Buy each level in turn up to a target, stopping at the first refusal */
  async upgradeStepByStep(targetLevel) {
    const startLevel = Number(this.getUserDetails()["currentLevel"]) || 1;

    this.logger.info(`Upgrading from level ${startLevel} to ${targetLevel}...`);

    for (let level = startLevel + 1; level <= targetLevel; level++) {
      if (this.signal.aborted) break;

      const { status } = await this.upgradeToLevel(level);

      if (!status) {
        this.logger.error(`Stopped at level ${level - 1}.`);
        return { status: false, level: level - 1 };
      }

      await this.utils.delayForSeconds(UPGRADE_STEP_DELAY_SECONDS, {
        signal: this.signal,
      });
    }

    const reached = Number(this.getUserDetails()["currentLevel"]) || startLevel;

    this.logger.success(`Reached level ${reached}.`);

    return { status: reached >= targetLevel, level: reached };
  }

  /** Report what an amount would mine, prompting for it */
  async estimateMining() {
    const input = await this.promptInput("How much TAC?");
    const trimmed = (input || "").trim();

    if (!trimmed) return;

    let assets;

    try {
      assets = new Decimal(trimmed);
    } catch {
      this.logger.error("Invalid TAC amount:", trimmed);
      return;
    }

    if (assets.isNegative()) {
      this.logger.error("TAC amount must be non-negative");
      return;
    }

    const level = await this.findLevelForAssets(assets);

    if (!level) {
      this.logger.warn("Could not read the miner store.");
      return;
    }

    /** The page falls back to this when a level has no explicit rate */
    const hourlyRate = new Decimal(
      level["miningRatePerHour"] ||
        new Decimal(0.05).mul(new Decimal(level["speedTh"] || 0.2).div(0.2)),
    );

    this.logger.newline();
    this.logger.keyValue("TAC Amount", this.formatAmount(assets));
    this.logger.keyValue("Reachable Level", level["level"]);
    this.logger.keyValue(
      "Level Requirement",
      this.formatAmount(level["requiredHoldingAtf"]),
    );
    this.logger.keyValue("Speed", `${level["speedTh"]} TH/s`);

    /** Holding releases a share into the pool every day */
    const releasePercent =
      Number(this.getSettings()["dailyHoldingReleasePercent"]) || 2;

    this.logger.keyValue(
      "Holding Yield/day",
      `${this.formatAmount(assets.mul(releasePercent).div(100))} TAC (${releasePercent}%)`,
    );

    this.logger.newline();
    this.logMiningRateBreakdown(hourlyRate.mul(24));
  }
}
