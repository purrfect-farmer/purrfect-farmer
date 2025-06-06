const BaseFarmer = require("../BaseFarmer");
const utils = require("../../lib/utils");

module.exports = class FunaticFarmer extends BaseFarmer {
  static id = "funatic";
  static origin = "https://clicker.funtico.com";
  static delay = 1;

  async setAuth() {
    /** Get Access Token */
    const accessToken = await this.api
      .post(
        "https://api2.funtico.com/api/lucky-funatic/login?" +
          this.farmer.initData
      )
      .then((res) => res.data.data.token);

    /** Set Headers */
    return this.farmer.setAuthorizationHeader("Bearer " + accessToken);
  }

  async process() {
    await this.checkIn();
    await this.useBoosters();

    /** Get Game */
    const game = await this.api
      .get("https://clicker.api.funtico.com/game")
      .then((res) => res.data.data);

    /** Upgrade Cards */
    await this.upgradeCards(game);

    /** Play Game */
    await this.playGame(game);
  }

  async playGame(game) {
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
  }

  /** Upgrade Cards */
  async upgradeCards(game) {
    const balance = game.funz.currentFunzBalance;

    const cards = await this.api
      .get("https://api2.funtico.com/api/lucky-funatic/cards")
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
    const card = utils.randomItem(collection);

    if (card) {
      const isUpgrade = card.level !== null;

      await this.api.post(
        isUpgrade
          ? "https://api2.funtico.com/api/lucky-funatic/upgrade-card"
          : "https://api2.funtico.com/api/lucky-funatic/buy-card",
        {
          cardId: card.id,
        }
      );
    }
  }

  /** Check-In */
  async checkIn() {
    const dailyBonus = await this.api
      .get("https://api2.funtico.com/api/lucky-funatic/daily-bonus/config")
      .then((res) => res.data.data);

    if (dailyBonus.cooldown === 0) {
      await this.api.post(
        "https://api2.funtico.com/api/lucky-funatic/daily-bonus/claim"
      );
    }
  }

  /** Use Boosters */
  async useBoosters() {
    const boosters = await this.api
      .get("https://clicker.api.funtico.com/boosters")
      .then((res) => res.data.data);

    const availableBoosters = boosters.filter(
      (item) =>
        item.price === 0 &&
        item.isActive === false &&
        item.cooldownLeft === 0 &&
        item.usagesLeft !== 0
    );

    for (const booster of availableBoosters) {
      await this.api.post("https://clicker.api.funtico.com/boosters/activate", {
        boosterType: booster.type,
      });
    }
  }
};
