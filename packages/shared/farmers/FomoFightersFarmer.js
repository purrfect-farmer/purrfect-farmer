import BaseFarmer from "../lib/BaseFarmer.js";

export default class FomoFightersFarmer extends BaseFarmer {
  static id = "fomo-fighters";
  static title = "Fomo Fighters";
  static emoji = "⚔️";
  static host = "game.fomofighters.xyz";
  static domains = ["game.fomofighters.xyz", "api.fomofighters.xyz"];
  static telegramLink =
    "https://t.me/fomo_fighters_bot/game?startapp=ref1147265290";
  static cacheAuth = false;
  static cacheTelegramWebApp = false;
  static rating = 5;

  /** Get Referral Link */
  getReferralLink() {
    return `https://t.me/fomo_fighters_bot/game?startapp=ref${this.getUserId()}`;
  }

  /* Configure Api */
  configureApi() {
    const interceptor = this.api.interceptors.request.use((config) => {
      config.data = { data: config.data };
      config.headers = {
        ...config.headers,
        ...this.getSignedHeaders(config.data),
      };

      return config;
    });

    return () => {
      return this.api.interceptors.request.eject(interceptor);
    };
  }

  getSignedHeaders(data) {
    const apiTime = Math.floor(Date.now() / 1000);
    const apiHash = this.utils.md5(
      encodeURIComponent(`${apiTime}_${JSON.stringify(data || "")}`)
    );

    return {
      "Api-Key": this.getInitDataHash(),
      "Api-Time": apiTime,
      "Api-Hash": apiHash,
      "Is-Beta-Server": null,
    };
  }

  getUserAllData() {
    return this.api
      .post("https://api.fomofighters.xyz/user/data/all", {})
      .then((res) => res.data.data);
  }

  getUserAfterData() {
    return this.api
      .post("https://api.fomofighters.xyz/user/data/after", { lang: "en" })
      .then((res) => res.data.data);
  }

  getUserTimers() {
    return this.api
      .post("https://api.fomofighters.xyz/user/data/timers", { lang: "en" })
      .then((res) => res.data.data);
  }

  claimDailyQuest(day) {
    return this.api
      .post("https://api.fomofighters.xyz/quest/daily/claim", day)
      .then((res) => res.data.data);
  }

  finishOnboarding(level) {
    return this.api
      .post("https://api.fomofighters.xyz/onboarding/finish", level)
      .then((res) => res.data.data);
  }

  getBattleLogs() {
    return this.api
      .post("https://api.fomofighters.xyz/battle/logs/my", {})
      .then((res) => res.data.data);
  }

  purchaseLand(position, buildingKey) {
    return this.api
      .post("https://api.fomofighters.xyz/building/buy", {
        position,
        buildingKey,
      })
      .then((res) => res.data.data);
  }

  /**
   * Select the race
   * @param {"dog" | "frog" | "cat"} race
   */
  selectRace(race) {
    return this.api
      .post("https://api.fomofighters.xyz/race/select", race)
      .then((res) => res.data.data);
  }

  /** Get Auth */
  async login() {
    return this.api
      .post("https://api.fomofighters.xyz/telegram/auth", {
        initData: this.getInitData(),
        photoUrl: this.getProfilePhotoUrl(),
        platform: "android",
        chatId: "",
      })
      .then((res) => res.data.data);
  }

  /** Process Farmer */
  async process() {
    await this.login();

    let allData = await this.getUserAllData();
    let afterData = await this.getUserAfterData();

    console.log({
      allData,
      afterData,
    });
  }
}
