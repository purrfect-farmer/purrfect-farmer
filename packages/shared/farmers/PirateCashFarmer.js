import BaseFarmer from "../lib/BaseFarmer.js";

export default class PirateCashFarmer extends BaseFarmer {
  static id = "pirate-cash";
  static title = "Pirate Cash";
  static emoji = "🐙";
  static host = "game.p.cash";
  static domains = ["game.p.cash", "p.cash"];
  static telegramLink = "https://t.me/piratecash_bot?start=1147265290";
  static cacheAuth = false;
  static cacheTelegramWebApp = false;

  /** Get Referral Link */
  getReferralLink() {
    return `https://t.me/piratecash_bot?start=${this.getUserId()}`;
  }

  /** Get Auth */
  async fetchAuth() {
    /** Get System Info */
    await this.getSystemInfo();

    /** Register or Login User */
    const { tokens, user } = await this.api
      .post("https://p.cash/miniapp/users", { sign: this.getInitData() })
      .then((res) => res.data);

    /** Retrieve Auth Tokens */
    const { accessToken, refreshToken } = await this.api
      .put("https://p.cash/miniapp/users/auth", null, {
        headers: { Authorization: `Bearer ${tokens.refreshToken}` },
      })
      .then((res) => res.data);

    this._userData = { tokens, user };
    this._authData = { accessToken, refreshToken };

    return this._authData;
  }

  /** Get Meta */
  fetchMeta() {
    return this.api
      .get("https://p.cash/api/coins/piratecash")
      .then((res) => res.data);
  }

  /** Get Auth Headers */
  getAuthHeaders(data) {
    return {
      Authorization: `Bearer ${data.accessToken}`,
    };
  }

  /** Complete Onboarding */
  completeOnboarding(signal = this.signal) {
    return this.api
      .patch("https://p.cash/miniapp/users/onboarding", null, { signal })
      .then((res) => res.data);
  }

  getSystemInfo(signal = this.signal) {
    return this.api
      .get("https://p.cash/miniapp/system/info", { signal })
      .then((res) => res.data);
  }

  /** Get Skins */
  getSkins(signal = this.signal) {
    return this.api
      .get("https://p.cash/miniapp/skins", { signal })
      .then((res) => res.data);
  }

  /** Get Onboardings */
  getOnboardings(signal = this.signal) {
    return this.api
      .get("https://p.cash/miniapp/onboardings", { signal })
      .then((res) => res.data);
  }

  /** Get Active Skin */
  getActiveSkin(signal = this.signal) {
    return this.api
      .get("https://p.cash/miniapp/skins/active", { signal })
      .then((res) => res.data);
  }

  /** Get Leagues */
  getLeagues(signal = this.signal) {
    return this.api
      .get("https://p.cash/miniapp/leagues", { signal })
      .then((res) => res.data);
  }

  /** Tap Coin */
  tapCoin(amount, signal = this.signal) {
    return this.api
      .post("https://p.cash/miniapp/taps", { amount }, { signal })
      .then((res) => res.data);
  }

  /** Process Farmer */
  async process() {
    const { user } = this._userData;

    this.logUserInfo(user);
    await this.executeTask("Onboarding", () => this.skipOnboarding(user));
    await this.executeTask("Tap Game", () => this.tapGame(user));
    await this.executeTask("Channels", () => this.joinRequiredChannels(user));
  }

  logUserInfo(user) {
    this.logger.newline();
    this.logCurrentUser();
    this.logger.keyValue("Energy", user.energy);
  }

  /** Skip Onboarding */
  async skipOnboarding(user) {
    if (!user.isOnboardingPassed) {
      await this.completeOnboarding();
      this.logger.success(`✅ Onboarding completed successfully!`);
    }
  }

  /** Join Required Channels */
  async joinRequiredChannels(user) {
    if (user["subscribed_status"] === "no") {
      for (const channel of [
        "pcash",
        "PirateCash_ENG",
        "Cosanta_io",
        "wdash",
        "cosanta_eng",
      ]) {
        /* Join Telegram Channel */
        await this.tryToJoinTelegramLink(`https://t.me/${channel}`);
        this.logger.info(`✅ Joined @${channel} successfully!`);

        /* Random delay between joins to mimic human behavior */
        await this.utils.delayForSeconds(3);
      }
    }
  }

  /** Tap Game */
  async tapGame(user) {
    let energy = user.energy;

    while (energy > 0) {
      /* Determine tap amount (random between 10 and 40, but not exceeding available energy) */
      const tapAmount = Math.min(energy, 10 + Math.floor(Math.random() * 30));
      energy -= tapAmount;

      /* Tap Coins */
      await this.tapCoin(tapAmount);
      this.logger.info(`🪙 Tapped ${tapAmount} coins.`);

      /* Random delay between taps to mimic human behavior */
      await this.utils.delayForSeconds(2);
    }
  }
}
