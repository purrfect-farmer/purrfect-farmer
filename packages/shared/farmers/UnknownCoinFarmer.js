import BaseFarmer from "../lib/BaseFarmer.js";

export default class UnknownCoinFarmer extends BaseFarmer {
  static id = "unknown-coin";
  static title = "Unknown Coin";
  static emoji = "❓";
  static host = "app.unknown-coin.com";
  static domains = ["app.unknown-coin.com", "api.unknown-coin.com"];
  static telegramLink =
    "https://t.me/coin_unk_bot/app?startapp=MTE0NzI2NTI5MA==";
  static cacheAuth = false;
  static cacheTelegramWebApp = false;

  static SECRET_KEY = "O0sN7rQcXoG5ylA6UYSQTJbZqYLV9X70PVn3hS86ceS";

  /** Configure API */
  configureApi() {
    /** Sign Request */
    const requestSignatureInterceptor = this.api.interceptors.request.use(
      async (config) => {
        const headers = await this.getSignatureHeaders(config.url);
        config.headers = {
          ...config.headers,
          ...headers,
          Accept: "application/json",
          "Content-Type": "application/json",
        };

        return config;
      }
    );

    return () => {
      this.api.interceptors.request.eject(requestSignatureInterceptor);
    };
  }

  /** Get signature headers */
  async getSignatureHeaders(url) {
    const path = new URL(url).pathname.replace("/api/", "");
    const data = `${path}:${timestamp}`;
    const timestamp = Math.floor(Date.now() / 1000);
    const signature = this.utils.sha256Hmac(this.constructor.SECRET_KEY, data);

    return {
      "Init-Data": this.getInitData(),
      "X-Version": "2.0.2",
      "X-Timestamp": timestamp.toString(16),
      "X-Signature": signature,
    };
  }

  /** Get Referral Link */
  getReferralLink() {
    return `https://t.me/coin_unk_bot/app?startapp=${btoa(this.getUserId())}`;
  }

  /** Get Auth */
  async fetchAuth() {
    /** Get Server Time */
    const { time } = await this.getServerTime();

    this._timestamp = time;
    this._userData = await this.getUserInfo();

    return this._userData;
  }

  /** Get Meta */
  async fetchMeta() {
    await this.updateUserMetrics();
    await this.setUnknownCoinUserAgent(this.userAgent || navigator?.userAgent);
    await this.getHappyHours();
    await this.getCurrencyPrice();

    return true;
  }

  /** Get Server Time */
  getServerTime(signal = this.signal) {
    return this.api
      .get("https://api.unknown-coin.com/api/time", { signal })
      .then((res) => res.data);
  }

  /** Get Currency Price */
  getCurrencyPrice(signal = this.signal) {
    return this.api
      .get("https://api.unknown-coin.com/api/currencyPrice", { signal })
      .then((res) => res.data);
  }

  /** Get User Story Energy */
  getUserStoryEnergy(signal = this.signal) {
    return this.api
      .get("https://api.unknown-coin.com/api/user/story/energy", { signal })
      .then((res) => res.data);
  }

  /** Get User Info */
  getUserInfo(signal = this.signal) {
    return this.api
      .get(
        `https://api.unknown-coin.com/api/userinfo?refId=${
          this.getStartParam() || ""
        }`,
        {
          signal,
        }
      )
      .then((res) => res.data);
  }

  /** Set Unknown Coin User Agent */
  setUnknownCoinUserAgent(userAgent, signal = this.signal) {
    return this.api
      .post(
        "https://api.unknown-coin.com/api/user-agent",
        { ["user_agent"]: userAgent },
        { signal }
      )
      .then((res) => res.data);
  }

  /** Update User Metrics */
  updateUserMetrics(signal = this.signal) {
    return this.api
      .patch(
        "https://api.unknown-coin.com/api/user/updateMetrics",
        { is_bot: false },
        { signal }
      )
      .then((res) => res.data);
  }

  /** Get Happy Hours */
  getHappyHours(signal = this.signal) {
    return this.api
      .get("https://api.unknown-coin.com/api/happy-hours", { signal })
      .then((res) => res.data);
  }

  /** Process Farmer */
  async process() {
    const { user } = this._userData;

    this.logUserInfo(user);
  }

  logUserInfo(user) {
    this.logger.newline();
    this.logCurrentUser();
  }
}
