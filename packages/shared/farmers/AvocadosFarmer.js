import BaseFarmer from "../lib/BaseFarmer.js";

export default class AvocadosFarmer extends BaseFarmer {
  static id = "avocados";
  static title = "Avocados";
  static emoji = "🥑";
  static host = "loong.botfather.app";
  static domains = ["loong.botfather.app", "loongapi.botfather.app"];
  static telegramLink =
    "http://t.me/Avocados_robot/Avocados?startapp=r_1147265290";
  static cacheAuth = false;

  /** Get Referral Link */
  getReferralLink() {
    return `http://t.me/Avocados_robot/Avocados?startapp=r_${this.getUserId()}`;
  }

  /** Get Auth */
  fetchAuth() {
    return { auth: this.telegramWebApp.initData };
  }

  /** Get Meta */
  async fetchMeta() {
    await this.api.get("https://partner.mrbeast.win/country");
    return await this.api
      .post("https://loongapi.botfather.app/user/register", {
        pid: this.getStartParam()?.replace("r_", ""),
        robot: "f1",
        time: this.getTime(),
      })
      .then((res) => res.data.data);
  }

  /** Get Auth Headers */
  getAuthHeaders(data) {
    return {
      ["use-agen"]: data.auth,
    };
  }

  /** Get Time */
  getTime() {
    return Math.floor(Date.now() / 1000);
  }

  /** Get User */
  getUser(signal = this.signal) {
    return this.api
      .post("https://loongapi.botfather.app/user/getUser", null, {
        signal,
      })
      .then((res) => res.data.data);
  }

  /** Get Config */
  getConfig(signal = this.signal) {
    return this.api
      .post("https://loongapi.botfather.app/user/getConfig", null, {
        signal,
      })
      .then((res) => res.data.data);
  }

  /** Get Notice */
  getNotice(signal = this.signal) {
    return this.api
      .post("https://loongapi.botfather.app/user/getNotice", null, {
        signal,
      })
      .then((res) => res.data.data);
  }

  /** Get Rank List */
  getRankList(signal = this.signal) {
    return this.api
      .post("https://loongapi.botfather.app/user/getRankList", null, {
        signal,
      })
      .then((res) => res.data.data);
  }

  /** Get Friend List */
  getFriendList(signal = this.signal) {
    return this.api
      .post("https://loongapi.botfather.app/user/getFriendList", null, {
        signal,
      })
      .then((res) => res.data.data);
  }

  /** Get Task List */
  getTaskList(signal = this.signal) {
    return this.api
      .post("https://loongapi.botfather.app/user/getTaskList", null, {
        signal,
      })
      .then((res) => res.data.data);
  }

  /** Get Banna List */
  getBannaList(signal = this.signal) {
    return this.api
      .post("https://loongapi.botfather.app/user/getBannaList", null, {
        signal,
      })
      .then((res) => res.data.data);
  }

  /** Upgrade Banna */
  upgradeBanna(signal = this.signal) {
    return this.api
      .post("https://loongapi.botfather.app/user/upgradeBanna", null, {
        signal,
      })
      .then((res) => res.data.data);
  }

  /** Use shorten */
  useShorten(signal = this.signal) {
    return this.api
      .post("https://loongapi.botfather.app/user/useShorten", null, { signal })
      .then((res) => res.data.data);
  }

  /** Check Task */
  checkTask(id, signal = this.signal) {
    return this.api
      .post(
        "https://loongapi.botfather.app/task/checkTask",
        {
          task_id: id,
          time: this.getTime(),
        },
        { signal }
      )
      .then((res) => res.data.data);
  }

  /** Claim Ad Reward */
  claimAdReward(signal = this.signal) {
    return this.api
      .post("https://loongapi.botfather.app/user/getAdCountdown", null, {
        signal,
      })
      .then((res) => res.data.data);
  }

  /** Claim Taps */
  claimTaps(taps, signal = this.signal) {
    return this.api.post(
      "https://loongapi.botfather.app/user/receiveGold",
      {
        clickCount: taps,
        cftoken: "test",
        time: this.getTime(),
      },
      { signal }
    );
  }

  /** Process Farmer */
  async process() {
    const user = await this.getUser();
    const levels = await this.getBannaList();
    const currentLevel = levels.find(
      (item) => item.level === user["current_level"]
    );
    const nextLevel = levels.find(
      (item) => item.level === user["current_level"] + 1
    );

    this.logUserInfo(user);

    await this.executeTask("Watch Ad", () => this.watchAd(user));
    await this.executeTask("Tap Game", () => this.tapGame(user, currentLevel));
    await this.executeTask("Upgrade Level", () =>
      this.upgradeLevel(user, nextLevel)
    );
  }

  logUserInfo(user) {
    this.logger.newline();
    this.logCurrentUser();
    this.logger.keyValue("Balance", user["available_balance"]);
    this.logger.keyValue("Level", user["current_level"]);
    this.logger.keyValue("Peels", user["gold"]);
    this.logger.keyValue(
      "Seed",
      `${user["withdraw_fragment"]}/${user["available_balance"] * 10}`
    );
    this.logger.keyValue("Clicks", user["today_click_count"]);
  }

  /** Tap Game */
  async tapGame(user, currentLevel) {
    if (
      currentLevel &&
      user["today_click_count"] < currentLevel["gold_limit"]
    ) {
      await this.claimTaps(
        currentLevel["gold_limit"] - user["today_click_count"]
      );
      this.logger.info("Claimed taps for the day.");
    }
  }

  /** Upgrade Level */
  async upgradeLevel(user, nextLevel) {
    if (nextLevel) {
      const canUpgrade = user["upgrade_countdown"] <= Date.now();
      const hasEnoughGold = user["gold"] >= nextLevel["need_coin"];
      const shortenCount = user["shorten_count"];

      if (canUpgrade && hasEnoughGold) {
        await this.upgradeBanna();
        this.logger.info(`Upgraded to level ${nextLevel["level"]}.`);
      } else if (shortenCount > 0) {
        await this.useShorten();
        this.logger.info("Used shorten to reduce upgrade cooldown.");
      }
    }
  }

  /** Watch Ad */
  async watchAd(user) {
    if (user["ad_countdown"] <= Date.now()) {
      await this.claimAdReward();
      this.logger.info("Claimed ad reward.");
    }
  }
}
