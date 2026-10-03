import BaseFarmer from "../lib/BaseFarmer.js";
import Decimal from "decimal.js";
import { Cell } from "@ton/core";
import {
  MAXIMUM_MINER_LEVEL,
  findMinerLevelForHolding,
  getMinerDailyOutput,
  getMinerRequiredHolding,
  getMinerSpeed,
} from "../lib/auto/minerCurve.js";

/** The drop's backend, which the mini app talks to for everything */
const API_URL = "https://server.victors.company/api";

/** The VIC jetton the drop pays out and levels against */
const VIC_JETTON_ADDRESS = "EQClb4h8Wnqx-X_sKMFExqxcQusCktlMHxYZ2M80A_WnnFUe";

/** Cloudflare Turnstile guarding the login, as the loading screen renders it */
const TURNSTILE_SITE_KEY = "0x4AAAAAAFD0KRgPRFVwDvgn";
const TURNSTILE_PAGE_URL = "https://app.victors.company/";

/** The error code the backend answers with once the human pass is missing or stale */
const HUMAN_REQUIRED_CODE = "HUMAN_REQUIRED";

/** A stored pass this close to expiry is replaced rather than risked mid-run */
const HUMAN_PASS_EXPIRY_MARGIN_SECONDS = 10 * 60;

/** Below this the drop refuses a mining claim */
const MINIMUM_CLAIMABLE_MINING = 0.1;

/** How long the page leaves a link task open before it lets the claim through */
const TASK_DWELL_SECONDS = 10;

/** The drop's withdrawal rules, used until the live config has been read */
const MINIMUM_WITHDRAWAL = 1000;
const WITHDRAWAL_FEE = 70;

/** Safety margin above the drop's minimum, so a scheduled run does not withdraw the instant it crosses it */
const WITHDRAWAL_BUFFER = 200;

/** Withdrawal statuses, as the transaction history reports them */
const PENDING_WITHDRAWAL_STATUSES = ["Pending", "Approved", "Processing"];
const APPROVED_WITHDRAWAL_STATUSES = ["Completed", "Paid"];
const FLAGGED_WITHDRAWAL_STATUSES = ["Rejected", "Failed", "Cancelled"];

/** How many history rows are read when looking for withdrawals */
const WITHDRAWAL_HISTORY_LIMIT = 20;

/** TON kept aside for the verification transfer's fees */
const VERIFICATION_GAS_TON = 0.02;

/** How often, and how long, the verification is polled after paying */
const VERIFICATION_CHECK_ATTEMPTS = 6;
const VERIFICATION_CHECK_INTERVAL_SECONDS = 6;

/** A pending verification paid this long ago is assumed lost and paid again */
const VERIFICATION_RETRY_HOURS = 6;

export default class VictorsCompanyFarmer extends BaseFarmer {
  static id = "victors";
  static title = "Victor's Company";
  static emoji = "👷";
  static host = "app.victors.company";
  static domains = ["app.victors.company", "server.victors.company"];
  static telegramLink =
    "https://t.me/VictorsCompanybot/app?startapp=ref_6B6CAC6747";
  static path = "/";
  static interval = "0 */6 * * *";
  static apiDelay = 500;
  static rating = 5;
  static published = true;

  static auto = {
    id: "victors-auto",
    title: "Victor's Auto",
    token: "VIC",
    jettonAddress: VIC_JETTON_ADDRESS,
    storagePrefix: "victors-auto",
    minWithdrawal: MINIMUM_WITHDRAWAL,
    verifiable: true,
  };

  /* --------------------------------------------------------------------- */
  /* Transport                                                             */
  /* --------------------------------------------------------------------- */

  /** Carry `initData` and the human pass on every call the drop's own API receives, and on no others */
  configureApi() {
    const interceptor = this.api.interceptors.request.use((config) => {
      if (String(config.url || "").startsWith(API_URL)) {
        config.headers["Authorization"] = `tma ${this.getInitData()}`;

        if (this.humanPass) {
          config.headers["x-human-pass"] = this.humanPass;
        }
      }

      return config;
    });

    return () => {
      this.api.interceptors.request.eject(interceptor);
    };
  }

  /** Call the drop's API, re-passing the human check once if the backend asks for it */
  async callApi(method, path, data, { retryHuman = true } = {}) {
    const response = await this.api.request({
      method,
      url: `${API_URL}${path}`,
      data: method === "post" ? data || {} : undefined,
      signal: this.signal,
      validateStatus: () => true,
    });

    const payload = response.data || {};

    if (payload["code"] === HUMAN_REQUIRED_CODE && retryHuman) {
      this.logger.warn("The human pass was refused, passing the check again.");
      await this.obtainHumanPass();
      return this.callApi(method, path, data, { retryHuman: false });
    }

    if (response.status >= 500 || typeof payload !== "object") {
      throw new Error(
        payload?.["error"] || `Request failed (${response.status})`,
      );
    }

    return payload;
  }

  /** Read from the drop's API, throwing a refusal */
  async getFromApi(path) {
    const result = await this.callApi("get", path);

    if (result["success"] === false) {
      throw new Error(result["error"] || `Failed to read ${path}`);
    }

    return result;
  }

  /** Act on the drop's API, returning a refusal as a payload */
  postToApi(path, data = {}) {
    return this.callApi("post", path, data);
  }

  /* --------------------------------------------------------------------- */
  /* Endpoints                                                             */
  /* --------------------------------------------------------------------- */

  /** Sign in with a solved Turnstile token, registering the referrer on first contact */
  loginWithToken(turnstileToken) {
    return this.callApi(
      "post",
      "/auth/login",
      { startParam: this.getReferrerStartParam(), turnstileToken },
      { retryHuman: false },
    );
  }

  /** The full account state */
  fetchMe() {
    return this.getFromApi("/me");
  }

  /** The task board, with each task's status for this account */
  fetchTasks() {
    return this.getFromApi("/tasks").then((result) => result["tasks"] || []);
  }

  /** The newest history rows */
  fetchTransactions(limit = WITHDRAWAL_HISTORY_LIMIT) {
    return this.getFromApi(`/transactions?limit=${limit}`).then(
      (result) => result["transactions"] || [],
    );
  }

  /** The crew the account has recruited */
  fetchFriends() {
    return this.getFromApi("/friends").then(
      (result) => result["friends"] || [],
    );
  }

  /** Mark the tutorial as seen */
  completeTutorial() {
    return this.postToApi("/me/tutorial");
  }

  /** Claim today's check-in */
  checkIn() {
    return this.postToApi("/checkin");
  }

  /** Claim what the session has mined */
  claimMining() {
    return this.postToApi("/mining/claim");
  }

  /** Hire the miner of a level the holding covers */
  unlockLevel(level) {
    return this.postToApi("/levels/unlock", { level });
  }

  /** Claim one task */
  claimTask(taskId) {
    return this.postToApi("/tasks/claim", { taskId });
  }

  /** Claim the hiring bonus for qualified referrals */
  claimReferralBonus() {
    return this.postToApi("/referral/claim-bonus");
  }

  /** Claim the commission the crew has mined */
  claimReferralCommission() {
    return this.postToApi("/referral/claim-commission");
  }

  /** Bind a wallet to the account */
  connectWallet(address) {
    return this.postToApi("/wallet/connect", { address });
  }

  /** Unbind the wallet the account is on */
  disconnectWallet() {
    return this.postToApi("/wallet/disconnect");
  }

  /** Ask the drop to re-read the wallet's on-chain holding */
  refreshWallet() {
    return this.postToApi("/wallet/refresh");
  }

  /** Get the verification transfer the drop expects */
  startVerification() {
    return this.postToApi("/wallet/verify/start");
  }

  /** Ask the drop whether the verification transfer has landed */
  checkVerification() {
    return this.postToApi("/wallet/verify/check");
  }

  /** Request a payout to the connected wallet */
  requestWithdrawal(amount) {
    return this.postToApi("/withdraw", { amount: Number(amount) });
  }

  /* --------------------------------------------------------------------- */
  /* Human pass                                                            */
  /* --------------------------------------------------------------------- */

  /** Read the stored pass once, keeping it only while it belongs to this user and has time left */
  async restoreHumanPass() {
    if (this.humanPassRestored) return;

    this.humanPassRestored = true;

    const stored = await this.storage?.get("humanPass");

    if (this.isHumanPassUsable(stored)) {
      this.humanPass = stored;
    }
  }

  /** The pass reads `<telegramId>.<expiresAt>.<signature>` */
  parseHumanPass(pass) {
    const [userId, expiresAt] = String(pass || "").split(".");

    return { userId, expiresAt: Number(expiresAt) || 0 };
  }

  /** Whether a pass is this user's and outlives the safety margin */
  isHumanPassUsable(pass) {
    if (typeof pass !== "string" || !pass) return false;

    const { userId, expiresAt } = this.parseHumanPass(pass);

    return (
      userId === String(this.getUserId()) &&
      expiresAt - Date.now() / 1000 > HUMAN_PASS_EXPIRY_MARGIN_SECONDS
    );
  }

  /** Keep a pass in memory and in storage, so the next run skips the captcha */
  async storeHumanPass(pass) {
    this.humanPass = pass || null;

    try {
      await this.storage?.set("humanPass", this.humanPass);
    } catch (error) {
      this.logger.warn("Failed to store the human pass:", error.message);
    }
  }

  /** Pass the Turnstile check and sign in, sharing one attempt between concurrent callers */
  obtainHumanPass() {
    return (this.humanPassPromise ||= this.solveHumanCheck().finally(() => {
      this.humanPassPromise = null;
    }));
  }

  /** Solve Turnstile, sign in and store the pass the backend hands back */
  async solveHumanCheck() {
    this.humanPass = null;

    if (!this.canSolveTurnstile()) {
      throw new Error(
        "Captcha is required but no captcha provider is configured!",
      );
    }

    this.logger.info("Solving the security check...");

    const turnstileToken = await this.solveTurnstile({
      siteKey: TURNSTILE_SITE_KEY,
      pageUrl: TURNSTILE_PAGE_URL,
    });

    const result = await this.loginWithToken(turnstileToken);

    if (!result?.["humanPass"]) {
      throw new Error(result?.["error"] || "Login returned no human pass");
    }

    await this.storeHumanPass(result["humanPass"]);
    this.applyResult(result);

    const { expiresAt } = this.parseHumanPass(result["humanPass"]);

    this.logger.success(
      `Human pass stored until ${new Date(expiresAt * 1000).toLocaleString()}.`,
    );

    return result;
  }

  /** Forget the stored pass, so the next sign-in solves the captcha again */
  async resetHumanPass() {
    await this.storeHumanPass(null);
    this.logger.success("Human pass cleared.");
  }

  /* --------------------------------------------------------------------- */
  /* Session                                                               */
  /* --------------------------------------------------------------------- */

  /** Get Auth */
  fetchAuth() {
    return this.login();
  }

  /** Sign in on the stored pass, or pass the human check when there is none */
  async login() {
    await this.restoreHumanPass();

    if (this.humanPass) {
      this.logger.info("Using stored human pass.");
      return this.loadState();
    }

    await this.obtainHumanPass();

    return this.state_data;
  }

  /** Re-read the state into the farmer */
  async loadState() {
    this.applyResult(await this.fetchMe());
    return this.state_data;
  }

  /** Read the state once, for entry points that run without a full pass */
  async ensureStateLoaded() {
    if (!this.state_data) {
      await this.login();
    }

    return this.state_data;
  }

  /** Fold an action's returned state into the farmer, noting when it was read */
  applyResult(result) {
    if (result?.["state"]) {
      this.state_data = result["state"];
      this.stateReadAt = Date.now();
    }

    const levelChange = result?.["levelChange"];

    if (levelChange) {
      this.logger.info(
        `Level changed from ${levelChange["from"]} to ${levelChange["to"]}.`,
      );
    }
  }

  /** Load data */
  async load() {
    await super.load();
    await this.restoreHumanPass();
  }

  /** Get User Details */
  getUserDetails() {
    return this.state_data.user;
  }

  /** The mining session as the drop reports it */
  getMining() {
    return this.state_data?.mining || {};
  }

  /** The wallet verification as the drop reports it */
  getVerify() {
    return this.state_data?.verify || {};
  }

  /** The drop's live config */
  getConfig() {
    return this.state_data?.config || {};
  }

  /** Get Referral Link */
  getReferralLink() {
    return (
      this.state_data?.referral?.["link"] ||
      `https://t.me/VictorsCompanybot/app?startapp=ref_${this.state_data?.referral?.["code"] || ""}`
    );
  }

  /** Get Referrals Count */
  async getReferralsCount() {
    await this.ensureStateLoaded();

    return Number(this.state_data.referral?.["referralsCount"]) || 0;
  }

  /** The drop publishes its minimum in its config */
  getMinimumWithdrawal() {
    return Number(this.getConfig()["withdrawMin"]) || MINIMUM_WITHDRAWAL;
  }

  /** The flat fee taken off each payout */
  getWithdrawalFee() {
    return Number(this.getConfig()["withdrawFee"] ?? WITHDRAWAL_FEE);
  }

  /* --------------------------------------------------------------------- */
  /* Process                                                               */
  /* --------------------------------------------------------------------- */

  /** Process Farmer */
  async process() {
    await this.loadState();

    this.logAccountInfo();
    this.checkTokenContract(this.getConfig()["jettonMaster"]);

    await this.executeTask("Tutorial", () => this.completeTutorialIfNeeded());
    await this.executeTask("Check-in", () => this.claimCheckIn());
    await this.executeTask("Level", () => this.unlockAffordableLevel());
    await this.executeTask("Mining", () => this.claimPendingMining());
    await this.executeTask("Tasks", () => this.completeTasks());
    await this.executeTask("Arcade", () => this.playArcade());
    await this.executeTask("Squad", () => this.claimSquadRewards());
    await this.executeTask("Withdraw", () => this.withdraw());
    await this.storeAutoSnapshot();
  }

  /** Log what the account looks like before the pass starts */
  logAccountInfo() {
    const user = this.getUserDetails();
    const mining = this.getMining();
    const verify = this.getVerify();
    const level = Number(mining["level"]) || 0;

    this.logger.newline();
    this.logCurrentUser();
    this.logger.keyValue("Balance", this.formatAmount(user["inAppBalance"]));
    this.logger.keyValue(
      "Holding",
      this.formatAmount(this.state_data["holding"]),
    );
    this.logger.keyValue(
      "Pending Mining",
      this.formatAmount(this.getMinedAmount()),
    );
    this.logger.keyValue("Level", level);
    this.logger.keyValue("Speed", `${this.getSpeedForLevel(level)} TH/s`, {
      valueStyle: this.logger.c.greenBright,
    });
    this.logger.keyValue(
      "Daily Mining",
      this.formatAmount(this.getDailyOutputForLevel(level)),
      { valueStyle: this.logger.c.greenBright },
    );
    this.logger.keyValue(
      "Session Ends",
      mining["sessionEndsAt"]
        ? new Date(mining["sessionEndsAt"]).toLocaleString()
        : "No session",
    );

    this.logger.newline();
    this.logger.keyValue("Wallet", user["walletAddress"] || "Not connected", {
      valueStyle: user["walletAddress"]
        ? this.logger.c.greenBright
        : this.logger.c.yellowBright,
    });
    this.logger.keyValue(
      "On-chain VIC",
      this.formatAmount(user["walletBalance"]),
    );
    this.logger.keyValue("Verified", verify["verified"] ? "Yes" : "No", {
      valueStyle: verify["verified"]
        ? this.logger.c.greenBright
        : this.logger.c.yellowBright,
    });

    if (verify["underReview"]) {
      this.logger.keyValue("Under Review", "Yes", {
        valueStyle: this.logger.c.redBright,
      });
    }

    this.logger.keyValue(
      "Referrals",
      this.state_data.referral?.["referralsCount"] || 0,
    );
  }

  /** Dismiss the tutorial the way the page does on first launch */
  async completeTutorialIfNeeded() {
    if (this.getUserDetails()["tutorialDone"]) return;

    const result = await this.completeTutorial();

    if (result?.["success"] === false) {
      this.logger.warn("Failed to complete the tutorial:", result["error"]);
      return;
    }

    this.applyResult(result);
    this.logger.success("Tutorial completed.");
  }

  /** Claim today's check-in */
  async claimCheckIn() {
    if (this.state_data.checkIn?.["claimedToday"]) {
      this.logger.info("Already checked in today.");
      return;
    }

    const result = await this.checkIn();

    if (result?.["success"] === false) {
      this.logger.warn("Failed to check in:", result["error"]);
      return;
    }

    this.applyResult(result);
    this.logger.success(
      `Checked in for day ${result["streak"]}, +${result["reward"]} VIC.`,
    );
  }

  /* --------------------------------------------------------------------- */
  /* Wallet                                                                */
  /* --------------------------------------------------------------------- */

  /** The address the drop currently has the account on */
  getConnectedWalletAddress() {
    return this.state_data?.user?.["walletAddress"] || null;
  }

  /** Bind an address to the account, sent as `UQ...` the way the page sends it */
  async connectWalletAddress(address) {
    const friendly = this.utils.toFriendlyAddress(address);
    const result = await this.connectWallet(friendly);

    if (result?.["success"] === false) {
      const message = result["error"] || "Failed to connect the wallet";

      this.logger.error(message);
      return { status: false, message };
    }

    this.applyResult(result);
    this.logger.success(`Wallet connected: ${friendly}`);

    return { status: true, message: "Wallet connected" };
  }

  /** Have the drop re-read the on-chain holding */
  async refreshHolding() {
    if (!this.getConnectedWalletAddress()) {
      this.logger.warn("No wallet connected.");
      return;
    }

    const result = await this.refreshWallet();

    if (result?.["success"] === false) {
      this.logger.warn("Failed to refresh the wallet:", result["error"]);
      return;
    }

    this.applyResult(result);
    this.logger.keyValue(
      "On-chain VIC",
      this.formatAmount(this.getUserDetails()["walletBalance"]),
    );
  }

  /* --------------------------------------------------------------------- */
  /* Verification                                                          */
  /* --------------------------------------------------------------------- */

  /** Whether the drop will let this account withdraw */
  isWithdrawalEligible() {
    const verify = this.getVerify();
    const ageDays = verify["walletAgeDays"];

    return (
      Boolean(verify["verified"]) &&
      !verify["underReview"] &&
      ageDays !== null &&
      ageDays !== undefined &&
      Number(ageDays) >= Number(verify["minWalletAgeDays"] || 0)
    );
  }

  /** Poll the drop until it sees the verification transfer */
  async pollVerification(attempts = VERIFICATION_CHECK_ATTEMPTS) {
    for (let attempt = 0; attempt < attempts; attempt++) {
      if (this.signal.aborted) break;

      await this.utils.delayForSeconds(VERIFICATION_CHECK_INTERVAL_SECONDS, {
        signal: this.signal,
      });

      const result = await this.checkVerification();

      if (result?.["verified"]) {
        this.applyResult(result);
        this.logger.success("Wallet verified.");
        return true;
      }
    }

    this.logger.warn("The verification transfer has not been seen yet.");
    return false;
  }

  /** Pay the one-time verification transfer from the wallet's phrase, unless it is already settled or on its way */
  async verifyWalletIfNeeded({ phrase, version, apiKey }) {
    const verify = this.getVerify();

    if (verify["verified"]) return { status: true };

    if (!phrase) {
      return { status: false, message: "No phrase to pay verification with" };
    }

    /** A transfer already sent is only checked, so it is never paid twice */
    const sentAt = Number(await this.storage?.get("verificationSentAt")) || 0;
    const recentlySent =
      Date.now() - sentAt < VERIFICATION_RETRY_HOURS * 60 * 60 * 1000;

    if (verify["pending"] && recentlySent) {
      this.logger.info("Verification was paid already, checking it...");
      return { status: await this.pollVerification(1) };
    }

    const wallet = this.utils.wallet.createTonWallet({
      phrase,
      version,
      apiKey,
    });
    const address = await wallet.getAddress();
    const connected = this.getConnectedWalletAddress();

    if (connected && !this.utils.isSameTonAddress(connected, address)) {
      const message = "The phrase does not match the connected wallet";

      this.logger.warn(message);
      return { status: false, message };
    }

    const amountTon = new Decimal(verify["amountTon"] || 0.05);
    const tonBalance = await wallet
      .getBalance({ signal: this.signal })
      .catch(() => new Decimal(0));

    if (tonBalance.lessThan(amountTon.plus(VERIFICATION_GAS_TON))) {
      const message = `Verification needs ${amountTon.plus(VERIFICATION_GAS_TON)} TON, the wallet holds ${tonBalance}`;

      this.logger.warn(message);
      return { status: false, message };
    }

    const result = await this.startVerification();
    const tx = result?.["tx"];

    if (!tx?.["address"] || !tx?.["amount"]) {
      const message = result?.["error"] || "The drop returned no transfer";

      this.logger.warn("Failed to start verification:", message);
      return { status: false, message };
    }

    const seqno = await wallet.send({
      to: tx["address"],
      value: BigInt(tx["amount"]),
      body: tx["payload"]
        ? Cell.fromBase64(tx["payload"])
        : tx["comment"] || verify["comment"],
    });

    /** Recorded before confirming, so a lost confirmation is never paid twice */
    await this.storage?.set("verificationSentAt", Date.now());
    await wallet.waitForConfirmation(seqno);

    this.logger.success(
      `Sent ${tx["amountTon"] ?? amountTon} TON to ${tx["address"]} for verification.`,
    );

    return { status: await this.pollVerification() };
  }

  /* --------------------------------------------------------------------- */
  /* Levels                                                                */
  /* --------------------------------------------------------------------- */

  /** The VIC holding a level is hired with, priced exactly as the page does */
  getRequiredHoldingForLevel(level) {
    return getMinerRequiredHolding(level);
  }

  /** The mining speed, in TH/s, a level runs at */
  getSpeedForLevel(level) {
    return getMinerSpeed(level);
  }

  /** The VIC a level mines per day */
  getDailyOutputForLevel(level) {
    return getMinerDailyOutput(level);
  }

  /** The highest level a holding covers, with a connected wallet granting level 1 for free */
  findLevelForHolding(holding, walletConnected = true) {
    return findMinerLevelForHolding(holding, walletConnected);
  }

  /** Hire the highest level the combined holding covers */
  async unlockAffordableLevel() {
    if (!this.getConnectedWalletAddress()) {
      this.logger.info("Levels need a connected wallet.");
      return;
    }

    const holding = Number(this.state_data["holding"]) || 0;
    const activeLevel = Number(this.getMining()["level"]) || 0;
    const targetLevel = this.findLevelForHolding(holding);

    if (targetLevel <= activeLevel) {
      this.logger.info(
        `Level ${activeLevel} is the highest ${this.formatAmount(holding)} VIC covers.`,
      );
      return;
    }

    return this.unlockToLevel(targetLevel);
  }

  /** Hire a level */
  async unlockToLevel(level) {
    const result = await this.unlockLevel(level);

    if (result?.["success"] === false) {
      this.logger.warn(`Failed to unlock level ${level}:`, result["error"]);
      return { status: false, message: result["error"] };
    }

    this.applyResult(result);
    this.logger.success(
      `Unlocked level ${level} at ${this.getSpeedForLevel(level)} TH/s.`,
    );

    return { status: true };
  }

  /* --------------------------------------------------------------------- */
  /* Mining                                                                */
  /* --------------------------------------------------------------------- */

  /** What the session has mined by now, projected from the last state read the way the page does */
  getMinedAmount() {
    const mining = this.getMining();
    const accrued = new Decimal(mining["accrued"] || 0);

    if (!this.state_data?.["serverTime"] || !mining["sessionEndsAt"]) {
      return accrued;
    }

    const serverTime = new Date(this.state_data["serverTime"]).getTime();
    const endsAt = new Date(mining["sessionEndsAt"]).getTime();
    const elapsed = Math.max(
      0,
      Math.min(Date.now() - this.stateReadAt, endsAt - serverTime),
    );
    const daily = mining["accrualDaily"] ?? mining["dailyOutput"] ?? 0;

    return accrued.plus(new Decimal(daily).mul(elapsed).div(86400 * 1000));
  }

  /** Claim what the miner has produced, which also starts a new session */
  async claimPendingMining() {
    if (!(Number(this.getMining()["level"]) > 0)) {
      this.logger.warn("Mining only runs once a wallet is connected.");
      return;
    }

    const pending = this.getMinedAmount();

    if (pending.lessThan(MINIMUM_CLAIMABLE_MINING)) {
      this.logger.info(
        `Only ${this.formatAmount(pending)} VIC mined, waiting for ${MINIMUM_CLAIMABLE_MINING}.`,
      );
      return;
    }

    const result = await this.claimMining();

    if (result?.["success"] === false) {
      this.logger.warn("Failed to claim mining:", result["error"]);
      return;
    }

    this.applyResult(result);
    this.logger.success(
      `Claimed ${this.formatAmount(result["claimed"] ?? pending)} VIC.`,
    );
  }

  /* --------------------------------------------------------------------- */
  /* Tasks                                                                 */
  /* --------------------------------------------------------------------- */

  /** Whether the account meets a task's own threshold */
  isTaskQualified(task) {
    const user = this.getUserDetails();

    switch (task["kind"]) {
      case "wallet_connect":
        return Boolean(user["walletAddress"]);

      case "onchain_hold":
        return (
          Boolean(user["walletAddress"]) &&
          Number(user["walletBalance"] || 0) >= Number(task["minHolding"] || 0)
        );

      case "invite_friends":
        return (
          Number(this.state_data.referral?.["walletReferralsCount"] || 0) >=
          Number(task["minReferrals"] || 0)
        );

      case "reach_level":
        return (
          Number(this.getMining()["level"] || 0) >=
          Number(task["minLevel"] || 0)
        );

      default:
        return true;
    }
  }

  /** Claim every open task the account qualifies for */
  async completeTasks() {
    const tasks = (await this.fetchTasks()).filter(
      (task) => task["status"] === "open" && this.isTaskQualified(task),
    );

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
    const isVisitTask =
      task["kind"] === "link_visit" || task["kind"] === "telegram_channel";

    await this.openTaskLink(task["url"], isVisitTask ? TASK_DWELL_SECONDS : 0);

    const result = await this.claimTask(task["taskId"]);

    if (result?.["success"] === false) {
      this.logger.warn(`Skipped "${task["title"].trim()}":`, result["error"]);
    } else {
      this.applyResult(result);
      this.logger.success(
        `Claimed "${task["title"].trim()}" for ${task["reward"]} VIC.`,
      );
    }

    await this.utils.delayForSeconds(3, { signal: this.signal });
  }

  /* --------------------------------------------------------------------- */
  /* Arcade                                                                */
  /* --------------------------------------------------------------------- */

  /** Report the arcade games open to the public, which only Deep Mine is today and is left unplayed since every run costs VIC */
  async playArcade() {
    const games = (this.state_data.arcade || []).filter(
      (game) => !game["test"],
    );

    if (!games.length) {
      this.logger.info("No arcade games available.");
      return;
    }

    for (const game of games) {
      if (game["id"] === "mine") {
        this.logger.warn("Deep Mine is public, not automated (costs VIC).");
      } else {
        this.logger.warn(`Unknown arcade game "${game["id"]}" is public.`);
      }
    }
  }

  /* --------------------------------------------------------------------- */
  /* Squad                                                                 */
  /* --------------------------------------------------------------------- */

  /** Claim the hiring bonus and crew commission */
  async claimSquadRewards() {
    const referral = this.state_data.referral || {};
    const claims = [
      ["hiring bonus", referral["unclaimedBonus"], this.claimReferralBonus],
      [
        "commission",
        referral["unclaimedCommission"],
        this.claimReferralCommission,
      ],
    ];

    for (const [label, amount, claim] of claims) {
      if (!(Number(amount) > 0)) {
        this.logger.info(`No ${label} to claim.`);
        continue;
      }

      const result = await claim.call(this);

      if (result?.["success"] === false) {
        this.logger.warn(`Failed to claim the ${label}:`, result["error"]);
      } else {
        this.applyResult(result);
        this.logger.success(
          `Claimed ${this.formatAmount(result["claimed"] ?? amount)} VIC ${label}.`,
        );
      }

      await this.utils.delayForSeconds(2, { signal: this.signal });
    }
  }

  /* --------------------------------------------------------------------- */
  /* Withdrawal                                                            */
  /* --------------------------------------------------------------------- */

  /** The account's withdrawals among its newest history rows */
  async getWithdrawals() {
    const transactions = await this.fetchTransactions();

    return transactions.filter((item) => item["type"] === "Withdraw");
  }

  /** The withdrawals the drop has not settled yet */
  async getPendingWithdrawals() {
    return (await this.getWithdrawals()).filter((item) =>
      PENDING_WITHDRAWAL_STATUSES.includes(item["status"]),
    );
  }

  /** Whether the drop still owes this account a settlement */
  async hasPendingWithdrawal() {
    await this.ensureStateLoaded();

    return (await this.getPendingWithdrawals()).length > 0;
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

    if (!this.isWithdrawalEligible()) {
      const verify = this.getVerify();
      const message = !verify["verified"]
        ? "Wallet is not verified!"
        : verify["underReview"]
          ? "Wallet is under review!"
          : `Wallet is younger than ${verify["minWalletAgeDays"]} days!`;

      return this.skipWithdrawal(message, { log: "warn" });
    }

    if ((await this.getPendingWithdrawals()).length > 0) {
      return this.skipWithdrawal("A withdrawal is already pending!", {
        log: "warn",
      });
    }

    const balance = new Decimal(user["inAppBalance"] || 0);
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
      ceiling: Number(this.getConfig()["withdrawMax"]) || 0,
    });

    /** Read before the request, while the state still holds the pre-payout holding */
    this.logLevelAfterWithdrawal(amount);

    const result = await this.requestWithdrawal(amount);
    const status = result?.["success"] !== false;
    const message = result?.["error"] || result?.["message"] || "";

    if (status) {
      this.applyResult(result);

      this.logger.success(
        `Requested ${amount.toString()} VIC${result["autoApproved"] ? ", auto-approved" : ""}.`,
      );
      this.logger.keyValue("Destination", destinationAddress);
      this.logger.keyValue(
        "To be received",
        Decimal.max(amount.minus(this.getWithdrawalFee()), 0).toString(),
      );

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

  /** Warn when a payout takes the holding below the active level, as the page does */
  logLevelAfterWithdrawal(amount) {
    const activeLevel = Number(this.getMining()["level"]) || 0;
    const holding = new Decimal(this.state_data["holding"] || 0).minus(amount);
    const levelAfter = this.findLevelForHolding(
      Decimal.max(holding, 0).toNumber(),
      Boolean(this.getConnectedWalletAddress()),
    );

    if (levelAfter < activeLevel) {
      this.logger.keyValue("Level After", `${activeLevel} → ${levelAfter}`, {
        valueStyle: this.logger.c.yellowBright,
      });
    }
  }

  /** Log the payouts the drop has not settled yet */
  async logWithdrawalStatus() {
    await this.ensureStateLoaded();

    const pending = await this.getPendingWithdrawals();
    const verify = this.getVerify();

    this.logger.newline();
    this.logCurrentUser();
    this.logger.keyValue(
      "Balance",
      this.formatAmount(this.getUserDetails()["inAppBalance"]),
    );
    this.logger.keyValue("Minimum", this.getMinimumWithdrawal());
    this.logger.keyValue("Fee", this.getWithdrawalFee());
    this.logger.keyValue(
      "Eligible",
      this.isWithdrawalEligible() ? "Yes" : "No",
      {
        valueStyle: this.isWithdrawalEligible()
          ? this.logger.c.greenBright
          : this.logger.c.yellowBright,
      },
    );
    this.logger.keyValue(
      "Wallet Age",
      `${verify["walletAgeDays"] ?? "?"} / ${verify["minWalletAgeDays"]} days`,
    );
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
      this.logger.keyValue("Amount", item["amount"]);
      this.logger.keyValue("Status", item["status"]);
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

  /** Pay the one-time verification from the wallet's phrase, connecting the wallet first when the account has none */
  async verifyAutoWallet({ phrase, version, apiKey }) {
    try {
      await this.ensureStateLoaded();

      if (this.getVerify()["verified"]) {
        return {
          status: true,
          skipped: true,
          message: "Already verified",
          summary: this.getAutoSummary(),
        };
      }

      if (!this.getConnectedWalletAddress()) {
        const connected = await this.connectAutoWallet({ phrase, version });

        if (!connected.status) return connected;
      }

      const { status, message } = await this.verifyWalletIfNeeded({
        phrase,
        version,
        apiKey,
      });

      return {
        status,
        skipped: false,
        message:
          message || (status ? "Verified" : "Not confirmed yet, check again"),
        summary: status
          ? await this.refreshAutoSummary()
          : this.getAutoSummary(),
      };
    } catch (error) {
      return { status: false, message: error.message || "Unknown error" };
    }
  }

  /** Re-read the holding and claim pending mining so the summary reflects current balances */
  async refreshAutoState() {
    await this.ensureStateLoaded();
    await this.refreshHolding();

    return this.claimPendingMining();
  }

  /** Re-read the state for a fresh summary */
  async refreshAutoSummary() {
    await this.loadState();

    return this.getAutoSummary();
  }

  /** Put the account to work at the holding it now has, and report it afresh */
  async startAutoMining() {
    await this.ensureStateLoaded();
    await this.refreshHolding();
    await this.unlockAffordableLevel();
    await this.claimPendingMining();
    await this.claimSquadRewards();

    return this.refreshAutoSummary();
  }

  /** Normalized account snapshot */
  getAutoSummary() {
    const user = this.getUserDetails();
    const mining = this.getMining();
    const address = this.getConnectedWalletAddress();
    const toSeconds = (value) =>
      value ? Math.floor(new Date(value).getTime() / 1000) : 0;
    const freezesAt = toSeconds(mining["sessionEndsAt"]);

    return {
      level: Number(mining["level"]) || 0,
      mining: {
        startedAt: toSeconds(mining["sessionStartedAt"]),
        freezesAt,
        frozen: Boolean(freezesAt) && Date.now() / 1000 >= freezesAt,
      },
      holding: user["walletBalance"],
      balance: user["inAppBalance"],
      minWithdrawal: this.getMinimumWithdrawal(),
      verified: Boolean(this.getVerify()["verified"]),
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
            icon: "search",
            title: "Refresh Holding",
            action: this.refreshHoldingInteractive.bind(this),
            dispatch: false,
          },
          {
            id: "verify-wallet",
            icon: "kyc",
            title: "Verify Wallet",
            action: this.verifyWalletInteractive.bind(this),
            dispatch: false,
          },
          {
            id: "check-verification",
            icon: "kyc",
            title: "Check Verification",
            action: this.checkVerificationInteractive.bind(this),
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
        name: "Squad",
        list: [
          {
            id: "squad",
            icon: "user",
            title: "Squad",
            action: this.squadInteractive.bind(this),
            dispatch: false,
          },
        ],
      },
      {
        name: "Account",
        list: [
          {
            id: "human-check",
            icon: "kyc",
            title: "Human Check",
            action: this.obtainHumanPass.bind(this),
            dispatch: false,
          },
          {
            id: "reset-human-pass",
            icon: "reconnect",
            title: "Reset Human Pass",
            action: this.resetHumanPass.bind(this),
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
      "On-chain VIC",
      this.formatAmount(await this.readOnChainHolding(address)),
    );
  }

  /** Unbind the wallet the account is on */
  async disconnectWalletInteractive() {
    await this.ensureStateLoaded();

    const result = await this.disconnectWallet();

    if (result?.["success"] === false) {
      this.logger.error("Failed to disconnect:", result["error"]);
      return;
    }

    this.applyResult(result);
    await this.rememberWalletVersion(undefined);
    this.logger.success("Wallet disconnected.");
  }

  /** Re-read the holding on demand */
  async refreshHoldingInteractive() {
    await this.ensureStateLoaded();
    await this.refreshHolding();
  }

  /** Pay the verification from a wallet phrase, connecting that wallet first when the account has none */
  async verifyWalletInteractive() {
    const phrase = ((await this.promptInput("Enter the wallet phrase:")) || "")
      .trim()
      .split(/\s+/)
      .join(" ");

    if (!phrase) {
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

    const { status, message } = await this.verifyAutoWallet({
      phrase,
      version,
    });

    if (status) {
      this.logger.success(message);
    } else {
      this.logger.error("Verification failed:", message);
    }
  }

  /** A derived wallet's phrase is known, so its verification is paid right after it is bound */
  async afterDerivedWalletConnected({ phrase, version }) {
    const { status, message } = await this.verifyWalletIfNeeded({
      phrase,
      version,
    });

    if (!status) {
      this.logger.warn("Wallet not verified:", message || "not confirmed yet");
    }
  }

  /** Show what the verification needs and ask the drop whether it has landed */
  async checkVerificationInteractive() {
    await this.ensureStateLoaded();

    const verify = this.getVerify();

    this.logger.newline();
    this.logger.keyValue("Verified", verify["verified"] ? "Yes" : "No");
    this.logger.keyValue("Pending", verify["pending"] ? "Yes" : "No");
    this.logger.keyValue("Treasury", verify["treasury"]);
    this.logger.keyValue("Amount", `${verify["amountTon"]} TON`);
    this.logger.keyValue("Comment", verify["comment"]);
    this.logger.keyValue(
      "Wallet Age",
      `${verify["walletAgeDays"] ?? "?"} / ${verify["minWalletAgeDays"]} days`,
    );

    if (verify["verified"]) {
      this.logger.success("Wallet is already verified.");
      return;
    }

    if (!this.getConnectedWalletAddress()) {
      this.logger.warn("Connect a wallet first.");
      return;
    }

    await this.pollVerification(1);
  }

  /** List the crew and claim what it has earned */
  async squadInteractive() {
    await this.ensureStateLoaded();

    const referral = this.state_data.referral || {};
    const friends = await this.fetchFriends();

    this.logger.newline();
    this.logger.keyValue("Referrals", referral["referralsCount"] || 0);
    this.logger.keyValue("With Wallet", referral["walletReferralsCount"] || 0);
    this.logger.keyValue("Qualified", referral["eligibleCount"] || 0);
    this.logger.keyValue(
      "Unclaimed Bonus",
      this.formatAmount(referral["unclaimedBonus"] || 0),
    );
    this.logger.keyValue(
      "Unclaimed Commission",
      this.formatAmount(referral["unclaimedCommission"] || 0),
    );

    for (const friend of friends) {
      this.logger.newline();
      this.logger.keyValue(
        "Friend",
        `${friend["name"]}${friend["username"] ? ` (@${friend["username"]})` : ""}`,
      );
      this.logger.keyValue("Level", friend["level"]);
      this.logger.keyValue("Wallet", friend["walletConnected"] ? "Yes" : "No");
      this.logger.keyValue("Qualified", friend["qualified"] ? "Yes" : "No", {
        valueStyle: friend["qualified"]
          ? this.logger.c.greenBright
          : this.logger.c.yellowBright,
      });

      if (friend["nextStep"]) {
        this.logger.keyValue("Next Step", friend["nextStep"]);
      }
    }

    this.logger.newline();
    await this.claimSquadRewards();
  }

  /** Claim mining on demand */
  async claimMiningInteractive() {
    await this.ensureStateLoaded();
    await this.claimPendingMining();
  }

  /** Hire a level, prompting for which one and leaving the holding to the drop to judge */
  async unlockLevelInteractive() {
    await this.ensureStateLoaded();

    const input = await this.promptInput("Which level?");
    const level = Number((input || "").trim());

    if (!Number.isInteger(level) || level < 1 || level > MAXIMUM_MINER_LEVEL) {
      this.logger.warn("Enter a valid level.");
      return;
    }

    const required = this.getRequiredHoldingForLevel(level);
    const holding = Number(this.state_data["holding"]) || 0;

    this.logger.newline();
    this.logger.keyValue("Level", level);
    this.logger.keyValue("Required Holding", this.formatAmount(required));
    this.logger.keyValue("Your Holding", this.formatAmount(holding));

    /** Reported rather than refused, so a level can be tried whatever the holding reads */
    if (holding < required) {
      this.logger.warn(
        `${this.formatAmount(required - holding)} VIC short of level ${level}, asking anyway.`,
      );
    }

    await this.unlockToLevel(level);
  }

  /** Report what a holding would mine, prompting for it */
  async estimateMining() {
    const input = await this.promptInput("How much VIC?");
    const trimmed = (input || "").trim();

    if (!trimmed) return;

    let holding;

    try {
      holding = new Decimal(trimmed);
    } catch {
      this.logger.error("Invalid VIC amount:", trimmed);
      return;
    }

    if (holding.isNegative()) {
      this.logger.error("VIC amount must be non-negative");
      return;
    }

    const level = this.findLevelForHolding(holding.toNumber());

    this.logger.newline();
    this.logger.keyValue("VIC Holding", this.formatAmount(holding));
    this.logger.keyValue("Reachable Level", level);
    this.logger.keyValue(
      "Level Requirement",
      this.formatAmount(this.getRequiredHoldingForLevel(level)),
    );
    this.logger.keyValue("Speed", `${this.getSpeedForLevel(level)} TH/s`);

    this.logger.newline();
    this.logMiningRateBreakdown(
      new Decimal(this.getDailyOutputForLevel(level)),
    );
  }
}
