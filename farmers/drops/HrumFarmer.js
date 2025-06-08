const BaseFarmer = require("../BaseFarmer");
const utils = require("../../lib/utils");

module.exports = class HrumFarmer extends BaseFarmer {
  static id = "hrum";
  static origin = "https://game.hrum.me";

  configureApi() {
    this.api.interceptors.request.use((config) => {
      config.data = { data: config.data };
      config.headers = {
        ...config.headers,
        ...this.getHrumHeaders(config.data),
      };

      return config;
    });
  }

  getHrumHeaders(data) {
    const apiTime = Math.floor(Date.now() / 1000);
    const apiHash = utils.md5(
      encodeURIComponent(`${apiTime}_${JSON.stringify(data || "")}`)
    );

    return {
      "Api-Key": this.farmer.initDataUnsafe.hash,
      "Api-Time": apiTime,
      "Api-Hash": apiHash,
      "Is-Beta-Server": null,
    };
  }

  async process() {
    await this.login();

    let allData = await this.api
      .post("https://api.hrum.me/user/data/all", {})
      .then((res) => res.data.data);

    let afterData = await this.api
      .post("https://api.hrum.me/user/data/after", { lang: "en" })
      .then((res) => res.data.data);

    let dailyRewards = await this.api
      .post("https://api.hrum.me/quests/daily", {})
      .then((res) => res.data.data);

    let day = Object.entries(dailyRewards).find(([k, v]) => v === "canTake");

    if (day) {
      let result = await this.api
        .post("https://api.hrum.me/quests/daily/claim", parseInt(day[0]))
        .then((res) => res.data.data);

      dailyRewards = result.dailyRewards;
      allData.hero = result.hero;
    }

    /** Riddle */
    let riddle = allData.dbData.dbQuests.find((quest) =>
      quest.key.startsWith("riddle_")
    );

    /** Riddle Completion */
    let riddleCompletion = afterData.quests.find(
      (quest) => quest.key === riddle.key
    );

    /** Can Claim Riddle */
    let canClaimRiddle = riddle && !riddleCompletion;
    if (canClaimRiddle) {
      await this.api.post("https://api.hrum.me/quests/check", [
        riddle.key,
        riddle.checkData,
      ]);

      let result = await this.api
        .post("https://api.hrum.me/quests/claim", [
          riddle.key,
          riddle.checkData,
        ])
        .then((res) => res.data.data);

      allData.hero = result.hero;
      afterData.quests = result.quests;
    }

    /** Tasks */
    let tasks = allData.dbData.dbQuests.filter((item) =>
      ["fakeCheck"].includes(item.checkType)
    );

    /** Pending Tasks */
    let pendingTasks = tasks.filter(
      (item) => !afterData.quests.some((quest) => quest.key === item.key)
    );

    /** Claim Task */
    for (let task of pendingTasks) {
      let result = await this.api
        .post("https://api.hrum.me/quests/claim", [task.key, null])
        .then((res) => res.data.data);

      allData.hero = result.hero;
      afterData.quests = result.quests;
    }

    let cookies = allData.hero.cookies;

    if (cookies > 0) {
      await this.api
        .post("https://api.hrum.me/user/cookie/open", {})
        .then((res) => res.data.data);
    }
  }

  async login() {
    const platform = "android";
    const initData = this.farmer.initData;
    const initDataUnsafe = this.farmer.initDataUnsafe;
    await this.api
      .post("https://api.hrum.me/telegram/auth", {
        platform,
        initData,
        startParam: initDataUnsafe["start_param"] ?? "",
        photoUrl: initDataUnsafe["user"]?.["photo_url"] ?? "",
        chatId: initDataUnsafe["chat"]?.["id"] ?? "",
        chatType: initDataUnsafe["chat_type"] ?? "",
        chatInstance: initDataUnsafe["chat_instance"] ?? "",
      })
      .then((res) => res.data.data);
  }
};
