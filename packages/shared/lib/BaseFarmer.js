import * as changeKeys from "change-case/keys";
import seedrandom from "seedrandom";

import utils from "../utils/bundle.js";

export default class BaseFarmer {
  static id = "base-farmer";
  static platform = "telegram";
  static type = "webapp";
  static title = "Base Farmer";
  static emoji = "🐾";
  static enabled = true;
  static apiDelay = 200;
  static cacheAuth = true;
  static cacheTelegramWebApp = true;
  static syncToCloud = true;
  static cookies = false;
  static interval = "*/10 * * * *";
  static link = "";
  static telegramLink = "";
  static host = "";
  static domains = [];
  static withXSRFToken = false;
  static rating = 1;
  static startupDelay = 300;

  constructor() {
    /* Register utilities */
    this.utils = utils;

    /* Static Properties */
    this.platform = this.constructor.platform;
    this.type = this.constructor.type;
    this.link = this.constructor.link;
    this.telegramLink = this.constructor.telegramLink;
    this.cookies = this.constructor.cookies;

    /* Parse Telegram Link */
    if (this.constructor.platform === "telegram") {
      const { entity, shortName, startParam } = this.utils.parseTelegramLink(
        this.constructor.telegramLink
      );
      this.entity = entity || null;
      this.shortName = shortName || null;
      this.startParam = startParam || null;
    }

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

    /* Initialize Tools */
    this.tools = this.createTools?.() || [];
  }

  /** Set Prompt Functions */
  setPromptFunctions(functions) {
    this.promptInput = functions.promptInput;
    this.promptAnswer = functions.promptAnswer;
    this.promptCancel = functions.promptCancel;
  }

  /** Configure Auth Headers */
  configureAuthHeaders(data) {
    this.api.defaults.headers.common = Object.assign(
      this.api.defaults.headers.common,
      this.getAuthHeaders(data)
    );
  }

  /**
   * Set the API instance for making requests.
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
    return this.captcha?.isConfigured();
  }

  /** Solve Turnstile */
  solveTurnstile({ siteKey, pageUrl }) {
    return this.captcha?.solveTurnstile({ siteKey, pageUrl });
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
    return Boolean(this.client);
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

  /** Get URL from Init Data */
  static getUrlFromInitData(initData) {
    const params = new URLSearchParams({
      tgWebAppData: initData,
    });
    return `https://${this.host}#${params.toString()}`;
  }

  /** Start the farmer */
  start(signal) {
    this.signal = signal || new AbortController().signal;
    return this.process();
  }

  /** Execute a task with logging */
  async executeTask(task, callback, allowInQuickRun = true) {
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
          "⚡ Skipping in quick run:"
        )} ${this.logger.c.magenta(task)}`
      );
      return;
    }

    try {
      /* Log Task Start */
      this.logger.log(
        `${this.logger.c.gray("⚙ Executing task:")} ${this.logger.c.magenta(
          task
        )}`
      );

      /* Execute Callback */
      await callback();

      /* Log Task Completion */
      this.logger.log(
        `${this.logger.c.green("✔ Completed task:")} ${this.logger.c.magenta(
          task
        )}`
      );
    } catch (error) {
      /* Log Task Error */
      this.logger.log(
        `${this.logger.c.red(
          "✖ Error executing task:"
        )} ${this.logger.c.magenta(task)}\n   ${this.logger.c.gray(
          error.message
        )}`
      );
      throw error;
    } finally {
      await this.utils.delayForSeconds(2);
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
      const { url } = await this.client.getWebview(
        this.constructor.telegramLink
      );
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
    const headers = await this.getAuthHeaders(auth);
    this.api.defaults.headers = {
      ...this.api.defaults.headers,
      ...headers,
    };
    return this;
  }

  /** Register Delay Interceptor */
  registerDelayInterceptor() {
    if (this.constructor.apiDelay) {
      this.api.interceptors.request.use(async (config) => {
        await this.utils.delay(this.constructor.apiDelay);
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

  /** Log Current User */
  logCurrentUser() {
    const user = this.getTelegramUser();
    this.logger.keyValue("User", `${user.username} (${user.id})`);
  }

  /** Process */
  async process() {
    throw new Error("process method must be implemented in subclass");
  }

  /** Join Telegram Link */
  async joinTelegramLink(link) {
    throw new Error("joinTelegramLink method must be implemented in subclass");
  }

  /** Can Join Telegram Link */
  canJoinTelegramLink(link) {
    throw new Error(
      "canJoinTelegramLink method must be implemented in subclass"
    );
  }

  /** Get Referral Link */
  async getReferralLink() {
    throw new Error("getReferralLink method must be implemented in subclass");
  }

  /** Get Cookies */
  async getCookies(options) {
    throw new Error("getCookies method must be implemented in subclass");
  }
}
