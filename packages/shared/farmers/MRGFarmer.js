import BaseFarmer from "../lib/BaseFarmer.js";
import Decimal from "decimal.js";
import {
  MAXIMUM_MINER_LEVEL,
  findMinerLevelForHolding,
  getMinerDailyOutput,
  getMinerRequiredHolding,
  getMinerSpeed,
} from "../lib/auto/minerCurve.js";
import { buildTonProof } from "../lib/ton/proof.js";
import { createWallet, keyPairFromPhraseOrSecretKey } from "../lib/ton/wallet.js";
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
const STANDARD_WITHDRAWAL_LIMIT = 1000;
const PRIVILEGED_WITHDRAWAL_LIMIT = 500000;
const PRIVILEGED_HOLDING = 5000;

/** One withdrawal per this many hours, counted from the last completed one */
const WITHDRAWAL_COOLDOWN_HOURS = 24;

/** Safety margin above the drop's minimum, so a scheduled run does not withdraw the instant it crosses it */
const WITHDRAWAL_BUFFER = 200;

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
  static interval = "0 * * * *";
  static apiDelay = 500;
  static rating = 5;
  static published = false;

  static auto = {
    id: "mrg-auto",
    title: "MRG Auto",
    token: "MRG",
    jettonAddress: MRG_JETTON_ADDRESS,
    storagePrefix: "mrg-auto",
    minWithdrawal: MINIMUM_WITHDRAWAL,
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

  /** Answer a slider puzzle with where the piece was dropped */
  verifyCaptcha(captchaId, sliderX) {
    return this.postToApi("/captcha/verify", { captchaId, sliderX });
  }

  /** Request a payout to the connected wallet */
  requestWithdrawal(amount, destinationAddress, captchaToken) {
    return this.postToApi("/user/withdraw", {
      amount: Number(amount),
      destinationAddress,
      captchaToken,
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
    return this.loadAccount();
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

    await this.logAccountInfo();
    await this.executeTask("Human Check", () => this.ensureHumanCheck());
    await this.executeTask("Level", () => this.unlockAffordableLevel());
    await this.executeTask("Mining", () => this.claimPendingMining());
    await this.executeTask("Tasks", () => this.completeTasks());
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
    this.logger.keyValue("KYC", user["kycStatus"] || "none");

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
      `/accounts/${address}/nfts?collection=${GENESIS_NFT_COLLECTION}`,
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

  /** The discount the account's NFTs earn it */
  async readNftDiscountPercent() {
    return this.getNftDiscountPercent(await this.readNftHoldings());
  }

  /** The withdrawal fee once the NFT discount is applied */
  getWithdrawalFee(discountPercent = 0) {
    const fee = new Decimal(WITHDRAWAL_FEE);

    return Decimal.max(fee.minus(fee.mul(discountPercent).div(100)), 0);
  }

  /** Whether the account is on the raised withdrawal ceiling */
  isPrivilegedAccount(discountPercent = 0) {
    return (
      Boolean(this.getAccountDetails()["isNftHolder"]) ||
      discountPercent > 0 ||
      this.getWalletHolding().greaterThanOrEqualTo(PRIVILEGED_HOLDING)
    );
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

  /** Whether a task is worth spending a claim on right now */
  isTaskClaimable(task) {
    if (task["isPaused"]) return false;

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
    await this.openTaskLink(task["url"], TASK_DWELL_SECONDS);

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

  /** The most one request may carry, which the drop lifts for a Genesis NFT or a thousand MRG held */
  getWithdrawalLimit(discountPercent = 0) {
    return this.isPrivilegedAccount(discountPercent)
      ? PRIVILEGED_WITHDRAWAL_LIMIT
      : STANDARD_WITHDRAWAL_LIMIT;
  }

  /** Place withdrawal */
  async withdraw({ max, difference = 20, force = false } = {}) {
    const scheduledSkip = this.skipScheduledWithdrawal(force);

    if (scheduledSkip) return scheduledSkip;

    await this.ensureStateLoaded();

    const user = this.getAccountDetails();
    const destinationAddress = user["tonWalletAddress"];

    if (!destinationAddress) {
      return this.skipWithdrawal("No wallet connected!");
    }

    if (!this.isAccountVerified(user)) {
      return this.skipWithdrawal("Account is not KYC verified!", {
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

    /** The NFTs the wallet holds decide both the ceiling and the fee */
    const discountPercent = await this.readNftDiscountPercent();

    const amount = this.pickWithdrawalAmount({
      balance,
      minimum,
      max,
      difference,
      ceiling: this.getWithdrawalLimit(discountPercent),
    });

    let result;

    try {
      await this.ensureHumanCheck();

      const captchaToken = await this.solveWithdrawalCaptcha();

      result = await this.requestWithdrawal(
        amount,
        destinationAddress,
        captchaToken,
      );
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
      const result = await this.verifyCaptcha(challenge["captchaId"], sliderX);

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
    throw new Error("Slider captcha solving is not implemented yet");
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
    this.logger.keyValue("Limit", this.getWithdrawalLimit(discountPercent));
    this.logger.keyValue(
      "KYC Verified",
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

  /** Put the account to work at the holding a boost just sent it */
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
          {
            id: "report-balance",
            icon: "import",
            title: "Report Balance",
            action: this.reportBalanceInteractive.bind(this),
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
      "Withdrawal Limit",
      this.getWithdrawalLimit(discountPercent),
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
