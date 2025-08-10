import BaseFarmer from "../lib/BaseFarmer.js";

export default class FunaticFarmer extends BaseFarmer {
  static id = "funatic";
  static title = "Funatic";
  static emoji = "🤡";
  static apiDelay = 1000;
  static host = "clicker.funtico.com";
  static domains = ["clicker.api.funtico.com", "*.funtico.com"];
  static telegramLink =
    "https://t.me/LuckyFunaticBot/lucky_funatic?startapp=1147265290";

  /** Get Referral Link */
  getReferralLink() {
    return `https://t.me/LuckyFunaticBot/lucky_funatic?startapp=${this.getUserId()}`;
  }

  /** Get Auth */
  fetchAuth(signal = this.signal) {
    return this.api
      .post(
        `https://api2.funtico.com/api/lucky-funatic/login?${this.getInitData()}`,
        null,
        { signal }
      )
      .then((res) => res.data.data);
  }

  /** Get Auth Headers */
  getAuthHeaders(data) {
    return {
      Authorization: `Bearer ${data.token}`,
    };
  }

  getGame(signal = this.signal) {
    return this.api
      .get("https://clicker.api.funtico.com/game", { signal })
      .then((res) => res.data.data);
  }

  async process() {
    await this.checkIn();
    await this.useBoosters();

    /** Get Game */
    const game = await this.getGame();

    this.logUserInfo(game);

    /** Upgrade Cards */
    await this.upgradeCards(game);

    /** Play Game */
    await this.playGame(game);
  }

  logUserInfo(game) {
    this.logger.newline();
    this.logCurrentUser();
    this.logger.keyValue("Balance", game.funz.currentFunzBalance);
    this.logger.keyValue("Energy", game.energy.currentEnergyBalance);
  }

  async playGame(game) {
    return this.executeTask("Play Game", async () => {
      /** Energy */
      let energy = game["energy"]["currentEnergyBalance"];

      while (energy > 0) {
        /** Calculate Amount to Collect */
        const taps = Math.min(energy, 8 + Math.floor(Math.random() * 3));

        /** Deduct Energy */
        energy -= taps;

        /** Tap */
        await this.api.post("https://clicker.api.funtico.com/tap", { taps });
      }
    });
  }

  async getUpgradableCard(balance, signal = this.signal) {
    const cards = await this.api
      .get("https://api2.funtico.com/api/lucky-funatic/cards", { signal })
      .then((res) => res.data.data);

    /** Available Cards */
    const upgradableCards = cards.filter(
      (card) =>
        card.buyOrUpgradeCost <= balance &&
        card.buyOrUpgradeRequirements.every(
          (item) => item.isMissing === false
        ) &&
        card.isMaxLevelReached === false &&
        card.isComingSoon === false
    );

    /** Level Zero Cards */
    const levelZeroCards = upgradableCards.filter(
      (card) => card.level === null
    );

    /** Choose Collection */
    const collection = levelZeroCards.length ? levelZeroCards : upgradableCards;

    /** Pick Random Card */
    const card = this.utils.randomItem(collection);

    return card;
  }

  /** Upgrade Cards */
  async upgradeCards(game) {
    return this.executeTask("Upgrade Cards", async () => {
      let balance = game.funz.currentFunzBalance;

      while (true) {
        const card = await this.getUpgradableCard(balance, this.signal);
        if (!card) break;

        /** Deduct Balance */
        balance -= card.buyOrUpgradeCost;

        const isUpgrade = card.level !== null;

        await this.api.post(
          isUpgrade
            ? "https://api2.funtico.com/api/lucky-funatic/upgrade-card"
            : "https://api2.funtico.com/api/lucky-funatic/buy-card",
          {
            cardId: card.id,
          }
        );

        this.logger.success("✓ Upgraded Card ");

        await this.utils.delayForSeconds(1);
      }
    });
  }

  getDailyBonus(signal = this.signal) {
    return this.api
      .get("https://clicker.api.funtico.com/daily-bonus", { signal })
      .then((res) => res.data.data);
  }

  async claimDailyBonus(signal = this.signal) {
    const ip = await this.api
      .get("https://ipwho.is", { signal })
      .then((res) => res.data);

    await this.api.post(
      "https://clicker.api.funtico.com/daily-bonus/claim",
      { timezone: ip.timezone.id },
      { signal }
    );
  }

  /** Check-In */
  async checkIn() {
    return this.executeTask("Check-In", async () => {
      const dailyBonus = await this.getDailyBonus();

      if (dailyBonus.cooldown === 0) {
        await this.claimDailyBonus();
      }
    });
  }

  getBoosters(signal = this.signal) {
    return this.api
      .get("https://clicker.api.funtico.com/boosters", { signal })
      .then((res) => res.data.data);
  }

  activateBooster(type, signal = this.signal) {
    return this.api.post(
      "https://clicker.api.funtico.com/boosters/activate",
      { boosterType: type },
      { signal }
    );
  }

  /** Use Boosters */
  async useBoosters() {
    return this.executeTask("Use Boosters", async () => {
      const boosters = await this.getBoosters();

      const availableBoosters = boosters.filter(
        (item) =>
          item.price === 0 &&
          item.isActive === false &&
          item.cooldownLeft === 0 &&
          item.usagesLeft !== 0
      );

      for (const booster of availableBoosters) {
        await this.activateBooster(booster.type);
      }
    });
  }
}
