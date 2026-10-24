import * as changeKeys from "change-case/keys";

import seedrandom from "seedrandom";
import utils from "../utils/bundle.js";
import AutoSnapshot from "./farmer/AutoSnapshot.js";
import AutoWalletConnector from "./farmer/AutoWalletConnector.js";
import WalletConnectPrompts from "./farmer/WalletConnectPrompts.js";
import WalletVersion from "./farmer/WalletVersion.js";
import WithdrawalFlow from "./farmer/WithdrawalFlow.js";
import createAutoWalletTools from "./farmer/autoWalletTools.js";
import createFarmerCore from "./farmer/createFarmerCore.js";
import {
  formatAccountLink,
  formatAmount,
  logCurrentUser,
  logMiningRateBreakdown,
} from "./farmer/format.js";
import { checkTokenContract, readOnChainHolding } from "./farmer/onChain.js";

export default class BaseFarmer {
  static id = "base-farmer";
  static platform = "telegram";
  static type = "webapp";
  static title = "Base Farmer";
  static emoji = "🐾";
  static enabled = true;
  static apiDelay = 200;
  static cacheAuth = false;
  static cacheTelegramWebApp = false;
  static telegramWebAppExpiry = 10;
  static syncToCloud = true;
  static cookies = false;
  static interval = "0 * * * *";
  static path = "/";
  static link = "";
  static telegramLink = "";
  static host = "";
  static referrerMode = "single";
  static domains = [];
  static withXSRFToken = false;
  static rating = 1;
  static startupDelay = 30;
  static deactivateOnError = true;
  static published = false;
  static singleton = false;
  static autoStart = false;
  static skipExecutionOfNewAccount = false;

  /** Auto descriptor, declared by farmers opting into the Auto wallet system
   * `verifiable` drops answer `verifyAutoWallet`, which the Auto runs on demand
   * `connectWithPhrase` drops sign with the phrase to connect, so the Auto password is asked
   * A null `jettonAddress` makes a native Auto, which boosts, collects and transfers TON itself
   * `currency` is the unit the drop keeps its own balance in, defaulting to `token`
   * @type {null | { id: string, title: string, token: string, currency?: string, jettonAddress?: string|null, storagePrefix: string, minWithdrawal?: number, verifiable?: boolean, connectWithPhrase?: boolean }}
   */
  static auto = null;

  /** Tools built on first read, once the subclass's modules exist */
  #tools = null;

  /** Shared collaborators driven by the overridable hooks */
  #hookedCollaborators = null;

  constructor({ referralLink = null } = {}) {
    /** Host services the farmer's modules work through */
    this.core = createFarmerCore(this);

    /* Register utilities */
    this.utils = utils;

    /** Configure caching */
    this.cacheAuth = this.constructor.cacheAuth;
    this.cacheTelegramWebApp = this.constructor.cacheTelegramWebApp;

    /** Configure properties */
    this.platform = this.constructor.platform;
    this.type = this.constructor.type;

    /** Configure startup link */
    this.configureStartupLink(referralLink);

    /** API */
    this.cookies = this.constructor.cookies;
    this.apiDelay = this.constructor.apiDelay;

    /* Debugger */
    this.debug = true;
    this.debugger = new Proxy(globalThis.console, {
      get: (target, prop) => {
        if (typeof target[prop] === "function") {
          return (...args) => {
            if (this.debug) {
              target[prop](...args);
            }
          };
        }
        return target[prop];
      },
    });

    /** Whether this run was initiated by the scheduler (vs. user-triggered) */
    this.scheduled = false;

    /** Whether tasks may change the Telegram name or bio */
    this.allowProfileUpdates = false;

    this.startedAt = new Date();
    this.currentTaskStartedAt = null;
    this.currentTask = null;

    this.controller = new AbortController();
    this.signal = this.controller.signal;
  }

  /** The tool groups the farmer offers, built on first read */
  get tools() {
    return (this.#tools ??= this.createTools?.() || []);
  }

  /** Configure Startup Link */
  configureStartupLink(link) {
    this.link = link || this.constructor.link;
    this.telegramLink = link || this.constructor.telegramLink;

    /* Parse Telegram Link */
    if (this.platform === "telegram") {
      const { entity, shortName, startParam } = this.utils.parseTelegramLink(
        this.telegramLink,
      );
      this.entity = entity;
      this.shortName = shortName;
      this.startParam = startParam;
    }
  }

  /** Set Prompt Functions */
  setPromptFunctions(functions) {
    this.promptInput = functions.promptInput;
    this.promptAnswer = functions.promptAnswer;
    this.promptCancel = functions.promptCancel;
  }

  /** Set the provider listing the Auto wallets, ranked with this drop's own Auto first
   * @param {object} provider - { getSources(): Array<{ id, title, own, accounts, decryptPhrase(account, password) }> }
   */
  setAutoWalletProvider(provider) {
    this.autoWalletProvider = provider;
  }

  /** Configure Auth Headers */
  configureAuthHeaders(data) {
    this.setAuthHeaders(this.getAuthHeaders(data));
  }

  /** Set Auth Headers */
  setAuthHeaders(headers) {
    this.api.defaults.headers.common = Object.assign(
      this.api.defaults.headers.common,
      headers,
    );
  }

  /** Set the API instance for making requests
   * @param {import("axios").AxiosInstance} api - Axios instance for API requests
   */
  setApi(api) {
    /** @type {import("axios").AxiosInstance} */
    this.api = api;
  }

  /** Set the Telegram Web App  */
  setTelegramWebApp(telegramWebApp) {
    this.telegramWebApp = telegramWebApp;
  }

  /** Set the Captcha Solver
   * @param {import("./CaptchaSolver.js").default} captcha - Captcha solver instance
   */
  setCaptcha(captcha) {
    this.captcha = captcha;
  }

  /** Set the Telegram Client
   * @param {import("./BaseTelegramWebClient.js").default} client - Telegram client instance
   */
  setTelegramClient(client) {
    return this.setClient(client);
  }

  /** Set the User Agent */
  setUserAgent(userAgent) {
    this.userAgent = userAgent;
  }

  /** Set whether tasks may change the Telegram profile */
  setAllowProfileUpdates(allowProfileUpdates = false) {
    this.allowProfileUpdates = Boolean(allowProfileUpdates);
  }

  /** Set the Quick Run */
  setQuickRun(quickRun = false) {
    this.quickRun = quickRun;
  }

  /** Set the Logger
   * @param {import("./BaseLogger.js").default} logger - Logger instance
   */
  setLogger(logger) {
    this.logger = logger;
  }

  /** Set the Telegram Client
   * @param {import("./BaseTelegramWebClient.js").default} client - Telegram client instance
   */
  setClient(client) {
    this.client = client;
  }

  /** Can Solve Turnstile */
  canSolveTurnstile() {
    return Boolean(this.captcha?.canSolve("turnstile"));
  }

  /** Can Solve ReCaptcha */
  canSolveReCaptcha() {
    return Boolean(this.captcha?.canSolve("recaptcha"));
  }

  /** Solve Turnstile, with the widget's optional action and cData */
  solveTurnstile({ siteKey, pageUrl, action, cData }) {
    return this.captcha?.solveTurnstile({ siteKey, pageUrl, action, cData });
  }

  /** Solve ReCaptcha */
  solveReCaptcha({ siteKey, pageUrl }) {
    return this.captcha?.solveReCaptcha({ siteKey, pageUrl });
  }

  /** Can Solve Image Captcha */
  canSolveImage() {
    return Boolean(this.captcha?.canSolve("base64"));
  }

  /** Solve Image Captcha */
  solveImage({ body }) {
    return this.captcha?.solveImage({ body });
  }

  /** Can Join Telegram Link */
  canJoinTelegramLink(link) {
    return Boolean(this.client);
  }

  /** Join Telegram Link */
  joinTelegramLink(link) {
    return this.client.joinTelegramLink(link);
  }

  /** Can Update Profile */
  canUpdateProfile(options) {
    return this.allowProfileUpdates && Boolean(this.client);
  }

  /** Update Profile */
  updateProfile(options) {
    return this.client.updateProfile(options);
  }

  /** Get Init Data */
  getInitData() {
    return this.telegramWebApp?.initData;
  }

  /** Get Init Data Unsafe */
  getInitDataUnsafe(camelCase = false) {
    return camelCase
      ? changeKeys.camelCase(this.telegramWebApp?.initDataUnsafe, Infinity)
      : this.telegramWebApp?.initDataUnsafe;
  }

  /** Get Init Data Hash */
  getInitDataHash() {
    return this.getInitDataUnsafe()?.hash;
  }

  /** Get Telegram User */
  getTelegramUser() {
    return this.getInitDataUnsafe()?.user;
  }

  /** Get Fixed Random Number */
  getFixedRandomNumber() {
    return this.getUserRandomGenerator()();
  }

  /** Get User Random Generator */
  getUserRandomGenerator() {
    return seedrandom(this.getUserId());
  }

  /** Get User ID */
  getUserId() {
    return this.getTelegramUser()?.id;
  }

  /** Get Username */
  getUsername() {
    return this.getTelegramUser()?.username;
  }

  /** Get User First Name */
  getUserFirstName() {
    return this.getTelegramUser()?.["first_name"] || "";
  }

  /** Get User Last Name */
  getUserLastName() {
    return this.getTelegramUser()?.["last_name"] || "";
  }

  /** Get User Full Name */
  getUserFullName() {
    const firstName = this.getUserFirstName();
    const lastName = this.getUserLastName();

    return `${firstName} ${lastName}`.trim();
  }

  /** Get Profile Photo URL */
  getProfilePhotoUrl() {
    const user = this.getTelegramUser();
    if (user && user["photo_url"]) {
      return user["photo_url"];
    }
    return null;
  }

  /** Get Is Premium User */
  getIsPremiumUser() {
    return this.getInitDataUnsafe()?.["is_premium"] || false;
  }

  /** Get Start Parameter */
  getStartParam() {
    return this.getInitDataUnsafe()?.["start_param"];
  }

  getLaunchURL() {
    if (this.getInitData()) {
      return this.constructor.getUrlFromInitData(this.getInitData());
    } else {
      return this.telegramLink || this.link;
    }
  }

  /** The shared context the ad clients in `lib/ads` take */
  getAdClientOptions() {
    return {
      api: this.api,
      initData: this.getInitData(),
      origin: `https://${this.constructor.host}`,
      launchURL: this.getLaunchURL(),
      userAgent: this.userAgent,
      storage: this.storage,
      logger: this.debugger,
      signal: () => this.signal,
    };
  }

  /** Restore cached auth data */
  restoreCachedAuthData(data) {}

  /** Load data, including the wallet version an Auto connected with */
  async load() {
    await this.#hooked.walletVersion.load();
  }

  /** Persist data */
  persist() {}

  /** Set Cache Auth */
  setCacheAuth(status) {
    this.cacheAuth = status;
  }

  /** Set cache telegram web app */
  setCacheTelegramWebApp(status) {
    this.cacheTelegramWebApp = status;
  }

  /** Configure primary link */
  static configurePrimaryLink(link) {
    if (link) {
      if (this.platform === "telegram") {
        this.telegramLink = link;
      } else {
        this.link = link;
      }
    }
  }

  /** Get URL from Init Data */
  static getUrlFromInitData(initData) {
    const url = new URL(this.path, `https://${this.host}`);
    const params = new URLSearchParams();

    params.set("tgWebAppData", initData);

    url.hash = `#${params.toString()}`;

    return url.toString();
  }

  /** Adopt an external abort signal */
  adoptSignal(signal) {
    if (signal) {
      this.signal = signal;
    }
  }

  /** Start the farmer */
  async start(signal) {
    /** Adopt signal */
    this.adoptSignal(signal);

    /** Delay for 3s */
    await this.utils.delayForSeconds(3, { signal: this.signal });

    /** Load data */
    await this.load();

    /** Start */
    await this.process();

    /** Persist */
    await this.persist();
  }

  /** Get elapsed time */
  getElapsedTime() {
    return this.utils.dateFns.formatDistanceToNowStrict(
      this.currentTaskStartedAt || new Date(),
    );
  }

  /** Execute a task with logging */
  async executeTask(task, callback, allowInQuickRun = true) {
    /** Update Task */
    this.currentTaskStartedAt = new Date();
    this.currentTask = task;

    /* Add newline */
    this.logger.newline();

    /* Check Aborted */
    if (this.signal?.aborted) {
      this.logger.warn(`✖ Task aborted: ${this.logger.c.magenta(task)}`);
      return;
    }

    /* Check Quick Run */
    const skipInQuickRun = this.quickRun && !allowInQuickRun;

    if (skipInQuickRun) {
      /* Log Skipped Task */
      this.logger.log(
        `${this.logger.c.yellow(
          "⚡ Skipping in quick run:",
        )} ${this.logger.c.magenta(task)}`,
      );
      return;
    }

    try {
      /* Log Task Start */
      this.logger.log(
        `${this.logger.c.gray("⚙ Executing task:")} ${this.logger.c.magenta(
          task,
        )}`,
      );

      /** Delay before processing task */
      await this.utils.delayForSeconds(5, { signal: this.signal });

      /* Execute Callback */
      await callback();

      /* Log Task Completion */
      this.logger.log(
        `${this.logger.c.green("✔ Completed task:")} ${this.logger.c.magenta(
          task,
        )}`,
      );
    } catch (error) {
      /* Log Task Error */
      this.logger.log(
        `${this.logger.c.red(
          "✖ Error executing task:",
        )} ${this.logger.c.magenta(task)}\n   ${this.logger.c.gray(
          error.message,
        )}`,
      );
      throw error;
    } finally {
      /** Delay before processing next task */
      await this.utils.delayForSeconds(5, { signal: this.signal });
    }
  }

  /** Validate Telegram Task */
  validateTelegramTask(link) {
    return (
      !this.utils.isTelegramChatLink(link) || this.canJoinTelegramLink(link)
    );
  }

  /** Try to join Telegram Link */
  async tryToJoinTelegramLink(link) {
    if (this.utils.isTelegramChatLink(link) && this.canJoinTelegramLink(link)) {
      try {
        /* Generate a random delay between 1 to 5 minutes */
        const duration = 1 + Math.floor(Math.random() * 5);

        /* Log Delayed Join */
        this.logger.log(
          `${this.logger.c.yellow("⏳ Delaying for")} ${this.logger.c.magenta(
            `${duration} minute(s)`,
          )} ${this.logger.c.yellow(
            "before joining Telegram link:",
          )} ${this.logger.c.magenta(link)}`,
        );

        /* Wait for a random duration between 1 to 5 minutes */
        await this.utils.delayForMinutes(duration, {
          signal: this.signal,
        });

        /* Try to Join Telegram Link */
        await this.joinTelegramLink(link);
        return true;
      } catch (error) {
        this.logger.error("Failed to join Telegram link:", error.message);
        return false;
      }
    }
  }

  /** Try to update profile */
  async tryToUpdateProfile(options) {
    if (!this.allowProfileUpdates) {
      this.logger.warn("Profile updates are disabled in settings");
      return false;
    }

    if (this.canUpdateProfile(options)) {
      try {
        await this.updateProfile(options);
        return true;
      } catch (error) {
        this.logger.error("Failed to update profile:", error.message);
        return false;
      }
    }
  }

  /** Update Web App Data */
  async updateWebAppData() {
    if (this.platform === "telegram" && this.type === "webapp") {
      const { url } = await this.client.getWebview(this.telegramLink);
      const { initData } = this.utils.extractTgWebAppData(url);

      this.setTelegramWebApp({
        initData,
        initDataUnsafe: this.utils.getInitDataUnsafe(initData),
      });
    }
  }

  /** Set Auth */
  async setAuth() {
    const auth = await this.fetchAuth();
    this.configureAuthHeaders(auth);
    return this;
  }

  /** Register Delay Interceptor */
  registerDelayInterceptor() {
    if (this.apiDelay) {
      this.api.interceptors.request.use(async (config) => {
        await this.utils.delay(this.apiDelay);
        return config;
      });
    }
  }

  /** Get Auth */
  fetchAuth() {
    return Promise.resolve(true);
  }

  /** Get Meta */
  fetchMeta() {
    return Promise.resolve(true);
  }

  /** Get Auth Headers */
  getAuthHeaders(data) {
    return {};
  }

  /** Make Request ID */
  makeRequestId() {
    return this.utils.uuid();
  }

  /** Determine if the request should be retried */
  shouldRetryRequest(error) {
    const retryAfter = error.response?.data?.retry_after;
    if (retryAfter) {
      return true;
    }
    return false;
  }

  /* --------------------------------------------------------------------- */
  /* Auto adapter                                                          */
  /* --------------------------------------------------------------------- */

  /** Shared collaborators driven by the hooks below, created on first use */
  get #hooked() {
    return (this.#hookedCollaborators ??= this.#createHookedCollaborators());
  }

  /** Wire the shared collaborators to this farmer's overridable hooks */
  #createHookedCollaborators() {
    const walletVersion = new WalletVersion(() => this.storage);
    const prompts = new WalletConnectPrompts({
      core: this.core,
      connect: (wallet) => this.connectAutoWallet(wallet),
      ensureLoaded: () => this.ensureStateLoaded(),
      afterConnected: (wallet) => this.afterDerivedWalletConnected(wallet),
    });

    return {
      walletVersion,
      prompts,
      connector: new AutoWalletConnector({
        connectAddress: (address) => this.connectWalletAddress(address),
        rememberVersion: (version) => walletVersion.remember(version),
        summary: () => this.getAutoSummary(),
        refreshSummary: () => this.refreshAutoSummary(),
        ensureLoaded: () => this.ensureStateLoaded(),
      }),
      flow: new WithdrawalFlow({
        core: this.core,
        place: (options) => this.placeWithdrawal(options),
        minimum: () => this.getMinimumWithdrawal(),
        logStatus: () => this.logWithdrawalStatus(),
      }),
      snapshot: new AutoSnapshot({
        core: this.core,
        summary: () => this.getAutoSummary(),
        withdrawals: () => this.getAutoWithdrawals(),
      }),
    };
  }

  /** The drop's declared minimum withdrawal, overridden by farmers whose backend publishes a live one */
  getMinimumWithdrawal() {
    return this.#hooked.flow.declaredMinimum();
  }

  /** The drop's token symbol, as its Auto descriptor names it */
  getAutoToken() {
    return this.#hooked.flow.token();
  }

  /** Read the drop's state once, overridden by farmers that keep one */
  async ensureStateLoaded() {}

  /** Bind an address to the account, implemented by farmers using the default `connectAutoWallet`
   * @returns {Promise<{ status: boolean, message?: string }>}
   */
  async connectWalletAddress(address) {
    throw new Error(
      "connectWalletAddress method must be implemented in subclass",
    );
  }

  /** Runs once a wallet is bound by `connectAutoWallet`, for drops with a follow-up step */
  async afterAutoWalletConnected() {}

  /** Link a TON wallet to the account and refresh the drop's view of it
   * @param {object} wallet - { phrase, address, version, refresh }
   * @returns {Promise<{ status: boolean, summary?: object, message?: string }>}
   */
  connectAutoWallet(wallet) {
    return this.#hooked.connector.connect(wallet);
  }

  /** Runs once the derived wallet is bound, for drops whose manual connect has a follow-up step
   * @param {object} wallet - { phrase, version, apiKey? }
   */
  async afterDerivedWalletConnected(wallet) {}

  /** Bind the wallet derived from this account's Telegram ID, as the TON Wallet Deriver builds it */
  connectDerivedWalletInteractive() {
    return this.#hooked.prompts.connectDerived();
  }

  /** Prompt for a wallet and bind it, implemented by every Auto drop */
  async connectWalletInteractive() {
    throw new Error(
      "connectWalletInteractive method must be implemented in subclass",
    );
  }

  /** Unbind the account's wallet, implemented by every Auto drop */
  async disconnectWalletInteractive() {
    throw new Error(
      "disconnectWalletInteractive method must be implemented in subclass",
    );
  }

  /** Wallet tools every Auto drop shares, each bound to the drop's own connect and disconnect */
  createAutoWalletTools() {
    return createAutoWalletTools({
      connect: () => this.connectWalletInteractive(),
      disconnect: () => this.disconnectWalletInteractive(),
      prompts: this.#hooked.prompts,
    });
  }

  /** Bind a wallet held by an Auto account, asking for the Auto password only when the drop needs the phrase */
  connectAutoAccountWalletInteractive() {
    return this.#hooked.prompts.connectFromAuto();
  }

  /** The wallet version an Auto connected with */
  get connectedWalletVersion() {
    return this.#hooked.walletVersion.current;
  }

  /** The drops never report a contract version, so the one the wallet was loaded with is kept here */
  rememberWalletVersion(version) {
    return this.#hooked.walletVersion.remember(version);
  }

  /** The address' balance of the drop's jetton, or TON on a native Auto, straight from the chain */
  readOnChainHolding(address) {
    return readOnChainHolding(this.core, address);
  }

  /** Warn if the drop has moved to a different jetton than the Auto tracks */
  checkTokenContract(contract) {
    return checkTokenContract(this.core, contract);
  }

  /** Settle the drop's one-time wallet verification, for drops whose descriptor is `verifiable`
   * @param {object} wallet - { phrase, version, apiKey? }
   * @returns {Promise<{ status: boolean, skipped?: boolean, message?: string, summary?: object }>}
   */
  async verifyAutoWallet(wallet) {
    throw new Error("verifyAutoWallet method must be implemented in subclass");
  }

  /** Claim whatever is pending so the next summary reflects current balances */
  async refreshAutoState() {
    throw new Error("refreshAutoState method must be implemented in subclass");
  }

  /** Re-read the account and return a fresh summary, defaulting to claim-then-snapshot
   * @returns {Promise<object>} - see `getAutoSummary`
   */
  async refreshAutoSummary() {
    await this.refreshAutoState();
    return this.getAutoSummary();
  }

  /** Put the account to work at the holding it now has, and report it afresh
   * @returns {Promise<object>} - see `getAutoSummary`
   */
  async startAutoMining() {
    return this.refreshAutoSummary();
  }

  /** Normalized account snapshot shared by every Auto drop, without `mining` for drops that mine off the clock
   * @returns {object} - {
   *   level, holding, balance, minWithdrawal, verified,
   *   protection: { revoked, dexBuyer } | undefined,
   *   mining: { startedAt, freezesAt, frozen } | undefined,
   *   wallet: { address, version } | null,
   *   exchange: { name, uid } | null | undefined,
   *   banned, banReason,
   *   risk: { score, updatedAt, flags: string[] }
   * }
   */
  getAutoSummary() {
    throw new Error("getAutoSummary method must be implemented in subclass");
  }

  /** Persist what this account looks like right now
   * @returns {Promise<object>} - the snapshot that was stored
   */
  storeAutoSnapshot() {
    return this.#hooked.snapshot.store();
  }

  /** A withdrawal that was not attempted, shaped as `withdraw` returns it and logged at `log` unless that is null */
  skipWithdrawal(message, options) {
    return this.#hooked.flow.skip(message, options);
  }

  /** A balance below the minimum as a skip, otherwise null after logging what is available */
  skipLowBalance(balance, minimum) {
    return this.#hooked.flow.skipLowBalance(balance, minimum);
  }

  /** The amount to request: capped, shaved by a random `difference` percent, then floored at the minimum */
  pickWithdrawalAmount(options) {
    return this.#hooked.flow.pickAmount(options);
  }

  /** Tell the admin about a withdrawal, but only when the run was initiated by the scheduler
   * @param {[string, string][]} rows - label and HTML value, after the account row
   */
  notifyWithdrawal(rows) {
    return this.#hooked.flow.notify(rows);
  }

  /** Log the payouts the drop has not settled yet, implemented by farmers using `withdrawInteractive` */
  async logWithdrawalStatus() {}

  /** Withdraw, prompting for the amount */
  withdrawInteractive() {
    return this.#hooked.flow.withdrawInteractive();
  }

  /** Request a withdrawal, only when forced (auto or the Withdraw tool), skipping quietly otherwise
   * @returns {Promise<{ status: boolean, skipped: boolean, amount: string, message: string }>}
   */
  withdraw(options) {
    return this.#hooked.flow.withdraw(options);
  }

  /** Place a forced withdrawal of up to `max`, shaved by a random `difference` percent */
  async placeWithdrawal({ max, difference }) {
    throw new Error("placeWithdrawal method must be implemented in subclass");
  }

  /** Whether the drop still owes this account a settlement
   * @returns {Promise<boolean>}
   */
  async hasPendingWithdrawal() {
    throw new Error(
      "hasPendingWithdrawal method must be implemented in subclass",
    );
  }

  /** Both withdrawal gates for this account
   * @returns {Promise<{ pending: boolean, flagged: boolean }>}
   */
  async getWithdrawalGuard() {
    return { pending: await this.hasPendingWithdrawal(), flagged: false };
  }

  /** The account's own withdrawal queue, for the stored snapshot
   * `approved` is optional, and a drop that omits it reports no payout record at all
   * @returns {Promise<{ pending: object[], approved?: object[], flagged: object[] } | null>}
   */
  async getAutoWithdrawals() {
    return null;
  }

  /** The withdrawal queue as the snapshot carries it, or null when unknown
   * @returns {Promise<{ pending: object[], approved: number|null, flagged: object[], checkedAt: number } | null>}
   */
  readAutoWithdrawals() {
    return this.#hooked.snapshot.readWithdrawals();
  }

  /** Notify the server admin, a no-op unless the environment delivers the message
   * @param {string[]} messages
   */
  async notifyAdmin(messages) {
    return false;
  }

  /** Format a token amount, keeping sub-1 values readable */
  formatAmount(value) {
    return formatAmount(value);
  }

  /** Log a daily mining rate spread across every period */
  logMiningRateBreakdown(dailyRate) {
    logMiningRateBreakdown(this.logger, dailyRate);
  }

  /** The referral the account launched with, read the way the pages read it */
  getReferrerStartParam() {
    return this.getStartParam() || this.startParam || "";
  }

  /** Join a task's Telegram link when it is one, then dwell the way the page makes you wait */
  async openTaskLink(url, dwellSeconds) {
    if (url && this.utils.isTelegramChatLink(url)) {
      await this.tryToJoinTelegramLink(url);
    }

    if (dwellSeconds) {
      await this.utils.delayForSeconds(dwellSeconds, { signal: this.signal });
    }
  }

  /** Format account link (Telegram HTML) */
  formatAccountLink(id) {
    return formatAccountLink(id);
  }

  /** Log Current User */
  logCurrentUser() {
    logCurrentUser(this.logger, this.getTelegramUser());
  }

  /** Process */
  async process() {
    throw new Error("process method must be implemented in subclass");
  }

  /** Get Referral Link */
  async getReferralLink() {
    throw new Error("getReferralLink method must be implemented in subclass");
  }

  /** Get Referrals Count */
  async getReferralsCount() {
    return 0;
  }

  /** Get Cookies */
  async getCookies(options) {
    throw new Error("getCookies method must be implemented in subclass");
  }
}
