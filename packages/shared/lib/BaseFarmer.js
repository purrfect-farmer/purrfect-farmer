import * as changeKeys from "change-case/keys";

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
  static telegramLink = "";
  static withXSRFToken = false;
  static rating = 1;

  constructor() {
    this.utils = utils;
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
  getInitDataUnsafe(camelCase = false) {
    return camelCase
      ? changeKeys.camelCase(this.telegramWebApp?.initDataUnsafe, Infinity)
      : this.telegramWebApp?.initDataUnsafe;
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

  /** Start the farmer */
  start(signal) {
    this.signal = signal || new AbortController().signal;
    return this.process();
  }

  /** Execute a task with logging */
  async executeTask(task, callback, allowInQuickRun = true) {
    this.logger.newline();

    if (this.signal?.aborted) {
      this.logger.warn(`✖ Task aborted: ${this.logger.c.magenta(task)}`);
      return;
    }

    const skipInQuickRun = this.quickRun && !allowInQuickRun;

    if (skipInQuickRun) {
      this.logger.log(
        `${this.logger.c.yellow(
          "⚡ Skipping in quick run:"
        )} ${this.logger.c.magenta(task)}`
      );
      return;
    }

    try {
      this.logger.log(
        `${this.logger.c.gray("⚙ Executing task:")} ${this.logger.c.magenta(
          task
        )}`
      );

      await callback();

      this.logger.log(
        `${this.logger.c.green("✔ Completed task:")} ${this.logger.c.magenta(
          task
        )}`
      );
    } catch (error) {
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
