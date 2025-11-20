import BaseFarmer from "../lib/BaseFarmer.js";

export default class GoldEagleFarmer extends BaseFarmer {
  static id = "gold-eagle";
  static title = "Gold Eagle";
  static emoji = "🦅";
  static host = "game.geagle.online";
  static domains = ["game.geagle.online", "cloud.geagle.online"];
  static interval = "*/5 * * * *";
  static rating = 5;
  static cookies = true;
  static cacheAuth = false;
  static link = "https://game.geagle.online";
  static startupDelay = 0;

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

  /** Refill Energy */
  async refillEnergy(signal = this.signal) {
    const captchaToken = await this.getTurnstileToken();

    return this.api
      .post(
        "https://cloud.geagle.online/user/me/refill?" +
          new URLSearchParams({ captchaToken }).toString(),
        null,
        { signal }
      )
      .then((res) => res.data);
  }

  /** Get Boosters */
  getBoosters(signal = this.signal) {
    return this.api
      .get("https://cloud.geagle.online/boosters", { signal })
      .then((res) => res.data);
  }

  /** Get Wallet Info */
  getWalletInfo(signal = this.signal) {
    return this.api
      .get("https://cloud.geagle.online/wallet/my", { signal })
      .then((res) => res.data);
  }

  /** Get Wallet Transactions */
  getWalletTransactions(signal = this.signal) {
    return this.api
      .get("https://cloud.geagle.online/wallet/my/transactions", { signal })
      .then((res) => res.data);
  }

  /** Get Staking Options */
  getStakingOptions(signal = this.signal) {
    return this.api
      .get("https://cloud.geagle.online/user/staking-options", { signal })
      .then((res) => res.data);
  }

  /** Stake */
  async stake(packageId, signal = this.signal) {
    const captchaToken = await this.getTurnstileToken("/wallet");
    return this.api
      .post(
        `https://cloud.geagle.online/wallet/claim?` +
          new URLSearchParams({
            packageId,
            captchaToken,
          }).toString(),
        null,
        { signal }
      )
      .then((res) => res.data);
  }

  /** Get Cookies for Sync */
  async getCookiesForSync() {
    return [
      {
        url: "https://cloud.geagle.online",
        cookies: await this.getCookies({
          url: "https://cloud.geagle.online",
        }),
      },
    ];
  }

  /** Process Farmer */
  async process() {
    const progress = await this.getProgress();

    this.logUserInfo(progress);

    /* Check Energy */
    await this.executeTask("Enerygy Refill", () => this.checkEnergy(progress));

    /* Claim Coins */
    await this.executeTask("Claim Coins", () => this.claimCoins(progress));
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

  async checkEnergy(progress) {
    if (
      progress["energy"] === 0 &&
      progress["coins_amount"] < progress["max_coins_amount"]
    ) {
      if (!this.canSolveTurnstile?.()) {
        this.logger.warn("Cannot refill energy: No Captcha Solver configured.");
        return;
      }

      this.logger.info("Refilling energy...");
      await this.refillEnergy();
      this.logger.success("Energy refilled successfully.");
    }
  }

  /** Claim Coins */
  async claimCoins(progress) {
    const stakingOptions = await this.getStakingOptions();
    const plans = Object.values(stakingOptions.plans)[0];
    const availablePlan = plans.find(
      (item) =>
        item["minAmount"] <= progress["coins_amount"] &&
        item["staked"] + progress["coins_amount"] <= item["geLimit"]
    );

    if (availablePlan) {
      const user = await this.getUserInfo();

      if (user["wallet_status"] !== "Active") {
        this.logger.warn("Wallet is not active. Cannot claim coins.");
        return;
      }

      const boosters = await this.getBoosters();
      const key = boosters.find(
        (b) => b["booster_type"] === "Claim" && b.level > 0
      );

      if (!key) {
        this.logger.warn("No Claim booster available.");
        return;
      }

      if (!this.canSolveTurnstile?.()) {
        this.logger.warn("Cannot claim coins: No Captcha Solver configured.");
        return;
      }

      this.logger.info(
        `Claiming ${progress["coins_amount"]} coins using Claim booster...`
      );

      /* Stake Coins */
      await this.stake(availablePlan["id"]);

      /* Log Success */
      this.logger.success(
        `Staked ${progress["coins_amount"]} coins successfully.`
      );
    }
  }

  /** Get Turnstile Token */
  getTurnstileToken(page = "/") {
    return this.solveTurnstile({
      siteKey: "0x4AAAAAACB-pQQ4y8fclk8S",
      pageUrl: "https://game.geagle.online" + page,
    });
  }
}
