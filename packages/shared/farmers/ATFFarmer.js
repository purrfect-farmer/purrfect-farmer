import BaseFarmer from "../lib/BaseFarmer.js";

export default class ATFFarmer extends BaseFarmer {
  static id = "atf";
  static title = "ATF";
  static emoji = "🪙";
  static host = "atfminers.asloni.online";
  static domains = ["atfminers.asloni.online"];
  static telegramLink = "https://t.me/ATF_AIRDROP_bot?start=1147265290";
  static cacheAuth = false;
  static cacheTelegramWebApp = false;
  static rating = 4;
  static netRequest = {
    requestHeaders: [
      {
        header: "x-requested-with",
        operation: "set",
        value: "XMLHttpRequest",
      },
    ],
  };

  /** Get Referral Link */
  getReferralLink() {
    return `https://t.me/ATF_AIRDROP_bot?start=${this.getUserId()}`;
  }

  configureApi() {
    const interceptor = this.api.interceptors.request.use((config) => {
      const url = new URL(config.url, config.baseURL);
      url.searchParams.set("t", Date.now().toString());
      config.url = url.toString();
      config.headers["x-whiskers-user-agent"] = this.userAgent;
      config.headers["X-Telegram-Init-Data"] = this.getInitData();
      config.data = {
        ...config.data,
        initData: this.getInitData(),
        request_id: this.utils.uuid(),
        tg_id: this.getUserId(),
      };
      return config;
    });
    return () => this.api.interceptors.request.eject(interceptor);
  }

  makeAction(action, data = {}) {
    return this.api
      .post(
        `https://atfminers.asloni.online/miner/index.php?action=${action}`,
        data,
      )
      .then((res) => res.data);
  }

  /** Get Auth */
  async fetchAuth() {
    this.authData = await this.makeAction("login", {
      username: this.getUsername(),
    });

    return this.authData;
  }

  /** Get Auth Headers */
  getAuthHeaders(data) {
    return {
      "X-ATF-TMA-Session": data["tma_session_token"],
      "X-Telegram-Init-Data": this.getInitData(),
    };
  }

  /** Process Farmer */
  async process() {
    const { user } = this.authData;

    this.logUserInfo(user);
  }
  /** Log User Info */
  logUserInfo(user) {
    this.logger.newline();
    this.logCurrentUser();
    this.logger.keyValue("Balance", user["mined_balance"]);
  }
}
