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
import { buildTonProof } from "../lib/ton/proof.js";
import { buildSliderTrace, findSliderX } from "../lib/sliderCaptcha.js";
import {
  createWallet,
  keyPairFromPhraseOrSecretKey,
} from "../lib/ton/wallet.js";
import { fetchTonApi } from "../lib/ton/tonapi.js";

/** The drop's backend, which the mini app talks to for everything */
const API_URL = "https://mrg.up.railway.app/api";

/** Mine Rare Gram, the jetton whose holding sets the miner level */
const MRG_JETTON_ADDRESS = "EQDj-zlSvj4Au154XjsU7ATzt13p8JjYEs0weVv1rVbCJSn0";

/** The domain the page signs its TON proof for */
const TON_PROOF_DOMAIN = "app.mrgtoken.xyz";

/** Cloudflare Turnstile guarding claims and withdrawals, as the human check renders it */
const TURNSTILE_SITE_KEY = "0x4AAAAAAFI-XXL7bFNbLU_J";
const TURNSTILE_PAGE_URL = "https://app.mrgtoken.xyz/";

/** The error code the backend answers with once the human check is missing or stale */
const HUMAN_CHECK_REQUIRED_CODE = "HUMAN_CHECK_REQUIRED";

/** A human check this close to expiry is renewed rather than risked mid-run */
const HUMAN_CHECK_EXPIRY_MARGIN_SECONDS = 10 * 60;

/** How long the page leaves a task open before it lets the claim through */
const TASK_DWELL_SECONDS = 15;

/** The windows the page waits out per recurring task type, in hours */
const TASK_COOLDOWN_HOURS = {
  recurring_1h: 1,
  recurring_3h: 3,
  recurring_6h: 6,
  recurring_12h: 12,
  recurring_24h: 24,
};

/** The page falls back to this window for a recurring type it does not know */
const DEFAULT_TASK_COOLDOWN_HOURS = 3;

/** Below this the drop's own claim button stays disabled */
const MINIMUM_CLAIMABLE_MINING = 0.0001;

/** A mining session runs this long from its snapshot, then freezes until claimed */
const MINING_WINDOW_SECONDS = 24 * 60 * 60;

/** The Genesis NFT collection the drop discounts withdrawals for */
const GENESIS_NFT_COLLECTION =
  "EQAwe5pFTrqv-sLqHQW8OzZ-COA2dpuxPM_dziNBGZZc1ixS";

/** What one NFT of each rarity takes off the fee, in percent */
const NFT_RARITY_DISCOUNTS = { mythical: 35, rare: 20, common: 10 };

/** Any three NFTs discount more than the rarest of them on its own */
const NFT_BUNDLE_SIZE = 3;
const NFT_BUNDLE_DISCOUNT = 50;

/** The drop's withdrawal rules */
const MINIMUM_WITHDRAWAL = 1000;
const WITHDRAWAL_FEE = 70;

/** The backend refuses a withdrawal whose `initData` is this old, so the page asks for a reopen */
const INIT_DATA_MAX_AGE_SECONDS = 6 * 60 * 60 - 300;

/** Daily check-in rewards by streak day, which loop every seven days */
const CHECKIN_REWARDS = [5, 6, 7, 8, 9, 10, 15];

/** Task kinds the drop settles against the wallet's holding, with no link to open */
const HOLD_TASK_TYPES = ["token_hold", "nft_hold"];

/** TON kept aside for the verification transfer's fees */
const VERIFICATION_GAS_TON = 0.02;

/** How often, and how long, the verification is polled after paying, as the page does for 3 minutes */
const VERIFICATION_CHECK_ATTEMPTS = 12;
const VERIFICATION_CHECK_INTERVAL_SECONDS = 10;

/** A verification paid this long ago without landing is assumed lost and paid again */
const VERIFICATION_RETRY_HOURS = 6;

/** One withdrawal per this many hours, counted from the last completed one */
const WITHDRAWAL_COOLDOWN_HOURS = 24;

/** How many fresh slider puzzles a withdrawal tries before giving up */
const SLIDER_CAPTCHA_ATTEMPTS = 3;

/** Device details the page reports, picked per account so they stay stable */
const DEVICE_RAM_OPTIONS = ["4 GB", "6 GB", "8 GB", "12 GB"];
const DEVICE_CPU_CORES = 8;
const DEVICE_SCREEN_RESOLUTIONS = ["1080x2400", "1080x2340", "720x1600"];

export default class MRGFarmer extends BaseFarmer {
  static id = "mrg";
  static title = "MRG";
  static emoji = "⛏️";
  static host = "app.mrgtoken.xyz";
  static domains = ["app.mrgtoken.xyz", "mrg.up.railway.app"];
  static telegramLink = "https://t.me/mrgminerbot/app?startapp=ref_T90OGL9E";
  static path = "/";
  static interval = "0 */3 * * *";
  static apiDelay = 500;
  static rating = 5;
  static published = true;

  static auto = {
    id: "mrg-auto",
    title: "MRG Auto",
    token: "MRG",
    jettonAddress: MRG_JETTON_ADDRESS,
    storagePrefix: "mrg-auto",
    minWithdrawal: MINIMUM_WITHDRAWAL,
    connectWithPhrase: true,
    verifiable: true,
  };

  /* --------------------------------------------------------------------- */
  /* Transport                                                             */
  /* --------------------------------------------------------------------- */

  /** Carry `initData` on every call the drop's own API receives, and on no others */
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

  /** Call the drop's API, reading a refused action as a payload and passing the human check once if it is asked for */
  async callApi(path, data = {}, { retryHuman = true } = {}) {
    const response = await this.api.post(`${API_URL}${path}`, data, {
      signal: this.signal,
      validateStatus: (status) => status < 500,
    });

    const payload = response.data;

    if (typeof payload !== "object" || payload === null) {
      throw new Error(`Request failed (${response.status})`);
    }

    if (payload["code"] === HUMAN_CHECK_REQUIRED_CODE && retryHuman) {
      this.logger.warn("The human check has lapsed, passing it again.");
      await this.obtainHumanCheck();
      return this.callApi(path, data, { retryHuman: false });
    }

    return payload;
  }

  /** Act on the drop's API, returning a refusal as a payload */
  postToApi(path, data = {}) {
    return this.callApi(path, data);
  }

  /* --------------------------------------------------------------------- */
  /* Endpoints                                                             */
  /* --------------------------------------------------------------------- */

  /** Sign in, creating the account on first contact and registering the referrer with it */
  verifyAccount() {
    return this.postToApi("/auth/verify", {
      startParam: this.getReferrerStartParam(),
      deviceInfo: this.getDeviceInfo(),
    });
  }

  /** The full account state: user, level, tasks, transactions */
  fetchAccount() {
    return this.postToApi("/user/me", { deviceInfo: this.getDeviceInfo() });
  }

  /** Trade a solved Turnstile token for a few hours of human check */
  verifyHuman(turnstileToken) {
    return this.callApi(
      "/user/verify-human",
      { turnstileToken },
      { retryHuman: false },
    );
  }

  /** The squad and its commission counters */
  fetchFriends() {
    return this.postToApi("/user/friends");
  }

  /** The week's earnings, which the page reads on load */
  fetchPnlHistory() {
    return this.postToApi("/user/pnl-history", {
      tzOffsetMinutes: -new Date().getTimezoneOffset(),
    });
  }

  /** Mark the account as present, as the page does every 30s while visible */
  ping() {
    return this.postToApi("/user/ping");
  }

  /** Mark the account as gone, as the page does when it is hidden or closed */
  leavePresence() {
    return this.postToApi("/user/presence-leave");
  }

  /** A fresh payload for the TON proof a new wallet is bound with */
  async fetchTonProofPayload() {
    const result = await this.postToApi("/user/ton-proof-payload");

    if (!result?.["success"] || typeof result["payload"] !== "string") {
      throw new Error(result?.["error"] || "Failed to get a TON proof payload");
    }

    return result["payload"];
  }

  /** Bind a wallet and report the holding, with a TON proof unless the wallet is already bound */
  connectWallet(address, balance, tonProof) {
    return this.postToApi("/user/connect-wallet", {
      address,
      balance,
      tonProof: tonProof || undefined,
    });
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

  /** Check in for the day, which pays by streak */
  dailyCheckIn() {
    return this.postToApi("/user/daily-checkin");
  }

  /** The on-chain verification the drop wants before a withdrawal, with the transfer it expects */
  fetchVerificationInfo() {
    return this.postToApi("/user/onchain-verify/info");
  }

  /** Ask the drop whether the verification transfer has landed */
  checkVerification() {
    return this.postToApi("/user/onchain-verify/check");
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

  /** Get a slider puzzle, which a withdrawal must be accompanied by */
  createCaptcha() {
    return this.postToApi("/captcha/create");
  }

  /** Answer a slider puzzle with where the piece was dropped and the drag that put it there */
  verifyCaptcha(captchaId, sliderX, trace) {
    return this.postToApi("/captcha/verify", { captchaId, sliderX, trace });
  }

  /** Request a payout to the connected wallet */
  requestWithdrawal(amount, destinationAddress, captchaToken, turnstileToken) {
    return this.postToApi("/user/withdraw", {
      amount: Number(amount),
      destinationAddress,
      captchaToken,
      turnstileToken,
      deviceInfo: this.getDeviceInfo(),
    });
  }

  /* --------------------------------------------------------------------- */
  /* Device                                                                */
  /* --------------------------------------------------------------------- */

  /** The device the page reports alongside sign-in, kept stable per account */
  getDeviceInfo() {
    const random = this.getUserRandomGenerator();
    const pick = (list) => list[Math.floor(random() * list.length)];
    const userAgent = this.userAgent || "";

    let timezone = "";

    try {
      timezone = Intl.DateTimeFormat().resolvedOptions().timeZone || "";
    } catch {}

    return {
      platform: "android",
      deviceName: this.getDeviceName(userAgent),
      ram: pick(DEVICE_RAM_OPTIONS),
      cpuCores: DEVICE_CPU_CORES,
      screenResolution: pick(DEVICE_SCREEN_RESOLUTIONS),
      userAgent,
      timezone,
      language: this.getTelegramUser()?.["language_code"] || "en",
    };
  }

  /** Name the device from its user agent the way the page does for common phones */
  getDeviceName(userAgent) {
    const pixel = userAgent.match(
      /Pixel\s+([0-9a-zA-Z\s]+?)(?=\s+Build|\s+\)|;)/i,
    );

    if (pixel) return `Google ${pixel[0]}`;

    const samsung = userAgent.match(/SM-[A-Z0-9]+/i);

    if (samsung) return `Samsung Galaxy (${samsung[0].toUpperCase()})`;

    const android = userAgent.match(
      /Android\s+([0-9.]+);\s*([^;)]+?)(?=\s+Build|\))/i,
    );
    const model = android?.[2]?.trim();

    if (model && !model.includes("K") && model.length > 2) {
      return `${model} (Android ${android[1]})`;
    }

    return "Mobile Device";
  }

  /* --------------------------------------------------------------------- */
  /* Human check                                                           */
  /* --------------------------------------------------------------------- */

  /** Read the stored check once, keeping it only while it belongs to this user */
  async restoreHumanCheck() {
    if (this.humanCheckRestored) return;

    this.humanCheckRestored = true;

    const stored = await this.storage?.get("humanCheck");

    if (stored?.["userId"] === String(this.getUserId())) {
      this.humanVerifiedUntil = stored["until"] || null;
    }
  }

  /** When the check runs out, as the later of the stored and the server's reading */
  getHumanVerifiedUntil() {
    const times = [
      this.humanVerifiedUntil,
      this.account_data?.user?.["humanVerifiedUntil"],
    ]
      .map((value) => (value ? new Date(value).getTime() : 0))
      .filter((time) => Number.isFinite(time) && time > 0);

    return times.length ? Math.max(...times) : 0;
  }

  /** Whether the check outlives the safety margin */
  isHumanCheckValid() {
    return (
      this.getHumanVerifiedUntil() - Date.now() >
      HUMAN_CHECK_EXPIRY_MARGIN_SECONDS * 1000
    );
  }

  /** Keep the check's expiry in memory and in storage, so the next run skips the captcha */
  async storeHumanCheck(until) {
    this.humanVerifiedUntil = until || null;

    if (this.account_data?.user) {
      this.account_data.user["humanVerifiedUntil"] = this.humanVerifiedUntil;
    }

    try {
      await this.storage?.set(
        "humanCheck",
        this.humanVerifiedUntil
          ? { userId: String(this.getUserId()), until: this.humanVerifiedUntil }
          : null,
      );
    } catch (error) {
      this.logger.warn("Failed to store the human check:", error.message);
    }
  }

  /** Pass the human check, sharing one attempt between concurrent callers */
  obtainHumanCheck() {
    return (this.humanCheckPromise ||= this.solveHumanCheck().finally(() => {
      this.humanCheckPromise = null;
    }));
  }

  /** Solve Turnstile and store how long the backend now trusts the account */
  async solveHumanCheck() {
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

    const result = await this.verifyHuman(turnstileToken);

    if (!result?.["success"] || !result["humanVerifiedUntil"]) {
      throw new Error(result?.["error"] || "The human check was refused");
    }

    await this.storeHumanCheck(result["humanVerifiedUntil"]);

    this.logger.success(
      `Human check valid until ${new Date(result["humanVerifiedUntil"]).toLocaleString()}.`,
    );

    return result;
  }

  /** Pass the human check only when the stored one has run out */
  async ensureHumanCheck() {
    await this.restoreHumanCheck();

    if (this.isHumanCheckValid()) {
      this.logger.info(
        `Human check valid until ${new Date(this.getHumanVerifiedUntil()).toLocaleString()}.`,
      );
      return;
    }

    await this.obtainHumanCheck();
  }

  /** Pass the human check on demand, whatever the stored one says */
  async renewHumanCheck() {
    await this.ensureStateLoaded();
    await this.obtainHumanCheck();
  }

  /** Forget the stored check, so the next run solves the captcha again */
  async resetHumanCheck() {
    await this.storeHumanCheck(null);
    this.logger.success("Human check cleared.");
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

  /** Sign in and read the account */
  async login() {
    await this.verifyAccount();
    await this.loadAccount();

    /** The page reads these on load too, and their failure blocks nothing */
    await this.fetchPnlHistory().catch(() => null);

    return this.account_data;
  }

  /** Report presence without letting a failure stop the pass */
  async updatePresence(present) {
    try {
      await (present ? this.ping() : this.leavePresence());
    } catch (error) {
      this.logger.warn("Failed to update presence:", error.message);
    }
  }

  /** Re-read the account into the farmer's state */
  async loadAccount() {
    this.account_data = await this.fetchAccount();
    return this.account_data;
  }

  /** Read the account once, for entry points that run without a full pass */
  async ensureStateLoaded() {
    if (!this.account_data) {
      await this.login();
    }

    return this.account_data;
  }

  /** Load data */
  async load() {
    await super.load();
    await this.restoreHumanCheck();
    this.taskClaims = (await this.storage?.get("taskClaims")) || {};
    this.nftHoldings = null;
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
    await this.updatePresence(true);

    await this.logAccountInfo();
    await this.executeTask("Human Check", () => this.ensureHumanCheck());
    await this.executeTask("Check-In", () => this.checkInDaily());
    await this.executeTask("Level", () => this.unlockAffordableLevel());
    await this.executeTask("Mining", () => this.claimPendingMining());
    await this.executeTask("Tasks", () => this.completeTasks());
    await this.executeTask("Squad", () => this.claimSquadRewards());
    await this.executeTask("Withdraw", () => this.withdraw());
    await this.storeAutoSnapshot();
    await this.updatePresence(false);
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

    const { freezesAt } = this.getMiningWindow();

    this.logger.keyValue(
      "Mining Window Ends",
      freezesAt ? new Date(freezesAt * 1000).toLocaleString() : "No session",
    );
    this.logger.keyValue(
      "Human Check",
      this.isHumanCheckValid()
        ? `Until ${new Date(this.getHumanVerifiedUntil()).toLocaleString()}`
        : "Expired",
      {
        valueStyle: this.isHumanCheckValid()
          ? this.logger.c.greenBright
          : this.logger.c.yellowBright,
      },
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
    this.logger.keyValue(
      "Check-In Streak",
      `${user["checkinStreak"] || 0} (last ${user["checkinLastDay"] || "never"})`,
    );

    const discountPercent = await this.readNftDiscountPercent();

    if (discountPercent) {
      this.logger.keyValue(
        "Genesis NFTs",
        `${this.countNftHoldings(await this.readNftHoldings())} (${discountPercent}% off the fee)`,
        { valueStyle: this.logger.c.greenBright },
      );
    }

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
  /* Check-in                                                              */
  /* --------------------------------------------------------------------- */

  /** Today and yesterday as the page dates them, in UTC */
  getCheckInDays() {
    const today = new Date().toISOString().slice(0, 10);
    const yesterday = new Date(Date.now() - 86400000)
      .toISOString()
      .slice(0, 10);

    return { today, yesterday };
  }

  /** Check in once a day, which the page offers until the day is marked */
  async checkInDaily() {
    const user = this.getAccountDetails();
    const { today, yesterday } = this.getCheckInDays();

    if (user["checkinLastDay"] === today) {
      this.logger.info("Already checked in today.");
      return;
    }

    const streak =
      user["checkinLastDay"] === yesterday
        ? (Number(user["checkinStreak"]) || 0) + 1
        : 1;
    const day = ((streak - 1) % CHECKIN_REWARDS.length) + 1;
    const result = await this.dailyCheckIn();

    if (!result?.["success"]) {
      this.logger.warn(
        `Failed to check in: ${result?.["error"] || "Unknown error"}`,
      );
      return;
    }

    if (result["user"]) {
      this.account_data.user = result["user"];
    } else {
      user["checkinStreak"] = result["streak"] ?? streak;
      user["checkinLastDay"] = today;
    }

    this.logger.success(
      `Checked in for day ${day}, +${result["reward"] ?? CHECKIN_REWARDS[day - 1]} MRG.`,
    );
  }

  /* --------------------------------------------------------------------- */
  /* Wallet                                                                */
  /* --------------------------------------------------------------------- */

  /** The address the drop currently has the account on */
  getConnectedWalletAddress() {
    return this.account_data?.user?.["tonWalletAddress"] || null;
  }

  /** The holding the drop credits the account with */
  getWalletHolding() {
    return new Decimal(this.account_data?.user?.["tonWalletBalance"] || 0);
  }

  /** Re-read the connected wallet on-chain and send it to the drop, which re-reads it too */
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

  /** Re-sync the bound address at its on-chain holding, which needs no proof */
  async connectWalletAddress(address) {
    if (address !== this.getConnectedWalletAddress()) {
      return {
        status: false,
        message: "MRG needs the wallet phrase to sign a TON proof",
      };
    }

    return this.reportWallet(address, await this.readOnChainHolding(address));
  }

  /** Bind the wallet a key pair controls, signing the TON proof the drop asks for */
  async connectSignedWallet(keyPair, version) {
    const wallet = createWallet(keyPair.publicKey, Number(version));
    const address = wallet.address.toString({ bounceable: false });
    const holding = await this.readOnChainHolding(address);

    const tonProof = await buildTonProof({
      wallet,
      secretKey: keyPair.secretKey,
      domain: TON_PROOF_DOMAIN,
      payload: await this.fetchTonProofPayload(),
    });

    const result = await this.reportWallet(address, holding, tonProof);

    if (result.status) {
      await this.rememberWalletVersion(version);
    }

    return result;
  }

  /** Bind an address at the holding it is reported with, which the drop takes at face value */
  async reportWallet(address, holding, tonProof) {
    const amount = new Decimal(holding);

    /** A different wallet holds different NFTs */
    if (address !== this.getConnectedWalletAddress()) {
      this.nftHoldings = null;
    }

    this.logger.info(
      `Syncing ${address} at ${this.formatAmount(amount)} MRG...`,
    );

    const result = await this.connectWallet(
      address,
      amount.toNumber(),
      tonProof,
    );

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

  /* --------------------------------------------------------------------- */
  /* Genesis NFTs                                                          */
  /* --------------------------------------------------------------------- */

  /** The account's Genesis NFTs, read once per run */
  async readNftHoldings(address = this.getConnectedWalletAddress()) {
    if (!address) return [];
    if (this.nftHoldings) return this.nftHoldings;

    return (this.nftHoldings = await this.fetchNftHoldings(address));
  }

  /** Ask TonAPI for the address' Genesis NFTs, grouped by rarity */
  async fetchNftHoldings(address) {
    const response = await fetchTonApi(
      `/accounts/${address}/nfts?collection=${GENESIS_NFT_COLLECTION}&limit=50&indirect_ownership=true`,
      { signal: this.signal },
    ).catch((error) => {
      this.logger.warn("Failed to read NFTs on-chain:", error.message);
      return null;
    });

    const holdings = new Map();

    for (const item of response?.data?.["nft_items"] || []) {
      const rarity = this.getNftRarity(item);
      const holding = holdings.get(rarity);

      if (holding) {
        holding.quantity += 1;
      } else {
        holdings.set(rarity, {
          name: rarity.charAt(0).toUpperCase() + rarity.slice(1),
          type: rarity,
          quantity: 1,
        });
      }
    }

    return [...holdings.values()];
  }

  /** An NFT's rarity, from its `Rarity` attribute or, failing that, its name */
  getNftRarity(item) {
    const attributes = item?.["metadata"]?.["attributes"];
    const attribute = Array.isArray(attributes)
      ? attributes.find((entry) => entry["trait_type"] === "Rarity")?.["value"]
      : null;

    const rarity = String(
      attribute || item?.["metadata"]?.["name"] || "",
    ).toLowerCase();

    if (rarity.includes("mythic")) return "mythical";
    if (rarity.includes("rare")) return "rare";

    return "common";
  }

  /** How many NFTs the holdings add up to */
  countNftHoldings(holdings) {
    return (holdings || []).reduce(
      (total, holding) => total + (holding.quantity || 0),
      0,
    );
  }

  /** What the holdings take off the withdrawal fee, in percent */
  getNftDiscountPercent(holdings) {
    if (!holdings?.length) return 0;

    /** Any three earn more together than the rarest of them earns alone */
    if (this.countNftHoldings(holdings) >= NFT_BUNDLE_SIZE) {
      return NFT_BUNDLE_DISCOUNT;
    }

    return holdings.reduce(
      (best, holding) =>
        holding.quantity > 0
          ? Math.max(best, NFT_RARITY_DISCOUNTS[holding.type] || 0)
          : best,
      0,
    );
  }

  /** The discount the account's NFTs earn it, never below what the drop itself reports */
  async readNftDiscountPercent() {
    return Math.max(
      this.getNftDiscountPercent(await this.readNftHoldings()),
      Number(this.account_data?.user?.["nftDiscountPercent"]) || 0,
    );
  }

  /** The withdrawal fee once the NFT discount is applied */
  getWithdrawalFee(discountPercent = 0) {
    const fee = new Decimal(WITHDRAWAL_FEE);

    return Decimal.max(fee.minus(fee.mul(discountPercent).div(100)), 0);
  }

  /* --------------------------------------------------------------------- */
  /* Verification                                                          */
  /* --------------------------------------------------------------------- */

  /** Poll the drop until it sees the verification transfer */
  async pollVerification(attempts = VERIFICATION_CHECK_ATTEMPTS) {
    for (let attempt = 0; attempt < attempts; attempt++) {
      if (this.signal.aborted) break;

      await this.utils.delayForSeconds(VERIFICATION_CHECK_INTERVAL_SECONDS, {
        signal: this.signal,
      });

      const result = await this.checkVerification();

      if (result?.["success"] && result["status"] === "verified") {
        await this.loadAccount();
        this.logger.success("Account verified on-chain.");
        return { status: true };
      }

      if (result?.["success"] === false) {
        return {
          status: false,
          message: result["error"] || "Verification failed",
        };
      }

      if (result?.["status"] === "underpaid") {
        return {
          status: false,
          message: `Paid ${result["amountGram"]} TON, verification needs ${result["requiredGram"]}`,
        };
      }
    }

    this.logger.warn("The verification transfer has not been seen yet.");
    return { status: false, message: "Not confirmed yet, check again" };
  }

  /** Pay the one-time verification transfer from the wallet's phrase, unless it is already settled or on its way */
  async verifyWalletIfNeeded({ phrase, version, apiKey }) {
    const info = await this.fetchVerificationInfo();

    if (info?.["verified"] && !info["verificationRequired"]) {
      return { status: true };
    }

    const payment = info?.["payment"];

    if (!payment?.["address"] || !payment?.["amountNano"]) {
      const message = info?.["error"] || "The drop returned no transfer";

      this.logger.warn("Failed to start verification:", message);
      return { status: false, message };
    }

    if (!phrase) {
      return { status: false, message: "No phrase to pay verification with" };
    }

    /** A transfer already sent is only checked, so it is never paid twice */
    const sentAt = Number(await this.storage?.get("verificationSentAt")) || 0;

    if (Date.now() - sentAt < VERIFICATION_RETRY_HOURS * 60 * 60 * 1000) {
      this.logger.info("Verification was paid already, checking it...");
      return this.pollVerification(1);
    }

    const wallet = this.utils.wallet.createTonWallet({
      phrase,
      version,
      apiKey,
    });
    const address = await wallet.getAddress();
    const connected = this.getConnectedWalletAddress();

    /** Only a payment from the bound wallet counts */
    if (!connected || !this.utils.isSameTonAddress(connected, address)) {
      const message = "The phrase does not match the connected wallet";

      this.logger.warn(message);
      return { status: false, message };
    }

    const amount = BigInt(payment["amountNano"]);
    const amountTon = new Decimal(amount.toString()).div(1e9);
    const tonBalance = await wallet
      .getBalance({ signal: this.signal })
      .catch(() => new Decimal(0));

    if (tonBalance.lessThan(amountTon.plus(VERIFICATION_GAS_TON))) {
      const message = `Verification needs ${amountTon.plus(VERIFICATION_GAS_TON)} TON, the wallet holds ${tonBalance}`;

      this.logger.warn(message);
      return { status: false, message };
    }

    const seqno = await wallet.send({
      to: payment["address"],
      value: amount,
      body: payment["payload"]
        ? Cell.fromBase64(payment["payload"])
        : undefined,
    });

    /** Recorded before confirming, so a lost confirmation is never paid twice */
    await this.storage?.set("verificationSentAt", Date.now());
    await wallet.waitForConfirmation(seqno);

    this.logger.success(
      `Sent ${amountTon} TON to ${payment["address"]} for verification.`,
    );

    return this.pollVerification();
  }

  /* --------------------------------------------------------------------- */
  /* Levels                                                                */
  /* --------------------------------------------------------------------- */

  /** The level the drop is currently mining at */
  getActiveLevel() {
    return Number(this.account_data?.["activeLevel"]) || 0;
  }

  /** The MRG holding a level is unlocked with, priced exactly as the Miners Store does */
  getRequiredHoldingForLevel(level) {
    return new Decimal(getMinerRequiredHolding(level));
  }

  /** What the drop levels against: the in-app balance, plus the wallet once one is connected */
  getLevelHolding() {
    const user = this.getAccountDetails();
    const inAppBalance = new Decimal(user["inAppBalance"] || 0);

    return this.getConnectedWalletAddress()
      ? inAppBalance.plus(this.getWalletHolding())
      : inAppBalance;
  }

  /** The mining speed, in TH/s, a level runs at */
  getSpeedForLevel(level) {
    return getMinerSpeed(level);
  }

  /** The MRG a level mines per day */
  getDailyOutputForLevel(level) {
    return getMinerDailyOutput(level);
  }

  /** The highest level a holding covers, with a connected wallet granting level 1 for free */
  findLevelForHolding(holding, walletConnected = true) {
    return findMinerLevelForHolding(
      new Decimal(holding).toNumber(),
      walletConnected,
    );
  }

  /** Unlock the highest level the current holding covers */
  async unlockAffordableLevel() {
    if (!this.getConnectedWalletAddress()) {
      this.logger.info("Levels need a connected wallet.");
      return;
    }

    const holding = this.getLevelHolding();
    const activeLevel = this.getActiveLevel();
    const targetLevel = this.findLevelForHolding(holding);

    if (targetLevel <= activeLevel) {
      this.logger.info(
        `Level ${activeLevel} is the highest ${this.formatAmount(holding)} MRG covers.`,
      );
      return;
    }

    return this.unlockToLevel(targetLevel);
  }

  /** Unlock a level, which the backend grants against the holding */
  async unlockToLevel(level) {
    const result = await this.unlockLevel(level);

    if (!result?.["success"]) {
      const message = result?.["error"] || "Unknown error";

      this.logger.warn(`Failed to unlock level ${level}: ${message}`);
      return { status: false, message };
    }

    this.account_data["activeLevel"] = level;

    if (result["user"]) {
      this.account_data.user = result["user"];
    }

    this.logger.success(
      `Unlocked level ${level} at ${this.getSpeedForLevel(level)} TH/s.`,
    );

    return { status: true };
  }

  /* --------------------------------------------------------------------- */
  /* Mining                                                                */
  /* --------------------------------------------------------------------- */

  /** The 24h session the miner runs in, from its last snapshot, in seconds */
  getMiningWindow() {
    const timestamp =
      this.account_data?.user?.["miningSnapshot"]?.["timestamp"];
    const startedAt = timestamp
      ? Math.floor(new Date(timestamp).getTime() / 1000)
      : 0;
    const freezesAt = startedAt ? startedAt + MINING_WINDOW_SECONDS : 0;

    return {
      startedAt,
      freezesAt,
      frozen: Boolean(freezesAt) && Date.now() / 1000 >= freezesAt,
    };
  }

  /** Claim what the miner has produced since the last claim, which also starts a new window */
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
  /* --------------------------------------------------------------------- */

  /** Every task the drop is currently offering */
  getTasks() {
    return this.account_data?.["tasks"] || [];
  }

  /** The tasks the drop has already settled for good */
  getCompletedTaskIds() {
    return this.account_data?.["completedTaskIds"] || [];
  }

  /** The window a recurring task waits out, in milliseconds */
  getTaskCooldownMs(task) {
    const hours =
      TASK_COOLDOWN_HOURS[task["taskType"]] ?? DEFAULT_TASK_COOLDOWN_HOURS;

    return hours * 60 * 60 * 1000;
  }

  /** Whether the local record says a recurring task is still cooling down */
  isTaskOnCooldown(task) {
    const claimedAt = Number(this.taskClaims?.[task["taskId"]]) || 0;

    return claimedAt + this.getTaskCooldownMs(task) > Date.now();
  }

  /** Remember when a task was claimed, so the next pass can wait it out */
  recordTaskClaim(taskId) {
    this.taskClaims = { ...(this.taskClaims || {}), [taskId]: Date.now() };
  }

  /** Whether a task is settled against the wallet's holding rather than a link */
  isHoldTask(task) {
    return HOLD_TASK_TYPES.includes(task["verificationType"]);
  }

  /** Whether the wallet holds what a hold task asks for, so a claim is not wasted on it */
  async meetsHoldRequirement(task) {
    if (!this.getConnectedWalletAddress()) return false;

    if (task["verificationType"] === "token_hold") {
      return this.getWalletHolding().greaterThanOrEqualTo(
        task["minHolding"] || 0,
      );
    }

    return (
      this.countNftHoldings(await this.readNftHoldings()) >=
      (task["minNfts"] || 1)
    );
  }

  /** Whether a task is worth spending a claim on right now */
  isTaskClaimable(task) {
    if (task["isPaused"]) return false;

    /** The drop checks membership, so a chat the farmer may not join is not worth a claim */
    if (
      !this.isHoldTask(task) &&
      !this.validateTelegramTask(this.getTaskUrl(task))
    ) {
      return false;
    }

    if (!task["taskType"] || task["taskType"] === "one_time") {
      return (
        !this.getCompletedTaskIds().includes(task["taskId"]) &&
        !this.isTaskOnCooldown(task)
      );
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

      if (this.isHoldTask(task) && !(await this.meetsHoldRequirement(task))) {
        continue;
      }

      await this.completeTask(task);
    }
  }

  /** The task's link with any referral swapped for this account, as the page opens it */
  getTaskUrl(task) {
    const userId = String(this.getUserId() || "0");

    return String(task["url"] || "")
      .replace(/REFCODE/g, userId)
      .replace(/(startapp=ref_)[A-Za-z0-9_]+/g, `$1${userId}`)
      .replace(/(startapp%3Dref_)[A-Za-z0-9_]+/g, `$1${userId}`);
  }

  /** Complete one task the way the page does: open it, dwell, then claim; a hold task is claimed straight away */
  async completeTask(task) {
    if (!this.isHoldTask(task)) {
      await this.openTaskLink(this.getTaskUrl(task), TASK_DWELL_SECONDS);
    }

    const result = await this.claimTask(task["taskId"]);

    if (result?.["success"]) {
      this.recordTaskClaim(task["taskId"]);
      this.logger.success(
        `Claimed "${task["title"]}" for ${task["reward"]} MRG.`,
      );
    } else {
      /** A hold the drop has not counted long enough yet is retried after the task's window */
      if (this.isHoldTask(task)) {
        this.recordTaskClaim(task["taskId"]);
      }

      this.logger.warn(
        `Skipped "${task["title"]}": ${result?.["error"] || "Unknown error"}`,
      );
    }

    await this.utils.delayForSeconds(5, { signal: this.signal });
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

  /** The account's withdrawals, as its transaction history lists them */
  getWithdrawals() {
    const transactions = this.account_data?.["transactions"] || [];

    return transactions.filter((transaction) =>
      String(transaction["type"] || "")
        .toLowerCase()
        .includes("withdraw"),
    );
  }

  /** The payouts the drop has not settled yet */
  getPendingWithdrawals() {
    return this.getWithdrawals().filter((transaction) => {
      const status = String(transaction["status"] || "").toLowerCase();

      return status === "pending" || status === "processing";
    });
  }

  /** How long until the drop takes another request, counted from the last completed payout */
  getWithdrawalCooldownMs() {
    const lastCompletedAt = this.getWithdrawals()
      .filter(
        (transaction) =>
          transaction["status"] === "Completed" && transaction["updatedAt"],
      )
      .map((transaction) => new Date(transaction["updatedAt"]).getTime())
      .reduce((latest, time) => Math.max(latest, time), 0);

    if (!lastCompletedAt) return 0;

    return Math.max(
      0,
      lastCompletedAt + WITHDRAWAL_COOLDOWN_HOURS * 60 * 60 * 1000 - Date.now(),
    );
  }

  /** Format a cooldown as hours and minutes */
  formatCooldown(ms) {
    const hours = Math.floor(ms / 3600000);
    const minutes = Math.floor((ms % 3600000) / 60000);

    return `${hours}h ${minutes}m`;
  }

  /** Whether the drop still owes this account a settlement */
  async hasPendingWithdrawal() {
    await this.ensureStateLoaded();

    return this.getPendingWithdrawals().length > 0;
  }

  /** The account's own withdrawal queue, which this drop never flags and never counts as approved */
  async getAutoWithdrawals() {
    await this.ensureStateLoaded();

    return { pending: this.getPendingWithdrawals(), flagged: [] };
  }

  /** How old the signed `initData` is, in seconds, which the backend caps for withdrawals */
  getInitDataAgeSeconds() {
    const authDate = Number(
      new URLSearchParams(this.getInitData() || "").get("auth_date"),
    );

    return authDate ? Date.now() / 1000 - authDate : 0;
  }

  /** A Turnstile token for the withdrawal, or none, which the page also sends when the widget fails */
  async solveWithdrawalTurnstile() {
    if (!this.canSolveTurnstile()) return "";

    try {
      return await this.solveTurnstile({
        siteKey: TURNSTILE_SITE_KEY,
        pageUrl: TURNSTILE_PAGE_URL,
      });
    } catch (error) {
      this.logger.warn("Withdrawal Turnstile failed:", error.message);
      return "";
    }
  }

  /** Place withdrawal */
  async placeWithdrawal({ max, difference }) {
    await this.ensureStateLoaded();

    const user = this.getAccountDetails();
    const destinationAddress = user["tonWalletAddress"];

    if (!destinationAddress) {
      return this.skipWithdrawal("No wallet connected!");
    }

    if (!this.isAccountVerified(user)) {
      return this.skipWithdrawal("Account is not verified on-chain!", {
        log: "warn",
      });
    }

    if (this.getInitDataAgeSeconds() > INIT_DATA_MAX_AGE_SECONDS) {
      return this.skipWithdrawal("Session is too old, reopen the app!", {
        log: "warn",
      });
    }

    if (this.getPendingWithdrawals().length > 0) {
      return this.skipWithdrawal("A withdrawal is already pending!", {
        log: "warn",
      });
    }

    const cooldown = this.getWithdrawalCooldownMs();

    if (cooldown > 0) {
      return this.skipWithdrawal(
        `Next withdrawal in ${this.formatCooldown(cooldown)}!`,
        { log: "warn" },
      );
    }

    const balance = new Decimal(user["inAppBalance"] || 0);
    const minimum = this.getMinimumWithdrawal();
    const lowBalance = this.skipLowBalance(balance, minimum);

    if (lowBalance) return lowBalance;

    /** The NFTs the wallet holds decide both the ceiling and the fee */
    const discountPercent = await this.readNftDiscountPercent();

    const amount = this.pickWithdrawalAmount({
      balance,
      minimum,
      max,
      difference,
    });

    let result;

    try {
      await this.ensureHumanCheck();

      const captchaToken = await this.solveWithdrawalCaptcha();
      const turnstileToken = await this.solveWithdrawalTurnstile();
      const request = () =>
        this.requestWithdrawal(
          amount,
          destinationAddress,
          captchaToken,
          turnstileToken,
        );

      result = await request();

      /** The page signs in again once and resends when the backend lost the session */
      if (!result?.["success"] && result?.["code"] === "NO_APP_SESSION") {
        await this.verifyAccount();
        result = await request();
      }
    } catch (error) {
      result = { success: false, error: error.message || "Unknown error" };
    }

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
        Decimal.max(
          amount.minus(this.getWithdrawalFee(discountPercent)),
          0,
        ).toString(),
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

  /** Pass the withdrawal slider, fetching a fresh puzzle after each refusal */
  async solveWithdrawalCaptcha() {
    let lastError = "The slider captcha was refused";

    for (let attempt = 1; attempt <= SLIDER_CAPTCHA_ATTEMPTS; attempt++) {
      if (this.signal.aborted) break;

      const challenge = await this.createCaptcha();

      if (!challenge?.["success"] || !challenge["captchaId"]) {
        throw new Error(challenge?.["error"] || "Failed to get a captcha");
      }

      const sliderX = await this.solveSliderCaptcha(challenge);

      /** The page posts the drag only after the pointer is released */
      const trace = buildSliderTrace(sliderX);

      await this.utils.delayForSeconds(trace.at(-1)[0] / 1000, {
        signal: this.signal,
      });

      const result = await this.verifyCaptcha(
        challenge["captchaId"],
        sliderX,
        trace,
      );

      if (result?.["success"] && result["captchaToken"]) {
        return result["captchaToken"];
      }

      lastError = result?.["error"] || lastError;
      this.logger.warn(`Captcha attempt ${attempt} refused: ${lastError}`);
    }

    throw new Error(lastError);
  }

  /** Where the slider piece fits, as the `sliderX` the drop expects (0 to 263 on a 320px canvas) */
  async solveSliderCaptcha(challenge) {
    const sliderX = findSliderX(challenge);

    this.logger.info("Slider captcha answer:", sliderX);

    return sliderX;
  }

  /** Log the payouts the drop has not settled yet */
  async logWithdrawalStatus() {
    await this.ensureStateLoaded();

    const pending = this.getPendingWithdrawals();
    const discountPercent = await this.readNftDiscountPercent();

    this.logger.newline();
    this.logCurrentUser();
    this.logger.keyValue(
      "Balance",
      this.formatAmount(this.getAccountDetails()["inAppBalance"]),
    );
    this.logger.keyValue("Minimum", this.getMinimumWithdrawal());
    this.logger.keyValue(
      "Verified",
      this.isAccountVerified(this.getAccountDetails()) ? "Yes" : "No",
      {
        valueStyle: this.isAccountVerified(this.getAccountDetails())
          ? this.logger.c.greenBright
          : this.logger.c.yellowBright,
      },
    );

    const cooldown = this.getWithdrawalCooldownMs();

    this.logger.keyValue(
      "Next Withdrawal",
      cooldown > 0 ? `In ${this.formatCooldown(cooldown)}` : "Now",
    );
    this.logger.keyValue(
      "Fee",
      this.formatAmount(this.getWithdrawalFee(discountPercent)),
      {
        valueStyle: discountPercent
          ? this.logger.c.greenBright
          : this.logger.c.yellowBright,
      },
    );

    if (discountPercent) {
      this.logger.keyValue("NFT Discount", `${discountPercent}%`, {
        valueStyle: this.logger.c.greenBright,
      });
    }
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

  /** Claim pending mining so the summary reflects the current balance */
  async refreshAutoState() {
    return this.claimPendingMining();
  }

  /** Re-read the account, without the wallet sync that makes the drop re-read the chain */
  async refreshAutoSummary() {
    await this.loadAccount();

    return this.getAutoSummary();
  }

  /** Bind a wallet from its phrase, since the drop wants a signed TON proof */
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

      if (!status) {
        return { status: false, message };
      }

      await this.afterAutoWalletConnected();

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

  /** Pay the one-time verification from the wallet's phrase, connecting the wallet first when the account has none */
  async verifyAutoWallet({ phrase, version, apiKey }) {
    try {
      await this.ensureStateLoaded();

      if (this.isAccountVerified(this.getAccountDetails())) {
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
        message: message || (status ? "Verified" : "Not confirmed yet"),
        summary: status
          ? await this.refreshAutoSummary()
          : this.getAutoSummary(),
      };
    } catch (error) {
      return { status: false, message: error.message || "Unknown error" };
    }
  }

  /** Put the account to work at the holding a boost just sent it */
  async startAutoMining() {
    await this.syncConnectedWallet();
    await this.unlockAffordableLevel();
    await this.claimPendingMining();

    return this.refreshAutoSummary();
  }

  /** Whether the drop lets the account withdraw, which an admin re-check revokes */
  isAccountVerified(user) {
    return Boolean(user["isVerified"]) && !user["isVerificationRequired"];
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
      mining: this.getMiningWindow(),
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
          ...this.createAutoWalletTools(),
          {
            id: "refresh-holding",
            icon: "reconnect",
            title: "Refresh Holding",
            action: this.refreshHolding.bind(this),
            dispatch: false,
          },
          {
            id: "report-balance",
            icon: "import",
            title: "Report Balance",
            action: this.reportBalanceInteractive.bind(this),
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
          {
            id: "nft-holdings",
            icon: "search",
            title: "NFT Holdings",
            action: this.logNftHoldings.bind(this),
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
            id: "daily-checkin",
            icon: "check",
            title: "Daily Check-In",
            action: this.checkInInteractive.bind(this),
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
        name: "Account",
        list: [
          {
            id: "human-check",
            icon: "kyc",
            title: "Human Check",
            action: this.renewHumanCheck.bind(this),
            dispatch: false,
          },
          {
            id: "reset-human-check",
            icon: "reconnect",
            title: "Reset Human Check",
            action: this.resetHumanCheck.bind(this),
            dispatch: false,
          },
        ],
      },
      {
        name: "Withdrawal",
        list: [
          {
            id: "inspect-captcha",
            icon: "search",
            title: "Inspect Captcha",
            action: this.inspectCaptcha.bind(this),
            dispatch: false,
          },
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

  /** Bind a wallet, prompting for the phrase that signs its TON proof */
  async connectWalletInteractive() {
    const input = await this.promptInput(
      "Enter your TON Wallet Phrase / Secret Key (hex):",
    );

    if (!(input || "").trim()) {
      this.logger.warn("No phrase provided.");
      return;
    }

    const keyPair = await keyPairFromPhraseOrSecretKey(input);
    const version = await this.promptInput({
      type: "select",
      text: "Select wallet version:",
      options: [
        { value: "5", label: "Wallet V5R1" },
        { value: "4", label: "Wallet V4" },
      ],
    });

    await this.ensureStateLoaded();

    const { status } = await this.connectSignedWallet(keyPair, version);

    if (status) {
      await this.unlockAffordableLevel();
    }
  }

  /** Unbind the wallet the account is on */
  async disconnectWalletInteractive() {
    await this.ensureStateLoaded();

    if (!this.getConnectedWalletAddress()) {
      this.logger.info("No wallet connected.");
      return;
    }

    const result = await this.disconnectWallet();

    if (!result?.["success"]) {
      this.logger.error(
        "Failed to disconnect:",
        result?.["error"] || "Unknown error",
      );
      return;
    }

    this.nftHoldings = null;
    await this.rememberWalletVersion(undefined);
    await this.loadAccount();
    this.logger.success("Wallet disconnected.");
  }

  /** Unlock what the derived wallet covers, then pay its verification since the phrase is known */
  async afterDerivedWalletConnected({ phrase, version } = {}) {
    await this.unlockAffordableLevel();

    if (!phrase || this.isAccountVerified(this.getAccountDetails())) return;

    const { status, message } = await this.verifyWalletIfNeeded({
      phrase,
      version,
    });

    if (!status) {
      this.logger.warn("Account not verified:", message || "not confirmed yet");
    }
  }

  /** Re-read the connected wallet on-chain and unlock what it now covers */
  async refreshHolding() {
    await this.ensureStateLoaded();

    const { status } = await this.syncConnectedWallet();

    if (status) {
      await this.unlockAffordableLevel();
    }
  }

  /** Report a holding of your own, prompting for it, since the drop takes the figure as given */
  async reportBalanceInteractive() {
    await this.ensureStateLoaded();

    const address = this.getConnectedWalletAddress();

    if (!address) {
      this.logger.warn(
        "No wallet connected. Use the Connect Wallet tool to bind one.",
      );
      return;
    }

    const input = await this.promptInput(
      "How much MRG should the drop credit?",
    );
    const trimmed = (input || "").trim();

    if (!trimmed) {
      this.logger.warn("No balance provided.");
      return;
    }

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

    const { status } = await this.reportWallet(address, holding);

    if (!status) return;

    const reachableLevel = this.findLevelForHolding(this.getLevelHolding());

    this.logger.keyValue("Reachable Level", reachableLevel);
    this.logger.keyValue(
      "Speed",
      `${this.getSpeedForLevel(reachableLevel)} TH/s`,
    );
  }

  /** Log the account's Genesis NFTs and what they are worth at withdrawal */
  async logNftHoldings() {
    await this.ensureStateLoaded();

    const address = this.getConnectedWalletAddress();

    if (!address) {
      this.logger.warn(
        "No wallet connected. Use the Connect Wallet tool to bind one.",
      );
      return;
    }

    /** Read afresh, since the tool is how a new NFT is checked for */
    this.nftHoldings = null;

    const holdings = await this.readNftHoldings(address);
    const discountPercent = this.getNftDiscountPercent(holdings);

    this.logger.newline();
    this.logger.keyValue("Wallet", address);
    this.logger.keyValue("Genesis NFTs", this.countNftHoldings(holdings), {
      valueStyle: holdings.length
        ? this.logger.c.greenBright
        : this.logger.c.yellowBright,
    });

    for (const holding of holdings) {
      this.logger.keyValue(holding.name, holding.quantity);
    }

    this.logger.newline();
    this.logger.keyValue("Fee Discount", `${discountPercent}%`);
    this.logger.keyValue(
      "Withdrawal Fee",
      this.formatAmount(this.getWithdrawalFee(discountPercent)),
    );
    this.logger.keyValue(
      "Drop sees an NFT holder",
      this.getAccountDetails()["isNftHolder"] ? "Yes" : "No",
    );

    return { holdings, discountPercent };
  }

  /** Fetch a withdrawal slider and log it, so the puzzle can be studied */
  async inspectCaptcha() {
    await this.ensureStateLoaded();

    const challenge = await this.createCaptcha();

    if (!challenge?.["success"]) {
      this.logger.error(
        "Failed to get a captcha:",
        challenge?.["error"] || "Unknown error",
      );
      return;
    }

    const describe = (image) => {
      const match = String(image || "").match(/^data:([^;,]+);base64,/);

      return match
        ? `${match[1]}, ${image.length - match[0].length} base64 chars`
        : `${String(image || "").length} chars`;
    };

    this.logger.newline();
    this.logger.keyValue("Captcha ID", challenge["captchaId"]);
    this.logger.keyValue("Piece Top", challenge["pieceTop"]);
    this.logger.keyValue("Piece Offset X", challenge["pieceOffsetX"]);
    this.logger.keyValue("Background", describe(challenge["bgImage"]));
    this.logger.keyValue("Piece", describe(challenge["pieceImage"]));
    this.logger.keyValue("Slider X", findSliderX(challenge));
    this.logger.keyValue(
      "Other Fields",
      Object.keys(challenge)
        .filter(
          (key) =>
            ![
              "success",
              "captchaId",
              "pieceTop",
              "pieceOffsetX",
              "bgImage",
              "pieceImage",
            ].includes(key),
        )
        .join(", ") || "None",
    );

    this.logger.newline();
    this.logger.info("Background:", challenge["bgImage"]);
    this.logger.info("Piece:", challenge["pieceImage"]);

    return challenge;
  }

  /** Pay the on-chain verification, prompting for the bound wallet's phrase */
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

  /** Show what the verification needs and ask the drop whether it has landed */
  async checkVerificationInteractive() {
    await this.ensureStateLoaded();

    const info = await this.fetchVerificationInfo();
    const payment = info?.["payment"] || {};

    this.logger.newline();
    this.logger.keyValue("Verified", info?.["verified"] ? "Yes" : "No");
    this.logger.keyValue("Via", info?.["via"] || "-");
    this.logger.keyValue(
      "Re-verify Required",
      info?.["verificationRequired"] ? "Yes" : "No",
    );
    this.logger.keyValue("Amount", `${payment["amountGram"] ?? "?"} TON`);
    this.logger.keyValue("To", payment["address"] || "-");
    this.logger.keyValue(
      "Exempt Holding",
      `${info?.["exemptWalletMrg"] ?? 5000} MRG`,
    );

    if (info?.["verified"]) return info;

    const check = await this.checkVerification();

    this.logger.keyValue("Payment", check?.["status"] || check?.["error"]);

    if (check?.["status"] === "verified") {
      await this.loadAccount();
    }

    return info;
  }

  /** Check in on demand */
  async checkInInteractive() {
    await this.ensureStateLoaded();
    await this.checkInDaily();
  }

  /** Claim mining on demand */
  async claimMiningInteractive() {
    await this.ensureStateLoaded();
    await this.claimPendingMining();
  }

  /** Unlock a level, prompting for which one and leaving the holding to the drop to judge */
  async unlockLevelInteractive() {
    await this.ensureStateLoaded();

    const input = await this.promptInput("Which level?");
    const level = Number((input || "").trim());

    if (!Number.isInteger(level) || level < 1 || level > MAXIMUM_MINER_LEVEL) {
      this.logger.warn(`Enter a level between 1 and ${MAXIMUM_MINER_LEVEL}.`);
      return;
    }

    const required = this.getRequiredHoldingForLevel(level);
    const holding = this.getLevelHolding();

    this.logger.newline();
    this.logger.keyValue("Level", level);
    this.logger.keyValue("Required Holding", this.formatAmount(required));
    this.logger.keyValue("Your Holding", this.formatAmount(holding));

    /** Reported rather than refused, so a level can be tried whatever the holding reads */
    if (holding.lessThan(required)) {
      this.logger.warn(
        `${this.formatAmount(required.minus(holding))} MRG short of level ${level}, asking anyway.`,
      );
    }

    await this.unlockToLevel(level);
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
}
