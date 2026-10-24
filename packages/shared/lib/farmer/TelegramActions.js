/** What the farmer does on Telegram itself: joining chats, editing the profile and refreshing the web app */
export default class TelegramActions {
  /**
   * @param {object} options
   * @param {ReturnType<import("./createFarmerCore.js").default>} options.core
   * @param {(link: string) => boolean} options.canJoin - whether the farmer may join a link
   * @param {(link: string) => Promise<any>} options.join - joins a link
   * @param {(options: object) => boolean} options.canUpdateProfile - whether the farmer may edit the profile
   * @param {(options: object) => Promise<any>} options.updateProfile - edits the profile
   * @param {() => boolean} options.allowProfileUpdates - whether settings allow profile edits
   * @param {() => { platform: string, type: string, telegramLink: string, client: object }} options.launch - how and where the farmer is launched
   * @param {(webApp: object) => void} options.setTelegramWebApp - stores a fresh web app
   */
  constructor({
    core,
    canJoin,
    join,
    canUpdateProfile,
    updateProfile,
    allowProfileUpdates,
    launch,
    setTelegramWebApp,
  }) {
    this.core = core;
    this.canJoin = canJoin;
    this.join = join;
    this.canUpdateProfile = canUpdateProfile;
    this.updateProfile = updateProfile;
    this.allowProfileUpdates = allowProfileUpdates;
    this.launch = launch;
    this.setTelegramWebApp = setTelegramWebApp;
  }

  /** Whether a task's link is one the farmer can act on */
  validateTask(link) {
    return !this.core.utils.isTelegramChatLink(link) || this.canJoin(link);
  }

  /** Join a Telegram chat link after a random 1 to 5 minute wait */
  async tryToJoin(link) {
    const { logger, utils } = this.core;

    if (utils.isTelegramChatLink(link) && this.canJoin(link)) {
      try {
        const duration = 1 + Math.floor(Math.random() * 5);

        logger.log(
          `${logger.c.yellow("⏳ Delaying for")} ${logger.c.magenta(
            `${duration} minute(s)`,
          )} ${logger.c.yellow(
            "before joining Telegram link:",
          )} ${logger.c.magenta(link)}`,
        );

        await utils.delayForMinutes(duration, { signal: this.core.signal });

        await this.join(link);
        return true;
      } catch (error) {
        logger.error("Failed to join Telegram link:", error.message);
        return false;
      }
    }
  }

  /** Edit the Telegram profile when settings allow it */
  async tryToUpdateProfile(options) {
    const { logger } = this.core;

    if (!this.allowProfileUpdates()) {
      logger.warn("Profile updates are disabled in settings");
      return false;
    }

    if (this.canUpdateProfile(options)) {
      try {
        await this.updateProfile(options);
        return true;
      } catch (error) {
        logger.error("Failed to update profile:", error.message);
        return false;
      }
    }
  }

  /** Join a task's Telegram link when it is one, then dwell the way the page makes you wait */
  async openTaskLink(url, dwellSeconds) {
    const { utils } = this.core;

    if (url && utils.isTelegramChatLink(url)) {
      await this.tryToJoin(url);
    }

    if (dwellSeconds) {
      await utils.delayForSeconds(dwellSeconds, { signal: this.core.signal });
    }
  }

  /** Read fresh initData from the bot's web view, for Telegram web apps */
  async refreshWebApp() {
    const { platform, type, telegramLink, client } = this.launch();

    if (platform === "telegram" && type === "webapp") {
      const { utils } = this.core;
      const { url } = await client.getWebview(telegramLink);
      const { initData } = utils.extractTgWebAppData(url);

      this.setTelegramWebApp({
        initData,
        initDataUnsafe: utils.getInitDataUnsafe(initData),
      });
    }
  }
}
