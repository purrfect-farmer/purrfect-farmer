import BaseFarmer from "../lib/BaseFarmer.js";

export default class GoldEagleFarmer extends BaseFarmer {
  static id = "gold-eagle";
  static title = "Gold Eagle";
  static emoji = "🦅";
  static host = "game.geagle.online";
  static domains = ["game.geagle.online", "cloud.geagle.online"];
  static interval = "*/30 * * * *";
  static rating = 5;
  static cookies = true;
  static cacheAuth = false;
  static cacheTelegramWebApp = false;
  static link = "https://game.geagle.online";

  /** Get Auth */
  fetchAuth() {
    return this.getProgress();
  }

  /** Get Progress */
  getProgress(signal = this.signal) {
    return this.api
      .get("https://cloud.geagle.online/user/me/progress", { signal })
      .then((res) => res.data);
  }

  /** Get User Info */
  getUserInfo(signal = this.signal) {
    return this.api
      .get("https://cloud.geagle.online/user/me", { signal })
      .then((res) => res.data);
  }

  /** Get Referral Stats */
  getReferralStats(signal = this.signal) {
    return this.api
      .get("https://cloud.geagle.online/referrals/my?page=1&per_page=100", {
        signal,
      })
      .then((res) => res.data);
  }

  /** Process Farmer */
  async process() {
    const progress = await this.getProgress();

    console.log(progress);
    console.log(cookies);

    this.logUserInfo(progress);
  }

  /** Get Cookies for Sync */
  getCookiesForSync() {
    return this.getCookies({
      url: "https://cloud.geagle.online",
    });
  }

  /** Log User Info */
  logUserInfo(progress) {
    this.logger.keyValue(
      "Energy",
      progress["energy"] + "/" + progress["max_energy"]
    );
    this.logger.keyValue(
      "Coins",
      progress["coins_amount"] + "/" + progress["max_coins_amount"]
    );
    this.logger.keyValue("Tap Weight", progress["tap_weight"]);
    this.logger.keyValue("PND Tasks", progress["not_completed_tasks_count"]);
    this.logger.keyValue("PND Events", progress["not_registerd_events_count"]);
    this.logger.keyValue(
      "Energy From PRC",
      progress["allow_refill_energy_from_prc"]
    );
  }
}
