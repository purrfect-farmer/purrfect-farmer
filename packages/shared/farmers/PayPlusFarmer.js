import BaseFarmer from "../lib/BaseFarmer.js";

export default class PayPlusFarmer extends BaseFarmer {
  static id = "pay-plus";
  static title = "PayPlus";
  static emoji = "💰";
  static host = "kaliboy002.duckdns.org";
  static domains = ["kaliboy002.duckdns.org"];
  static path = "/app";
  static telegramLink = "https://t.me/Pay_Plus_Bot/app?startapp=1147265290";
  static autoStart = false;
  static cacheAuth = false;
  static cacheTelegramWebApp = false;
  static rating = 4;
  static interval = "*/30 * * * *";

  /** Get Referral Link */
  getReferralLink() {
    return `https://t.me/Pay_Plus_Bot/app?startapp=${this.getUserId()}`;
  }

  /** Login */
  login(signal = this.signal) {
    return this.api
      .post(
        "https://kaliboy002.duckdns.org/api/user",
        {
          initData: this.getInitData(),
          referralUserId: this.getStartParam() || null,
          telegramLang: "en",
        },
        { signal },
      )
      .then((res) => res.data);
  }

  /** Get tasks config */
  getTasksConfig(signal = this.signal) {
    return this.api
      .get("https://kaliboy002.duckdns.org/api/tasks-config", { signal })
      .then((res) => res.data);
  }

  /** Verify Channel */
  verifyChannel(channelId, signal = this.signal) {
    return this.api
      .post(
        "https://kaliboy002.duckdns.org/api/verify-channel",
        {
          channelId,
          initData: this.getInitData(),
        },
        { signal },
      )
      .then((res) => res.data);
  }

  /** Claim Ad Reward */
  claimAdReward(signal = this.signal) {
    return this.api
      .post(
        "https://kaliboy002.duckdns.org/api/reward",
        {
          adType: "gigapub",
          initData: this.getInitData(),
        },
        { signal },
      )
      .then((res) => res.data);
  }

  /** Complete Bot Task */
  completeBotTask(botId, signal = this.signal) {
    return this.api
      .post(
        "https://kaliboy002.duckdns.org/api/complete-bot",
        {
          botId,
          initData: this.getInitData(),
        },
        { signal },
      )
      .then((res) => res.data);
  }

  /** Complete Youtube Task */
  completeYoutubeTask(youtubeId, signal = this.signal) {
    return this.api
      .post(
        "https://kaliboy002.duckdns.org/api/complete-youtube",
        {
          youtubeId,
          initData: this.getInitData(),
        },
        { signal },
      )
      .then((res) => res.data);
  }

  /** Process Farmer */
  async process() {
    this.user = await this.login();

    this.logUserInfo(this.user);
    await this.executeTask("Tasks", () => this.completeTasks());
    await this.executeTask("Watch Ads", () => this.watchAds());
  }

  logUserInfo(user) {
    this.logger.newline();
    this.logCurrentUser();
    this.logger.keyValue("Balance", `$${user.balance}`);
    this.logger.keyValue("Today Ads", `${user.adsToday}/15`);
    this.logger.keyValue("Total Ads", `${user.totalAdsWatched}/80`);
    this.logger.keyValue("Invites", `${user.totalInvites}/5`);
    this.logger.keyValue("Banned", user.banned ? "Yes 🚫" : "No ✅");
  }

  /** Complete tasks */
  async completeTasks() {
    const tasks = await this.getTasksConfig();
    const { completedBots, completedChannels, completedYoutube } = this.user;

    /** Available bot tasks */
    const availableBotTasks = tasks.bots.filter(
      (item) => !completedBots.includes(item.id),
    );

    /** Available channel tasks */
    const availableChannelTasks = tasks.channels.filter(
      (item) => !completedChannels.includes(item.id),
    );

    /** Complete bot tasks */
    for (const bot of availableBotTasks) {
      if (this.signal.aborted) return;
      await this.completeBotTask(bot.id);
      this.logger.success(`✓ ${bot.name} - completed bot task!`);
      await this.utils.delayForSeconds(15, { signal: this.signal });
    }

    /** Complete channel tasks */
    for (const channel of availableChannelTasks) {
      if (this.signal.aborted) return;
      await this.tryToJoinTelegramLink(`https://t.me/${channel.username}`);
      const result = await this.verifyChannel(channel.id);
      if (result.success) {
        this.logger.success(`✓ ${channel.name} - completed channel task!`);
      } else {
        this.logger.warn(`${channel.name} - not subscribed to channel!`);
      }
      await this.utils.delayForSeconds(10, { signal: this.signal });
    }

    /** Complete Youtube Task */
    if (!completedYoutube.length) {
      await this.completeYoutubeTask("kaliboy002_yt");
      this.logger.success("✓ Youtube Task");
    }
  }

  /** Watch ads */
  async watchAds() {
    const current = this.user.adsToday;

    for (let i = current; i < 15; i++) {
      if (this.signal.aborted) return;
      const index = i + 1;
      this.logger.info(`Delaying ad: (${index}/15)`);
      await this.utils.delayForSeconds(30, { signal: this.signal });
      await this.claimAdReward();
      this.logger.success(`Claimed ad reward - (${index}/15)`);
    }
  }
}
