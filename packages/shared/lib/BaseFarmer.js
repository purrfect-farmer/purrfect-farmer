import utils from "../utils/index.js";

export default class BaseFarmer {
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

  /** Get Telegram User */
  getTelegramUser() {
    return this.telegramWebApp?.initDataUnsafe?.user;
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
    return this.telegramWebApp?.initDataUnsafe?.["start_param"];
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

  /** Fetch Auth */
  async fetchAuth() {
    throw new Error("fetchAuth method must be implemented in subclass");
  }

  /** Get User */
  async fetchMeta() {
    throw new Error("fetchMeta method must be implemented in subclass");
  }

  /** Process */
  async process() {
    throw new Error("process method must be implemented in subclass");
  }

  /** Get Auth Headers */
  getAuthHeaders(auth) {
    throw new Error("getAuthHeaders method must be implemented in subclass");
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
