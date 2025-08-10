import utils from "../utils/index.js";

export default class BaseFarmer {
  static id = "base-farmer";
  static title = "Base Farmer";
  static emoji = "🐾";
  static enabled = true;
  static apiDelay = 200;
  static cacheAuth = true;
  static cacheTelegramWebApp = true;
  static cookies = false;
  static interval = "*/10 * * * *";

  constructor() {
    this.utils = utils;
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

  /** Get Init Data */
  getInitData() {
    return this.telegramWebApp?.initData;
  }

  /** Get Init Data Unsafe */
  getInitDataUnsafe() {
    return this.telegramWebApp?.initDataUnsafe;
  }

  /** Get Telegram User */
  getTelegramUser() {
    return this.getInitDataUnsafe()?.user;
  }
  /** Get User ID */
  getUserId() {
    return this.getTelegramUser()?.id;
  }

  /** Get Username */
  getUsername() {
    return this.getTelegramUser()?.username;
  }

  /** Get Start Parameter */
  getStartParam() {
    return this.getInitDataUnsafe()?.["start_param"];
  }

  /** Start the farmer */
  start(signal) {
    this.signal = signal;
    return this.process();
  }

  /** Execute a task with logging */
  async executeTask(task, callback, allowInQuickRun = true) {
    this.logger.newline();

    if (this.signal?.aborted) {
      this.logger.warn(`Task aborted: ${task}`);
      return;
    }

    const skipInQuickRun = this.quickRun && !allowInQuickRun;

    if (skipInQuickRun) {
      this.logger.warn(`Skipping task in quick run: ${task}`);
      return;
    }

    try {
      this.logger.log(`Executing task: ${task}`);
      await callback();
      this.logger.success(`Completed task: ${task}`);
    } catch (error) {
      this.logger.error(`Error executing task: ${task} - ${error.message}`);
      throw error;
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
        this.logger.error(error.message);
        return false;
      }
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
  getReferralLink() {
    throw new Error("getReferralLink method must be implemented in subclass");
  }
}
