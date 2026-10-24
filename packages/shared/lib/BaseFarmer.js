import TaskRunner from "./farmer/TaskRunner.js";
import TelegramActions from "./farmer/TelegramActions.js";
import TelegramIdentity from "./farmer/TelegramIdentity.js";
import utils from "../utils/bundle.js";
import { createLaunchHash } from "../utils/telegram.js";
import createDebugger from "./farmer/createDebugger.js";
import { applyFarmerOptions } from "./farmer/farmerOptions.js";
import createFarmerCore from "./farmer/createFarmerCore.js";

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

  /** The drop's modules, which each farmer builds from its `context.js` */
  ctx = null;

  /** Tools built on first read, once the subclass's modules exist */
  #tools = null;

  /** Runs the farmer's tasks and tracks the current one */
  #tasks = null;

  /** Joining chats, editing the profile and refreshing the web app */
  #telegram = null;

  /** Who the farmer runs as, read from its Telegram web app */
  #identity = new TelegramIdentity({
    webApp: () => this.telegramWebApp,
    drop: () => this.constructor,
    startParam: () => this.startParam,
    fallbackLink: () => this.telegramLink || this.link,
  });

  constructor({ referralLink = null } = {}) {
    /** Host services the farmer's modules work through */
    this.core = createFarmerCore(this);

    this.#telegram = new TelegramActions({
      core: this.core,
      canJoin: (link) => this.canJoinTelegramLink(link),
      join: (link) => this.joinTelegramLink(link),
      canUpdateProfile: (options) => this.canUpdateProfile(options),
      updateProfile: (options) => this.updateProfile(options),
      allowProfileUpdates: () => this.allowProfileUpdates,
      launch: () => ({
        platform: this.platform,
        type: this.type,
        telegramLink: this.telegramLink,
        client: this.client,
      }),
      setTelegramWebApp: (telegramWebApp) => this.configure({ telegramWebApp }),
    });

    this.#tasks = new TaskRunner({
      core: this.core,
      quickRun: () => this.quickRun,
    });

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
    this.debugger = createDebugger(() => this.debug);

    /** Whether this run was initiated by the scheduler (vs. user-triggered) */
    this.scheduled = false;

    /** Whether tasks may change the Telegram name or bio */
    this.allowProfileUpdates = false;

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

  /** Hand the farmer the dependencies its host provides, changing only the options given
   * @param {object} options - any of `FARMER_OPTIONS`: api, utils, logger, captcha, userAgent, deviceLocale, client, storage, telegramWebApp, controller, allowProfileUpdates, quickRun, prompts, autoWalletProvider, cacheAuth, cacheTelegramWebApp
   * @returns {this}
   */
  configure(options = {}) {
    applyFarmerOptions(this, options);
    return this;
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
    return this.#identity.initData();
  }

  /** Get Init Data Unsafe */
  getInitDataUnsafe(camelCase = false) {
    return this.#identity.initDataUnsafe(camelCase);
  }

  /** Get Init Data Hash */
  getInitDataHash() {
    return this.#identity.initDataHash();
  }

  /** Get Telegram User */
  getTelegramUser() {
    return this.#identity.user();
  }

  /** Get Fixed Random Number */
  getFixedRandomNumber() {
    return this.getUserRandomGenerator()();
  }

  /** Get User Random Generator */
  getUserRandomGenerator() {
    return this.#identity.randomGenerator(this.getUserId());
  }

  /** Get User ID */
  getUserId() {
    return this.#identity.userId();
  }

  /** Get Username */
  getUsername() {
    return this.#identity.username();
  }

  /** Get User First Name */
  getUserFirstName() {
    return this.#identity.firstName();
  }

  /** Get User Last Name */
  getUserLastName() {
    return this.#identity.lastName();
  }

  /** Get User Full Name */
  getUserFullName() {
    return this.#identity.fullName();
  }

  /** Get Profile Photo URL */
  getProfilePhotoUrl() {
    return this.#identity.photoUrl();
  }

  /** Get Is Premium User */
  getIsPremiumUser() {
    return this.#identity.isPremium();
  }

  /** Get Start Parameter */
  getStartParam() {
    return this.#identity.startParam();
  }

  /** The URL the mini app opens at, from initData when there is one */
  getLaunchURL() {
    return this.#identity.launchURL();
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
    await this.ctx.walletVersion.load();
  }

  /** Persist data */
  persist() {}

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

  /** The URL the mini app opens at with this initData, carrying the platform, version and theme Telegram adds
   * @param {string} initData
   * @param {{ platform?: string, version?: string, themeParams?: object }} [launch] - the real values when known
   */
  static getUrlFromInitData(initData, launch = {}) {
    const url = new URL(this.path, `https://${this.host}`);

    url.hash = `#${createLaunchHash({ initData, ...launch })}`;

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
    return this.#tasks.elapsed();
  }

  /** Execute a task with logging */
  executeTask(task, callback, allowInQuickRun = true) {
    return this.#tasks.execute(task, callback, allowInQuickRun);
  }

  /** When the farmer was created */
  get startedAt() {
    return this.#tasks.startedAt;
  }

  /** The task running now, for status reports */
  get currentTask() {
    return this.#tasks.currentTask;
  }

  /** When the current task started */
  get currentTaskStartedAt() {
    return this.#tasks.currentTaskStartedAt;
  }

  /** Validate Telegram Task */
  validateTelegramTask(link) {
    return this.#telegram.validateTask(link);
  }

  /** Try to join Telegram Link */
  tryToJoinTelegramLink(link) {
    return this.#telegram.tryToJoin(link);
  }

  /** Try to update profile */
  tryToUpdateProfile(options) {
    return this.#telegram.tryToUpdateProfile(options);
  }

  /** Update Web App Data */
  updateWebAppData() {
    return this.#telegram.refreshWebApp();
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
  /* Auto contract                                                         */
  /* --------------------------------------------------------------------- */

  /** Link a TON wallet to the account and refresh the drop's view of it
   * @param {object} wallet - { phrase, address, version, refresh }
   * @returns {Promise<{ status: boolean, summary?: object, message?: string }>}
   */
  connectAutoWallet(wallet) {
    return this.ctx.auto.connectWallet(wallet);
  }

  /** Connect the host's stored wallet as a task, skipped without a delay when there is nothing to do */
  async connectStoredAutoWallet() {
    if (!this.ctx.auto.canConnectStoredWallet()) return;

    await this.executeTask("Wallet", () => this.ctx.auto.connectStoredWallet());
  }

  /** Settle the drop's one-time wallet verification, for drops whose descriptor is `verifiable`
   * @param {object} wallet - { phrase, version, apiKey? }
   * @returns {Promise<{ status: boolean, skipped?: boolean, message?: string, summary?: object }>}
   */
  verifyAutoWallet(wallet) {
    return this.ctx.auto.verifyWallet(wallet);
  }

  /** Claim whatever is pending so the next summary reflects current balances */
  refreshAutoState() {
    return this.ctx.auto.refreshState();
  }

  /** Re-read the account and return a fresh summary */
  refreshAutoSummary() {
    return this.ctx.auto.refreshSummary();
  }

  /** Put the account to work at the holding it now has, and report it afresh */
  startAutoMining() {
    return this.ctx.auto.startMining();
  }

  /** Normalized account snapshot shared by every Auto drop, see `AutoModule.summary` */
  getAutoSummary() {
    return this.ctx.auto.summary();
  }

  /** Persist what this account looks like right now
   * @returns {Promise<object>} - the snapshot that was stored
   */
  storeAutoSnapshot() {
    return this.ctx.snapshot.store();
  }

  /** The withdrawal queue as the snapshot carries it, or null when unknown
   * @returns {Promise<{ pending: object[], approved: number|null, flagged: object[], checkedAt: number } | null>}
   */
  readAutoWithdrawals() {
    return this.ctx.snapshot.readWithdrawals();
  }

  /** Request a withdrawal, only when forced (auto or the Withdraw tool), skipping quietly otherwise
   * @returns {Promise<{ status: boolean, skipped: boolean, amount: string, message: string }>}
   */
  withdraw(options) {
    return this.ctx.flow.withdraw(options);
  }

  /** Whether the drop still owes this account a settlement
   * @returns {Promise<boolean>}
   */
  hasPendingWithdrawal() {
    return this.ctx.auto.hasPendingWithdrawal();
  }

  /** Both withdrawal gates for this account
   * @returns {Promise<{ pending: boolean, flagged: boolean }>}
   */
  getWithdrawalGuard() {
    return this.ctx.auto.withdrawalGuard();
  }

  /** Notify the server admin, a no-op unless the environment delivers the message
   * @param {string[]} messages
   */
  async notifyAdmin(messages) {
    return false;
  }

  /** Notify the account's own user, a no-op unless the environment delivers the message
   * @param {string[]} messages
   */
  async notifyUser(messages) {
    return false;
  }

  /** The referral the account launched with, read the way the pages read it */
  getReferrerStartParam() {
    return this.#identity.referrerStartParam();
  }

  /** Join a task's Telegram link when it is one, then dwell the way the page makes you wait */
  openTaskLink(url, dwellSeconds) {
    return this.#telegram.openTaskLink(url, dwellSeconds);
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
