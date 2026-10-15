import BaseFarmer from "../lib/BaseFarmer.js";
import AdsGramClient from "../lib/ads/AdsGramClient.js";
import Decimal from "decimal.js";
import { Address, Cell } from "@ton/core";
import { buildTonProof } from "../lib/ton/proof.js";
import {
  createWallet,
  deriveMnemonicFromTelegramId,
  keyPairFromPhraseOrSecretKey,
} from "../lib/ton/wallet.js";

/** The game's backend, served from the page's own origin */
const API_URL = "https://diggo.linkpc.net/api";

/** The domain the page signs its TON proof for */
const TON_PROOF_DOMAIN = "diggo.linkpc.net";

/** TON mainnet, the only network the backend binds */
const TON_NETWORK = "-239";

/** The chests are read and opened in live mode, as players see them */
const CHEST_MODE = "live";

/** A few seconds past the confirm time, so a self-reported task is never confirmed early */
const SOCIAL_CONFIRM_MARGIN_SECONDS = 3;

/** How often, and how long, the ad task is polled for the provider's callback, as the page does */
const AD_CHECK_ATTEMPTS = 10;
const AD_CHECK_INTERVAL_SECONDS = 1.5;

/** The in-game balance the Auto withdraws, which the game pays out in TON */
const AUTO_CURRENCY = "DIGGO";

/** Withdrawal statuses, as the history reports them */
const PENDING_WITHDRAWAL_STATUSES = ["pending", "approved", "paying"];
const APPROVED_WITHDRAWAL_STATUSES = ["paid"];
const FLAGGED_WITHDRAWAL_STATUSES = ["cancelled", "rejected"];

/** How many history rows are read when looking for withdrawals */
const WITHDRAWAL_HISTORY_LIMIT = 20;

/** The level table the page levels the holding against */
const MINING_LEVELS_URL = "https://diggo.linkpc.net/mining-levels.json";

/** The page's smallest buy and deposit, when the state does not say */
const MINIMUM_BUY_TON = 0.5;
const MINIMUM_DEPOSIT_TON = 0.1;

/** TON kept aside for the wallet's own fees when paying an order */
const PAYMENT_GAS_TON = 0.05;

/** How often, and how long, an order or deposit is polled after paying */
const PAYMENT_CHECK_ATTEMPTS = 18;
const PAYMENT_CHECK_INTERVAL_SECONDS = 10;

/** Order statuses that end the wait */
const SETTLED_ORDER_STATUSES = ["paid", "cancelled", "expired"];

/** The tasks the page offers, in the order it lists them */
const TASK_TITLES = {
  checkin: "Daily Check-In",
  play: "Reach Level",
  telegram: "Join Community",
  community_react: "React in Community",
  x: "X",
  x_follow: "Follow on X",
  x_post: "Engage X Post",
  invite: "Invite Friends",
  ad: "Watch Ad",
};

export default class DiggoFarmer extends BaseFarmer {
  static id = "diggo";
  static title = "Diggo";
  static emoji = "⛏️";
  static host = "diggo.linkpc.net";
  static domains = ["diggo.linkpc.net", "api.adsgram.ai"];
  static telegramLink =
    "https://t.me/Diggominer_bot?startapp=ref_e70ec2a75dc027b74f24265b";
  static path = "/";
  static interval = "0 */4 * * *";
  static apiDelay = 500;
  static rating = 3;
  static published = true;

  /** DIGGO has no on-chain market yet and pays out TON, so the Auto has no jetton */
  static auto = {
    id: "diggo-auto",
    title: "Diggo Auto",
    token: "TON",
    currency: AUTO_CURRENCY,
    jettonAddress: null,
    storagePrefix: "diggo-auto",
    minWithdrawal: 800,
    connectWithPhrase: true,
  };

  /* --------------------------------------------------------------------- */
  /* Transport                                                             */
  /* --------------------------------------------------------------------- */

  /** Get Auth Headers */
  getAuthHeaders(data) {
    return { Authorization: `Bearer ${data["token"]}` };
  }

  /** Call the game's API, throwing its error code on a refusal as the page does */
  async callApi(method, path, data, idempotencyKey) {
    const response = await this.api.request({
      method,
      url: `${API_URL}${path}`,
      data,
      headers: idempotencyKey ? { "Idempotency-Key": idempotencyKey } : {},
      signal: this.signal,
      validateStatus: () => true,
    });

    const payload =
      response.data && typeof response.data === "object" ? response.data : {};

    if (response.status < 200 || response.status >= 300) {
      const error = new Error(payload["error"] || "internal_error");
      error.status = response.status;
      throw error;
    }

    if (payload["state"]) {
      this.state_data = payload["state"];
    }

    return payload;
  }

  /** Read from the game's API */
  getFromApi(path) {
    return this.callApi("get", path);
  }

  /** Act on the game's API */
  postToApi(path, data = {}, idempotencyKey) {
    return this.callApi("post", path, data, idempotencyKey);
  }

  /** Act on the game's API under a fresh idempotency key, as the page's money writes go out */
  writeToApi(path, data = {}) {
    return this.postToApi(path, data, this.utils.uuid());
  }

  /** The AdsGram client the ad task is watched with */
  get adsgram() {
    return (this._adsgram ||= new AdsGramClient(this.getAdClientOptions()));
  }

  /* --------------------------------------------------------------------- */
  /* Endpoints                                                             */
  /* --------------------------------------------------------------------- */

  /** Sign in with `initData`, which also registers the referrer */
  fetchAuth() {
    return this.postToApi("/auth/telegram", { initData: this.getInitData() });
  }

  /** Get Meta */
  fetchMeta() {
    return this.loadState();
  }

  /** The whole game state: balance, mining, tasks, friends, wallet */
  fetchState() {
    return this.getFromApi("/state");
  }

  /** Claim what the miner has produced, every eight hours */
  claimMining() {
    return this.writeToApi("/claims/mining");
  }

  /** Claim a task whose progress is complete */
  claimTask(taskId) {
    return this.writeToApi("/tasks/claim", { taskId });
  }

  /** Ask the backend to check the community membership */
  verifyTelegramTask() {
    return this.postToApi("/tasks/verify", { taskId: "telegram" });
  }

  /** Open a self-reported task, which returns the time it may be confirmed at */
  startSocialTask(taskId) {
    return this.postToApi("/tasks/social/start", { taskId });
  }

  /** Confirm a self-reported task once its wait is over */
  confirmSocialTask(taskId, attemptId) {
    return this.postToApi("/tasks/social/confirm", {
      taskId,
      attemptId,
      confirmed: true,
    });
  }

  /** Start an ad attempt, which AdsGram settles with the backend directly */
  startAd() {
    return this.postToApi("/adsgram/start");
  }

  /** Tell the backend the ad played to the end */
  completeAd(attemptId) {
    return this.postToApi("/adsgram/complete", { attemptId });
  }

  /** Give an ad attempt up */
  cancelAd(attemptId) {
    return this.postToApi("/adsgram/cancel", { attemptId });
  }

  /** Claim a day of the weekly streak */
  claimStreakDay(day) {
    return this.writeToApi("/streak/claim", { day });
  }

  /** Claim the commission the squad has mined */
  claimReferralCommission() {
    return this.writeToApi("/referrals/claim");
  }

  /** The holding chests and when each opens next */
  fetchChests() {
    return this.getFromApi(`/chests?mode=${CHEST_MODE}`);
  }

  /** Open a chest, once a day per chest */
  openChest(chestId) {
    return this.writeToApi("/chests/open", { chestId, mode: CHEST_MODE });
  }

  /** A fresh payload for the TON proof a wallet is bound with */
  fetchTonChallenge() {
    return this.postToApi("/ton/challenge");
  }

  /** Bind a wallet with its signed TON proof */
  bindWallet(data) {
    return this.postToApi("/ton/bind", data);
  }

  /** Price a withdrawal, which the request then refers to by its quote */
  quoteWithdrawal(amount, currency) {
    return this.postToApi("/withdrawals/quote", {
      amount: String(amount),
      currency,
    });
  }

  /** The account's recent withdrawals */
  fetchWithdrawals() {
    return this.getFromApi(
      `/withdrawals?limit=${WITHDRAWAL_HISTORY_LIMIT}&currency=all&status=all`,
    );
  }

  /** Price a buy (TON in) or a sell (DIGGO in) */
  quoteMarket(side, amount) {
    return this.postToApi("/market/quote", { side, amount: String(amount) });
  }

  /** Execute a quoted sell, which settles into the in-app TON balance */
  executeTrade(quoteId) {
    return this.writeToApi("/market/trade", { quoteId });
  }

  /** Open a TON payment order for a quoted buy */
  createTonOrder(quoteId, acceptedExecution) {
    return this.writeToApi("/ton/orders", { quoteId, acceptedExecution });
  }

  /** Read a TON payment order */
  fetchTonOrder(orderId) {
    return this.getFromApi(`/ton/order?id=${encodeURIComponent(orderId)}`);
  }

  /** Move a TON payment order to `submitted` once signed, or `rejected` */
  stageTonOrder(orderId, stage) {
    return this.postToApi("/ton/order-stage", { orderId, stage });
  }

  /** The account's TON deposits */
  fetchDeposits() {
    return this.getFromApi("/ton/deposits");
  }

  /** Open a TON deposit into the in-app balance */
  createDeposit(amount) {
    return this.writeToApi("/ton/deposits", { amount: String(amount) });
  }

  /** Read a TON deposit */
  fetchDeposit(orderId) {
    return this.getFromApi(`/ton/deposit?id=${encodeURIComponent(orderId)}`);
  }

  /** Move a TON deposit to `submitted` once signed, or `rejected` */
  stageDeposit(orderId, stage) {
    return this.postToApi("/ton/deposit-stage", { orderId, stage });
  }

  /** Have the backend re-read the bound wallet's TON or DIGGO */
  refreshWalletBalance(asset) {
    return this.postToApi("/ton/balance", { asset });
  }

  /** Request the quoted withdrawal */
  requestWithdrawal(quoteId) {
    return this.writeToApi("/withdrawals", { quoteId });
  }

  /* --------------------------------------------------------------------- */
  /* Session                                                               */
  /* --------------------------------------------------------------------- */

  /** Re-read the game state */
  async loadState() {
    await this.fetchState();
    return this.state_data;
  }

  /** Read the state once, for tools that run without a full pass */
  async ensureStateLoaded() {
    if (!this.state_data) {
      await this.setAuth();
      await this.loadState();
    }

    return this.state_data;
  }

  /** The backend's clock, which every timer in the state is measured against */
  getServerNow() {
    return Number(this.state_data?.["serverNow"]) || Date.now();
  }

  /** Get Referral Link */
  getReferralLink() {
    return (
      this.state_data?.["friends"]?.["inviteUrl"] ||
      this.constructor.telegramLink
    );
  }

  /** Get Referrals Count */
  getReferralsCount() {
    return this.state_data?.["friends"]?.["registeredCount"] || 0;
  }

  /* --------------------------------------------------------------------- */
  /* Process                                                               */
  /* --------------------------------------------------------------------- */

  /** Process Farmer */
  async process() {
    await this.loadState();

    this.logAccountInfo();

    await this.executeTask("Mining", () => this.claimPendingMining());
    await this.executeTask("Tasks", () => this.completeTasks());
    await this.executeTask("Streak", () => this.claimStreak());
    await this.executeTask("Squad", () => this.claimCommission());
    await this.executeTask("Chests", () => this.openChests());
    await this.executeTask("Withdraw", () => this.withdraw());
    await this.storeAutoSnapshot();
  }

  /** Log what the account looks like before the pass starts */
  logAccountInfo() {
    const state = this.state_data;
    const mining = state["mining"] || {};
    const wallet = state["wallet"] || {};

    this.logger.newline();
    this.logCurrentUser();
    this.logger.keyValue("Balance", this.formatAmount(state["balance"]));
    this.logger.keyValue("Holding", this.formatAmount(state["holding"]));
    this.logger.keyValue("Level", state["currentLevel"]);
    this.logger.keyValue("Speed", `${mining["ths"]} TH/s`, {
      valueStyle: this.logger.c.greenBright,
    });
    this.logger.keyValue("Daily Mining", this.formatAmount(mining["daily"]), {
      valueStyle: this.logger.c.greenBright,
    });
    this.logger.keyValue(
      "Pending Mining",
      this.formatAmount(mining["pending"]),
    );
    this.logger.keyValue(
      "Next Claim",
      mining["nextClaimAt"]
        ? new Date(mining["nextClaimAt"]).toLocaleString()
        : "Now",
    );
    this.logger.keyValue(
      "TON Available",
      this.formatAmount(state["market"]?.["tonAvailable"] || 0),
    );
    this.logger.keyValue(
      "Wallet",
      wallet["address"] ? this.getConnectedWalletAddress() : "Not connected",
      {
        valueStyle: wallet["address"]
          ? this.logger.c.greenBright
          : this.logger.c.yellowBright,
      },
    );
    this.logger.keyValue("Friends", this.getReferralsCount());
  }

  /* --------------------------------------------------------------------- */
  /* Mining                                                                */
  /* --------------------------------------------------------------------- */

  /** Claim what has been mined once the eight-hour wait is over */
  async claimPendingMining() {
    const mining = this.state_data["mining"] || {};
    const nextClaimAt = Number(mining["nextClaimAt"]) || 0;

    if (nextClaimAt > this.getServerNow()) {
      this.logger.info(
        `Next mining claim at ${new Date(nextClaimAt).toLocaleString()}.`,
      );
      return;
    }

    if (!(Number(mining["pendingUnits"]) > 0)) {
      this.logger.info("Nothing mined yet.");
      return;
    }

    const result = await this.claimMining();

    this.logger.success(
      `Claimed ${this.formatAmount(result["amount"])} DIGGO.`,
    );
  }

  /* --------------------------------------------------------------------- */
  /* Tasks                                                                 */
  /* --------------------------------------------------------------------- */

  /** A task's record as the latest state has it */
  getTask(taskId) {
    return this.state_data?.["tasks"]?.[taskId];
  }

  /** A readable name for a task */
  getTaskTitle(taskId) {
    return TASK_TITLES[taskId] || taskId;
  }

  /** Whether a task is open to work on, the way the page enables its button */
  isTaskOpen(record) {
    return (
      Boolean(record) &&
      record["enabled"] !== false &&
      !record["pending"] &&
      !record["claimed"]
    );
  }

  /** Whether a task only needs its claim */
  isTaskReady(taskId, record) {
    return taskId === "checkin" || record["progress"] >= record["total"];
  }

  /** Work every open task, claiming those whose progress is complete */
  async completeTasks() {
    const taskIds = Object.keys(this.state_data["tasks"] || {});

    for (const taskId of taskIds) {
      if (this.signal.aborted) break;
      if (!this.isTaskOpen(this.getTask(taskId))) continue;

      try {
        await this.completeTask(taskId);
      } catch (error) {
        this.logger.warn(
          `Skipped "${this.getTaskTitle(taskId)}": ${error.message}`,
        );
      }
    }
  }

  /** Complete one task the way the page's button does */
  async completeTask(taskId) {
    const record = this.getTask(taskId);

    if (this.isTaskReady(taskId, record)) {
      return this.claimReadyTask(taskId);
    }

    if (taskId === "telegram") {
      return this.completeTelegramTask(record);
    }

    if (record["verification"] === "self_reported") {
      return this.completeSocialTask(taskId, record);
    }

    if (taskId === "ad" && record["blockId"]) {
      return this.completeAdTask(record);
    }
  }

  /** Claim a task whose progress is complete */
  async claimReadyTask(taskId) {
    const result = await this.claimTask(taskId);

    if (result["amount"] > 0) {
      this.logger.success(
        `Claimed "${this.getTaskTitle(taskId)}" for ${this.formatAmount(result["amount"])} DIGGO.`,
      );
    } else {
      this.logger.info(`"${this.getTaskTitle(taskId)}" was already claimed.`);
    }
  }

  /** Join the community, have the backend check it, then claim */
  async completeTelegramTask(record) {
    if (!this.validateTelegramTask(record["url"])) return;

    await this.tryToJoinTelegramLink(record["url"]);
    await this.verifyTelegramTask();

    const updated = this.getTask("telegram");

    if (this.isTaskOpen(updated) && this.isTaskReady("telegram", updated)) {
      await this.claimReadyTask("telegram");
    }
  }

  /** Open a self-reported task, wait out its confirm time, confirm it, then claim */
  async completeSocialTask(taskId, record) {
    if (!this.validateTelegramTask(record["url"])) return;

    await this.tryToJoinTelegramLink(record["url"]);

    const { attempt } = await this.startSocialTask(taskId);
    const waitMs = Math.max(
      0,
      Number(attempt["confirmAt"]) - this.getServerNow(),
    );

    await this.utils.delayForSeconds(
      waitMs / 1000 + SOCIAL_CONFIRM_MARGIN_SECONDS,
      { signal: this.signal },
    );

    await this.confirmSocialTask(taskId, attempt["attemptId"]);
    await this.claimReadyTask(taskId);
  }

  /** Watch the rewarded ad, then wait for AdsGram's callback to mark it before claiming */
  async completeAdTask(record) {
    const start = await this.startAd();

    if (start["ready"]) {
      return this.claimReadyTask("ad");
    }

    if (!start["waiting"]) {
      try {
        await this.adsgram.watch(record["blockId"]);
      } catch (error) {
        await this.cancelAd(start["attemptId"]).catch(() => null);
        throw error;
      }

      await this.completeAd(start["attemptId"]);
    }

    for (let attempt = 0; attempt < AD_CHECK_ATTEMPTS; attempt++) {
      await this.utils.delayForSeconds(AD_CHECK_INTERVAL_SECONDS, {
        signal: this.signal,
      });
      await this.loadState();

      const current = this.getTask("ad");

      if (current?.["period"] !== record["period"] || current["claimed"]) {
        return;
      }

      if (current["progress"] >= current["total"]) {
        return this.claimReadyTask("ad");
      }
    }

    this.logger.warn("The ad was not credited yet.");
  }

  /* --------------------------------------------------------------------- */
  /* Streak                                                                */
  /* --------------------------------------------------------------------- */

  /** Claim the streak day whose tasks are done */
  async claimStreak() {
    const day = (this.state_data["dayRewards"] || []).find(
      (item) =>
        item["status"] === "available" &&
        item["completedTasks"] >= item["requiredTasks"],
    );

    if (!day) {
      this.logger.info("No streak day to claim.");
      return;
    }

    const result = await this.claimStreakDay(day["day"]);

    this.logger.success(
      `Claimed streak day ${day["day"]} for ${this.formatAmount(result["amount"] ?? day["diggo"])} DIGGO.`,
    );
  }

  /* --------------------------------------------------------------------- */
  /* Squad                                                                 */
  /* --------------------------------------------------------------------- */

  /** Claim the commission the squad has mined */
  async claimCommission() {
    const commission = this.state_data["friends"]?.["commission"] || {};

    if (!(Number(commission["pendingUnits"]) > 0)) {
      this.logger.info("No commission to claim.");
      return;
    }

    const result = await this.claimReferralCommission();

    this.logger.success(
      `Claimed ${this.formatAmount(result["amount"] ?? commission["pending"])} DIGGO in commission.`,
    );
  }

  /* --------------------------------------------------------------------- */
  /* Chests                                                                */
  /* --------------------------------------------------------------------- */

  /** Open every chest the holding unlocks and whose day has come round */
  async openChests() {
    const { chests } = await this.fetchChests();
    const now = Number(chests["serverNow"]) || this.getServerNow();
    const openable = (chests["chests"] || []).filter(
      (chest) =>
        chest["unlocked"] &&
        chest["funded"] &&
        (!chest["nextOpenAt"] || chest["nextOpenAt"] <= now),
    );

    if (!openable.length) {
      this.logger.info("No chest to open.");
      return;
    }

    for (const chest of openable) {
      if (this.signal.aborted) break;

      try {
        const { opening } = await this.openChest(chest["id"]);
        const reward = opening?.["reward"] || {};
        const amount =
          reward["amount"] ??
          (reward["asset"] === "TON"
            ? Number(reward["amountUnits"]) / 1e9
            : reward["amountUnits"]);

        this.logger.success(
          `Opened the ${chest["id"]} chest: ${amount ?? "?"} ${reward["asset"] || ""} (${reward["rarity"] || "?"}).`,
        );
      } catch (error) {
        this.logger.warn(
          `Failed to open the ${chest["id"]} chest: ${error.message}`,
        );
      }
    }
  }

  /* --------------------------------------------------------------------- */
  /* Wallet                                                                */
  /* --------------------------------------------------------------------- */

  /** The bound address in its friendly, non-bounceable form */
  getConnectedWalletAddress() {
    const address = this.state_data?.["wallet"]?.["address"];

    return address ? this.utils.toFriendlyAddress(address) : null;
  }

  /** Bind the wallet a key pair controls, signing the TON proof the game asks for */
  async connectSignedWallet(keyPair, version) {
    const wallet = createWallet(keyPair.publicKey, Number(version));
    const connected = this.getConnectedWalletAddress();

    /** The game binds a wallet for good, so a bound one is only checked */
    if (connected) {
      return this.utils.isSameTonAddress(connected, wallet.address.toString())
        ? { status: true, message: "Wallet already bound" }
        : {
            status: false,
            message: `Diggo is bound to ${connected} for good`,
          };
    }

    const { payload } = await this.fetchTonChallenge();
    const { address, walletStateInit, proof } = await buildTonProof({
      wallet,
      secretKey: keyPair.secretKey,
      domain: TON_PROOF_DOMAIN,
      payload,
    });

    try {
      await this.bindWallet({
        address,
        network: TON_NETWORK,
        publicKey: Buffer.from(keyPair.publicKey).toString("hex"),
        walletStateInit,
        proof,
      });
    } catch (error) {
      return { status: false, message: error.message };
    }

    this.logger.success(`Wallet bound: ${this.getConnectedWalletAddress()}`);

    return { status: true };
  }

  /** Accept an address without its phrase only when it is the one already bound */
  async connectWalletAddress(address) {
    const connected = this.getConnectedWalletAddress();

    if (connected && this.utils.isSameTonAddress(connected, address)) {
      return { status: true };
    }

    return {
      status: false,
      message: connected
        ? `Diggo is bound to ${connected} for good`
        : "Diggo needs the wallet phrase to sign a TON proof",
    };
  }

  /** Bind a wallet from its phrase, since the game wants a signed TON proof */
  async connectAutoWallet({ phrase, address, version, refresh = false }) {
    if (!phrase) {
      return super.connectAutoWallet({ address, version, refresh });
    }

    try {
      await this.ensureStateLoaded();

      const keyPair = await keyPairFromPhraseOrSecretKey(phrase);
      const { status, message } = await this.connectSignedWallet(
        keyPair,
        version,
      );

      if (!status) return { status: false, message };

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

  /* --------------------------------------------------------------------- */
  /* Withdrawal                                                            */
  /* --------------------------------------------------------------------- */

  /** The withdrawal rules for a currency, as the state publishes them */
  getWithdrawalRule(currency) {
    return this.state_data?.["withdrawals"]?.["sources"]?.[currency] || {};
  }

  /** The balance a currency is withdrawn from */
  getWithdrawableBalance(currency) {
    return currency === "TON"
      ? this.state_data["market"]?.["tonAvailable"] || 0
      : this.state_data["balance"] || 0;
  }

  /** The game publishes its DIGGO minimum in the state */
  getMinimumWithdrawal() {
    return (
      Number(this.getWithdrawalRule(AUTO_CURRENCY)["minimum"]) ||
      super.getMinimumWithdrawal()
    );
  }

  /** The account's recent withdrawals, newest first */
  async getWithdrawals() {
    const { withdrawals } = await this.fetchWithdrawals();

    return withdrawals || [];
  }

  /** Whether the game still owes this account a payout */
  async hasPendingWithdrawal() {
    await this.ensureStateLoaded();

    const withdrawals = await this.getWithdrawals();

    return withdrawals.some((item) =>
      PENDING_WITHDRAWAL_STATUSES.includes(item["status"]),
    );
  }

  /** The account's own withdrawal queue */
  async getAutoWithdrawals() {
    await this.ensureStateLoaded();

    const withdrawals = await this.getWithdrawals();
    const byStatus = (statuses) =>
      withdrawals.filter((item) => statuses.includes(item["status"]));

    return {
      pending: byStatus(PENDING_WITHDRAWAL_STATUSES),
      approved: byStatus(APPROVED_WITHDRAWAL_STATUSES),
      flagged: byStatus(FLAGGED_WITHDRAWAL_STATUSES),
    };
  }

  /** Quote a withdrawal, log what it pays, then request it */
  async placeQuotedWithdrawal(amount, currency) {
    const { quote } = await this.quoteWithdrawal(amount, currency);

    this.logger.newline();
    this.logger.keyValue("Amount", `${quote["amount"]} ${currency}`);
    this.logger.keyValue("Fee", quote["fee"] ?? "-");
    this.logger.keyValue("You Get", `${quote["ton"] ?? "?"} TON`);

    await this.requestWithdrawal(quote["id"]);

    this.logger.success(`Requested ${quote["amount"]} ${currency}.`);

    return quote;
  }

  /** Withdraw DIGGO, which the game pays out in TON */
  async placeWithdrawal({ max, difference }) {
    await this.ensureStateLoaded();

    const destinationAddress = this.getConnectedWalletAddress();

    if (!destinationAddress) {
      return this.skipWithdrawal("No wallet connected!");
    }

    if (!this.state_data["withdrawals"]?.["enabled"]) {
      return this.skipWithdrawal("Withdrawals are disabled!", { log: "warn" });
    }

    if (await this.hasPendingWithdrawal()) {
      return this.skipWithdrawal("A withdrawal is already pending!", {
        log: "warn",
      });
    }

    const balance = new Decimal(this.getWithdrawableBalance(AUTO_CURRENCY));
    const minimum = this.getMinimumWithdrawal();
    const lowBalance = this.skipLowBalance(balance, minimum);

    if (lowBalance) return lowBalance;

    const amount = this.pickWithdrawalAmount({
      balance,
      minimum,
      max,
      difference,
    });

    try {
      const quote = await this.placeQuotedWithdrawal(
        amount.toString(),
        AUTO_CURRENCY,
      );

      await this.notifyWithdrawal([
        ["Initial Balance", balance.toString()],
        ["Requested", amount.toString()],
        ["To be received", `${quote["ton"] ?? "?"} TON`],
        ["Destination", `<code>${destinationAddress}</code>`],
      ]);

      return { status: true, skipped: false, amount: amount.toString() };
    } catch (error) {
      this.logger.error("Failed to request withdrawal:", error.message);

      return {
        status: false,
        skipped: false,
        message: error.message,
        amount: amount.toString(),
      };
    }
  }

  /** Log the withdrawal rules and the recent requests */
  async logWithdrawalStatus() {
    await this.ensureStateLoaded();
    await this.loadState();

    const withdrawals = this.state_data["withdrawals"] || {};

    this.logger.newline();
    this.logger.keyValue("Enabled", withdrawals["enabled"] ? "Yes" : "No");
    this.logger.keyValue("Paid In", withdrawals["currency"]);

    for (const [currency, rule] of Object.entries(
      withdrawals["sources"] || {},
    )) {
      this.logger.keyValue(
        currency,
        `${this.formatAmount(this.getWithdrawableBalance(currency))} (min ${rule["minimum"]}, fee ${rule["fee"]})`,
      );
    }

    for (const item of await this.getWithdrawals()) {
      this.logger.keyValue(
        new Date(item["createdAt"] || Date.now()).toLocaleString(),
        `${item["amount"]} ${item["currency"]} (${item["status"]})`,
      );
    }
  }

  /* --------------------------------------------------------------------- */
  /* Market                                                                */
  /* --------------------------------------------------------------------- */

  /** The smallest buy the market takes, in TON */
  getMinimumBuyTon() {
    return Number(this.state_data?.["price"]?.["minBuyTon"]) || MINIMUM_BUY_TON;
  }

  /** The page's level table, fetched once per run */
  async readMiningLevels() {
    if (this.miningLevels) return this.miningLevels;

    const { data } = await this.api.get(MINING_LEVELS_URL, {
      signal: this.signal,
    });

    return (this.miningLevels = (data?.["levels"] || []).map((row) => ({
      level: row["level"],
      holding: row["holdingUnits"] / 1e6,
      ths: row["thsCenti"] / 100,
      daily: row["dailyUnits"] / 1e6,
    })));
  }

  /** The highest level a holding reaches */
  findLevelForHolding(levels, holding) {
    return levels.reduce(
      (best, row) => (holding >= row.holding ? row : best),
      levels[0],
    );
  }

  /** Send the server's TonConnect transaction from the bound wallet, checking it can be afforded */
  async payTonTransaction(signer, transaction) {
    const messages = transaction?.["messages"] || [];

    if (!messages.length) {
      throw new Error("The order carries no transaction");
    }

    const total = messages.reduce(
      (sum, message) => sum + BigInt(message["amount"]),
      0n,
    );
    const totalTon = new Decimal(total.toString()).div(1e9);
    const balance = await signer.wallet
      .getBalance({ signal: this.signal })
      .catch(() => new Decimal(0));

    if (balance.lessThan(totalTon.plus(PAYMENT_GAS_TON))) {
      throw new Error(
        `Needs ${totalTon.plus(PAYMENT_GAS_TON)} TON, the wallet holds ${balance}`,
      );
    }

    const seqno = await signer.wallet.send(
      messages.map((message) => ({
        to: Address.parse(message["address"]),
        value: BigInt(message["amount"]),
        body: message["payload"]
          ? Cell.fromBase64(message["payload"])
          : undefined,
      })),
    );

    await signer.wallet.waitForConfirmation(seqno);

    return totalTon;
  }

  /** Buy DIGGO with TON from the bound wallet, which raises the holding and with it the level */
  async buyDiggo(signer, tonAmount) {
    const { quote } = await this.quoteMarket("buy", tonAmount);

    this.logger.newline();
    this.logger.keyValue("Pay", `${quote["payAmount"]} TON`);
    this.logger.keyValue("Fee", `${quote["fee"]} TON`);
    this.logger.keyValue(
      quote["estimated"] ? "Est. Receive" : "Receive",
      `${this.formatAmount(quote["getAmount"])} DIGGO`,
    );
    this.logger.keyValue("Price Impact", `${quote["priceImpact"]}%`);

    const { order } = await this.createTonOrder(
      quote["id"],
      quote["execution"] || "protected",
    );

    if (order["status"] === "pending") {
      try {
        await this.payTonTransaction(signer, order["transaction"]);
      } catch (error) {
        await this.stageTonOrder(order["id"], "rejected").catch(() => null);
        throw error;
      }

      await this.stageTonOrder(order["id"], "submitted");
      this.logger.info("Payment sent, waiting for the game to confirm it...");
    }

    const settled = await this.waitForPayment(
      () => this.fetchTonOrder(order["id"]).then((result) => result["order"]),
      order,
    );

    if (settled["status"] === "paid") {
      await this.loadState();
      this.logger.success(
        `Bought DIGGO, holding ${this.formatAmount(this.state_data["holding"])} at level ${this.state_data["currentLevel"]}.`,
      );
    }

    return settled;
  }

  /** Sell DIGGO into the in-app TON balance */
  async sellDiggo(amount) {
    const { quote } = await this.quoteMarket("sell", amount);

    this.logger.newline();
    this.logger.keyValue("Sell", `${quote["payAmount"]} DIGGO`);
    this.logger.keyValue("Receive", `${quote["getAmount"]} TON`);
    this.logger.keyValue("Min Received", `${quote["minReceived"]} TON`);

    const { trade } = await this.executeTrade(quote["id"]);

    this.logger.success(
      `Sold ${trade?.["diggo"] ?? amount} DIGGO for ${trade?.["ton"] ?? quote["getAmount"]} TON.`,
    );
  }

  /** Deposit TON from the bound wallet into the in-app TON balance */
  async depositTon(signer, tonAmount) {
    const { deposit } = await this.createDeposit(tonAmount);

    if (deposit["status"] === "pending") {
      const { deposit: invoice } = await this.fetchDeposit(deposit["id"]);

      try {
        await this.payTonTransaction(signer, invoice["transaction"]);
      } catch (error) {
        await this.stageDeposit(deposit["id"], "rejected").catch(() => null);
        throw error;
      }

      await this.stageDeposit(deposit["id"], "submitted");
      this.logger.info("Deposit sent, waiting for the game to confirm it...");
    }

    return this.waitForPayment(async () => {
      const { deposits } = await this.fetchDeposits();

      return (
        (deposits || []).find((item) => item["id"] === deposit["id"]) || deposit
      );
    }, deposit);
  }

  /** Poll an order or deposit until it settles, logging how it ended */
  async waitForPayment(read, initial) {
    let current = initial;

    for (let attempt = 0; attempt < PAYMENT_CHECK_ATTEMPTS; attempt++) {
      if (SETTLED_ORDER_STATUSES.includes(current["status"])) break;

      await this.utils.delayForSeconds(PAYMENT_CHECK_INTERVAL_SECONDS, {
        signal: this.signal,
      });

      current = await read();
    }

    if (current["status"] === "paid") {
      this.logger.success("Payment confirmed.");
    } else {
      this.logger.warn(
        `Payment is ${current["status"]}${current["reason"] ? ` (${current["reason"]})` : ""}.`,
      );
    }

    return current;
  }

  /* --------------------------------------------------------------------- */
  /* Signing wallet                                                        */
  /* --------------------------------------------------------------------- */

  /** Prompt for the bound wallet's phrase, typed or derived from the Telegram ID, and check it is the bound one */
  async promptSigner() {
    const bound = this.getConnectedWalletAddress();

    if (!bound) {
      this.logger.warn("Connect a wallet first.");
      return null;
    }

    const source = await this.promptInput({
      type: "select",
      text: "Sign with:",
      options: [
        { value: "phrase", label: "Wallet Phrase" },
        { value: "derived", label: "Derived Wallet" },
      ],
    });

    let phrase;

    if (source === "derived") {
      const passphrase = (
        (await this.promptInput(
          "Enter the passphrase (leave empty for none):",
        )) || ""
      ).trim();

      phrase = (
        await deriveMnemonicFromTelegramId(this.getUserId(), passphrase)
      ).join(" ");
    } else if (source === "phrase") {
      phrase = ((await this.promptInput("Enter the wallet phrase:")) || "")
        .trim()
        .split(/\s+/)
        .join(" ");
    }

    if (!phrase) {
      this.logger.warn("No phrase provided.");
      return null;
    }

    const version = await this.promptInput({
      type: "select",
      text: "Select wallet version:",
      options: [
        { value: "5", label: "Wallet V5R1" },
        { value: "4", label: "Wallet V4" },
      ],
    });

    if (!version) {
      this.logger.warn("No wallet version selected.");
      return null;
    }

    const wallet = this.utils.wallet.createTonWallet({
      phrase,
      version: Number(version),
    });
    const address = await wallet.getAddress();

    if (!this.utils.isSameTonAddress(bound, address)) {
      this.logger.error("The phrase does not match the bound wallet:", bound);
      return null;
    }

    return { wallet, address };
  }

  /** Prompt for a positive amount, returning it as a string */
  async promptAmount(text) {
    const input = ((await this.promptInput(text)) || "").trim();

    if (!input) {
      this.logger.warn("No amount provided.");
      return null;
    }

    try {
      const amount = new Decimal(input);

      if (amount.lessThanOrEqualTo(0)) throw new Error();

      return amount.toString();
    } catch {
      this.logger.error("Invalid amount:", input);
      return null;
    }
  }

  /* --------------------------------------------------------------------- */
  /* Auto adapter                                                          */
  /* --------------------------------------------------------------------- */

  /** Claim what is pending so the summary reflects the current balance */
  async refreshAutoState() {
    await this.ensureStateLoaded();
    await this.claimPendingMining();
  }

  /** Re-read the state for a fresh summary */
  async refreshAutoSummary() {
    await this.loadState();

    return this.getAutoSummary();
  }

  /** Put the account to work and report it afresh */
  async startAutoMining() {
    await this.ensureStateLoaded();
    await this.claimPendingMining();
    await this.claimStreak();
    await this.claimCommission();

    return this.refreshAutoSummary();
  }

  /** Normalized account snapshot, with no holding since boosts move TON the game does not level on */
  getAutoSummary() {
    const state = this.state_data || {};
    const mining = state["mining"] || {};
    const address = this.getConnectedWalletAddress();
    const nextClaimAt = Number(mining["nextClaimAt"]) || 0;

    return {
      level: Number(state["currentLevel"]) || 0,
      holding: null,
      balance: state["balance"],
      minWithdrawal: this.getMinimumWithdrawal(),
      verified: true,
      mining: {
        startedAt: Math.floor(
          (Number(mining["lastAccrualAt"]) || Date.now()) / 1000,
        ),
        freezesAt: Math.floor(nextClaimAt / 1000),
        frozen: nextClaimAt > 0 && this.getServerNow() >= nextClaimAt,
      },
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
            id: "refresh-holding",
            icon: "reconnect",
            title: "Refresh Holding",
            action: this.refreshHoldingInteractive.bind(this),
            dispatch: false,
          },
          {
            id: "deposit-ton",
            icon: "import",
            title: "Deposit TON",
            action: this.depositTonInteractive.bind(this),
            dispatch: false,
          },
        ],
      },
      {
        name: "Boost",
        list: [
          {
            id: "buy-diggo",
            icon: "import",
            title: "Buy DIGGO",
            action: this.buyDiggoInteractive.bind(this),
            dispatch: false,
          },
          {
            id: "estimate-boost",
            icon: "search",
            title: "Estimate Boost",
            action: this.estimateBoostInteractive.bind(this),
            dispatch: false,
          },
          {
            id: "sell-diggo",
            icon: "withdraw",
            title: "Sell DIGGO",
            action: this.sellDiggoInteractive.bind(this),
            dispatch: false,
          },
          {
            id: "market-price",
            icon: "search",
            title: "Market Price",
            action: this.marketPriceInteractive.bind(this),
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
            id: "complete-tasks",
            icon: "check",
            title: "Complete Tasks",
            action: this.completeTasksInteractive.bind(this),
            dispatch: false,
          },
          {
            id: "open-chests",
            icon: "key",
            title: "Open Chests",
            action: this.openChestsInteractive.bind(this),
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
            action: this.withdrawDiggoInteractive.bind(this),
            dispatch: false,
          },
        ],
      },
    ];
  }

  /** Have the backend re-read the bound wallet's DIGGO and TON */
  async refreshHoldingInteractive() {
    await this.ensureStateLoaded();

    if (!this.getConnectedWalletAddress()) {
      this.logger.warn("Connect a wallet first.");
      return;
    }

    for (const asset of ["diggo", "ton"]) {
      await this.refreshWalletBalance(asset).catch((error) =>
        this.logger.warn(`Failed to refresh ${asset}:`, error.message),
      );
    }

    const holdings = this.state_data["wallet"]?.["holdings"] || {};

    this.logger.newline();
    this.logger.keyValue(
      "Holding",
      this.formatAmount(this.state_data["holding"]),
    );
    this.logger.keyValue("Level", this.state_data["currentLevel"]);
    this.logger.keyValue("Wallet DIGGO", holdings["diggo"]?.["amount"] ?? "-");
    this.logger.keyValue("Wallet TON", holdings["ton"]?.["amount"] ?? "-");
  }

  /** Buy DIGGO with TON from the bound wallet, prompting for the amount and the signing phrase */
  async buyDiggoInteractive() {
    await this.ensureStateLoaded();
    await this.loadState();

    const minimum = this.getMinimumBuyTon();
    const amount = await this.promptAmount(
      `How much TON to spend? (minimum ${minimum})`,
    );

    if (!amount) return;

    if (new Decimal(amount).lessThan(minimum)) {
      this.logger.error(`The market takes at least ${minimum} TON.`);
      return;
    }

    const signer = await this.promptSigner();

    if (!signer) return;

    try {
      await this.buyDiggo(signer, amount);
    } catch (error) {
      this.logger.error("Failed to buy DIGGO:", error.message);
    }
  }

  /** Show what a TON buy would bring the account to, without buying */
  async estimateBoostInteractive() {
    await this.ensureStateLoaded();
    await this.loadState();

    const amount = await this.promptAmount("How much TON?");

    if (!amount) return;

    try {
      const { quote } = await this.quoteMarket("buy", amount);
      const levels = await this.readMiningLevels();
      const current = this.findLevelForHolding(
        levels,
        Number(this.state_data["holding"]) || 0,
      );
      const target = this.findLevelForHolding(
        levels,
        (Number(this.state_data["holding"]) || 0) + Number(quote["getAmount"]),
      );

      this.logger.newline();
      this.logger.keyValue(
        "Receive",
        `${this.formatAmount(quote["getAmount"])} DIGGO`,
      );
      this.logger.keyValue("Level", `${current.level} → ${target.level}`);
      this.logger.keyValue("Speed", `${current.ths} → ${target.ths} TH/s`);
      this.logger.newline();
      this.logMiningRateBreakdown(new Decimal(target.daily));
    } catch (error) {
      this.logger.error("Failed to estimate:", error.message);
    }
  }

  /** Sell DIGGO into the in-app TON balance, prompting for the amount */
  async sellDiggoInteractive() {
    await this.ensureStateLoaded();
    await this.loadState();

    if (!this.state_data["price"]?.["sellEnabled"]) {
      this.logger.warn("Selling is disabled right now.");
      return;
    }

    const amount = await this.promptAmount(
      `How much DIGGO? (balance ${this.formatAmount(this.state_data["balance"])})`,
    );

    if (!amount) return;

    try {
      await this.sellDiggo(amount);
    } catch (error) {
      this.logger.error("Failed to sell DIGGO:", error.message);
    }
  }

  /** Log the market's prices and the account's balances */
  async marketPriceInteractive() {
    await this.ensureStateLoaded();
    await this.loadState();

    const price = this.state_data["price"] || {};

    this.logger.newline();
    this.logger.keyValue("DIGGO", `$${price["tokenUsd"]}`);
    this.logger.keyValue("TON", `$${price["tonUsd"]}`);
    this.logger.keyValue("DIGGO per TON", this.formatAmount(price["rate"]));
    this.logger.keyValue("Min Buy", `${this.getMinimumBuyTon()} TON`);
    this.logger.keyValue("Buy Fee", `${price["buyFeeTon"]} TON`);
    this.logger.keyValue("Sell", price["sellEnabled"] ? "Enabled" : "Disabled");
    this.logger.keyValue(
      "Balance",
      `${this.formatAmount(this.state_data["balance"])} DIGGO`,
    );
    this.logger.keyValue(
      "In-app TON",
      this.formatAmount(this.state_data["market"]?.["tonAvailable"] || 0),
    );
  }

  /** Deposit TON from the bound wallet, prompting for the amount and the signing phrase */
  async depositTonInteractive() {
    await this.ensureStateLoaded();

    const amount = await this.promptAmount(
      `How much TON to deposit? (minimum ${MINIMUM_DEPOSIT_TON})`,
    );

    if (!amount) return;

    if (new Decimal(amount).lessThan(MINIMUM_DEPOSIT_TON)) {
      this.logger.error(`Deposits start at ${MINIMUM_DEPOSIT_TON} TON.`);
      return;
    }

    const signer = await this.promptSigner();

    if (!signer) return;

    try {
      await this.depositTon(signer, amount);
      await this.loadState();
    } catch (error) {
      this.logger.error("Failed to deposit:", error.message);
    }
  }

  /** Claim mining on demand */
  async claimMiningInteractive() {
    await this.ensureStateLoaded();
    await this.loadState();
    await this.claimPendingMining();
  }

  /** Work the tasks on demand */
  async completeTasksInteractive() {
    await this.ensureStateLoaded();
    await this.loadState();
    await this.completeTasks();
    await this.claimStreak();
  }

  /** Open the chests on demand */
  async openChestsInteractive() {
    await this.ensureStateLoaded();
    await this.openChests();
  }

  /** Bind a wallet, prompting for the phrase that signs its TON proof */
  async connectWalletInteractive() {
    const input = await this.promptInput(
      "Enter your TON Wallet Phrase / Secret Key (hex):",
    );

    if (!(input || "").trim()) {
      this.logger.warn("No phrase provided.");
      return;
    }

    const version = await this.promptInput({
      type: "select",
      text: "Select wallet version:",
      options: [
        { value: "5", label: "Wallet V5R1" },
        { value: "4", label: "Wallet V4" },
      ],
    });

    if (!version) {
      this.logger.warn("No wallet version selected.");
      return;
    }

    const { status, message } = await this.connectAutoWallet({
      phrase: input,
      version,
    });

    if (!status) {
      this.logger.error("Failed to bind the wallet:", message);
    }
  }

  /** The game has no unbind, so a bound wallet stays for good */
  async disconnectWalletInteractive() {
    await this.ensureStateLoaded();

    const address = this.getConnectedWalletAddress();

    if (!address) {
      this.logger.info("No wallet connected.");
      return;
    }

    this.logger.warn(`Diggo binds ${address} for good, it cannot be unbound.`);
  }

  /** Withdraw, prompting for the currency and amount */
  async withdrawDiggoInteractive() {
    await this.logWithdrawalStatus();

    if (!this.getConnectedWalletAddress()) {
      this.logger.warn("Connect a wallet first.");
      return;
    }

    const currency = await this.promptInput({
      type: "select",
      text: "Withdraw from:",
      options: [
        { value: "DIGGO", label: "DIGGO" },
        { value: "TON", label: "TON" },
      ],
    });

    if (!currency) return;

    const rule = this.getWithdrawalRule(currency);
    const input = await this.promptInput(
      `How much ${currency}? (minimum ${rule["minimum"] ?? "?"})`,
    );
    const trimmed = (input || "").trim();

    if (!trimmed) {
      this.logger.warn("No amount provided.");
      return;
    }

    let amount;

    try {
      amount = new Decimal(trimmed);
    } catch {
      this.logger.error("Invalid amount:", trimmed);
      return;
    }

    try {
      await this.placeQuotedWithdrawal(amount.toString(), currency);
    } catch (error) {
      this.logger.error("Failed to withdraw:", error.message);
    }
  }
}
