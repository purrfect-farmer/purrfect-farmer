import BaseFarmer from "../lib/BaseFarmer.js";

export default class HoneyFarmFarmer extends BaseFarmer {
  static id = "honey-farm";
  static title = "Honey Farm";
  static emoji = "🐻";
  static host = "honey.masha.place";
  static domains = ["honey.masha.place"];
  static telegramLink = "https://t.me/mashabear_honey_bot?start=1147265290";
  static cacheAuth = false;
  static cacheTelegramWebApp = false;

  configureApi() {
    const interceptor = this.api.interceptors.request.use((config) => {
      if (config.method === "get") {
        config.url = this.updateUrl(config.url);
      }

      return config;
    });

    return () => {
      this.api.interceptors.request.eject(interceptor);
    };
  }

  updateUrl(url) {
    const urlObj = new URL(url);
    urlObj.searchParams.set("user-id", this.getUserId());

    return urlObj.toString();
  }

  /** Get Referral Link */
  getReferralLink() {
    return `https://t.me/mashabear_honey_bot?start=${this.getUserId()}`;
  }

  /** Get Auth */
  fetchAuth() {
    return { auth: this.telegramWebApp.initData };
  }

  /** Get Auth Headers */
  getAuthHeaders(data) {
    return {
      Authorization: data.auth,
    };
  }

  /** Get User */
  getUserInfo(signal = this.signal) {
    return this.api
      .get("https://honey.masha.place/api/v1/user/info/?a=true", { signal })
      .then((res) => res.data);
  }

  getGameplay(signal = this.signal) {
    return this.api
      .get("https://honey.masha.place/api/v1/content/gameplay/", { signal })
      .then((res) => res.data);
  }

  getTasks(signal = this.signal) {
    return this.api
      .get("https://honey.masha.place/api/v1/user/tasks/", { signal })
      .then((res) => res.data);
  }

  getDailyBonusStatus(signal = this.signal) {
    return this.api
      .get(
        "https://honey.masha.place/api/v1/user/bonus/daily/status/?lang=en",
        { signal }
      )
      .then((res) => res.data);
  }

  getDailyBonus(signal = this.signal) {
    return this.api
      .get("https://honey.masha.place/api/v1/bonus/daily/?lang=en", { signal })
      .then((res) => res.data);
  }

  getUserBoosts(signal = this.signal) {
    return this.api
      .get("https://honey.masha.place/api/v1/user/boosts/", { signal })
      .then((res) => res.data);
  }

  getBoosts(signal = this.signal) {
    return this.api
      .get("https://honey.masha.place/api/v1/boosts/", { signal })
      .then((res) => res.data);
  }

  getFriends(signal = this.signal) {
    return this.api
      .get("https://honey.masha.place/api/v1/user/friends/", { signal })
      .then((res) => res.data);
  }

  putHoney(payload, signal = this.signal) {
    return this.api
      .post(
        "https://honey.masha.place/api/v1/user/transactions/put/",
        payload,
        { signal }
      )
      .then((res) => res.data);
  }

  /** Process Farmer */
  async process() {
    const userInfo = await this.getUserInfo();
    const gameplay = await this.getGameplay();
    await this.getDailyBonusStatus();
    await this.getDailyBonus();

    this.logUserInfo(userInfo);
  }

  logUserInfo(userInfo) {
    const { user } = userInfo;
    const lastTransaction = userInfo["last-transaction"];

    this.logger.newline();
    this.logCurrentUser();
    this.logger.keyValue("Balance", user["max-account-honey"]);
    this.logger.keyValue("Energy", lastTransaction["barrel-honey"]);
  }

  /** Tap Barrel */
  async tapBarrel(userInfo, signal = this.signal) {
    const lastTransaction = userInfo["last-transaction"];
    let balance = Number(lastTransaction["account-honey"]);
    let energy = Number(lastTransaction["barrel-honey"]);

    while (energy > 0) {
      const putAmount = Math.min(energy, 200 + Math.floor(Math.random() * 300));

      if (putAmount <= 0) break;

      await this.putHoney({
        "transaction-id": lastTransaction["transaction-id"],
        "account-honey": balance + putAmount,
        "barrel-level": Number(lastTransaction["barrel-level"]),
        "earn-per-tap": Number(lastTransaction["earn-per-tap"]),
        "earn-per-hour": Number(lastTransaction["earn-per-hour"]),
        "barrel-honey": energy - putAmount,
        "assistant-status": "false",
        "assistant-id": "",
        "assistant-time-start": "",
        "assistant-time-end": "",
        "transaction-type": "no-assistant",
        "transaction-viewed": "false",
        "user-id": this.getUserId().toString(),
      });

      balance += putAmount;
      energy -= putAmount;

      this.logger.keyValue("Tapped", putAmount);

      break;
    }
  }
}
