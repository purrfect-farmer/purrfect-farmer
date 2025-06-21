const BaseFarmer = require("../BaseFarmer");
const utils = require("../../lib/utils");

module.exports = class BattleBullsFarmer extends BaseFarmer {
  static id = "battle-bulls";
  static title = "🐂 Battle Bulls Farmer";
  static origin = "https://tg.battle-games.com";
  static auth = true;

  async setAuth() {
    /** Set Headers */
    return this.farmer.setAuthorizationHeader(this.farmer.initData);
  }

  async process() {
    /** Join */
    try {
      await this.api.post(
        `https://api.battle-games.com:8443/api/api/v1/user?inviteCode=${this.farmer.initDataUnsafe["start_param"]}`
      );
    } catch (error) {
      console.error(error);
    }

    /** User */
    const user = await this.api
      .post("https://api.battle-games.com:8443/api/api/v1/user/sync")
      .then((res) => res.data.data);

    await this.completeTasks(user);
    await this.upgradeCards(user);
    await this.tapGame(user);
  }

  /** Tap Game */
  async tapGame(user) {
    if (user.availableEnergy > 0) {
      await this.api.post("https://api.battle-games.com:8443/api/api/v1/taps", {
        taps: user.availableEnergy,
        availableEnergy: 0,
        requestedAt: Date.now(),
      });
    }
  }

  /** Complete Tasks */
  async completeTasks(user) {
    /** Tasks */
    const tasks = await this.api
      .get("https://api.battle-games.com:8443/api/api/v1/tasks")
      .then((res) => res.data.data);

    /** Set Blockchain */
    if (!user.blockchainId) {
      await this.api
        .post("https://api.battle-games.com:8443/api/api/v1/user/blockchain", {
          blockchainId: "bitcoin",
        })
        .then((res) => res.data.data);
    }

    /** Claim Daily Task */
    const dailyTask = tasks.find((item) => item.id === "streak_days");
    if (
      dailyTask.completedAt === null ||
      !utils.dateFns.isToday(new Date(dailyTask.completedAt))
    ) {
      await this.api
        .post(
          "https://api.battle-games.com:8443/api/api/v1/tasks/streak_days/complete"
        )
        .then((res) => res.data.data);
    }

    /** Complete Tasks */
    const availableTasks = tasks.filter(
      (item) =>
        "streak_days" !== item.id &&
        this.validateTelegramTask(item.link ?? null) &&
        this.validateFriends(item) &&
        this.validateBlockchain(item, user)
    );

    /** Uncompleted Tasks */
    const uncompletedTasks = availableTasks.filter((item) => !item.completedAt);

    if (uncompletedTasks.length > 0) {
      const task = utils.randomItem(uncompletedTasks);

      await this.tryToJoinTelegramLink(task.link);
      await this.api.post(
        `https://api.battle-games.com:8443/api/api/v1/tasks/${task.id}/complete`
      );
    }
  }

  /** Upgrade Cards */
  async upgradeCards(user) {
    /** Cards */
    const cards = await this.api
      .get("https://api.battle-games.com:8443/api/api/v1/cards")
      .then((res) => res.data.data);

    /** Available Cards */
    const availableCards = cards.filter(
      (card) =>
        card.available && card.nextLevel && card.nextLevel.cost <= user.balance
    );

    /** Upgradable Cards */
    const upgradableCards = availableCards
      .filter(
        (item) =>
          this.validateCardCondition(item) &&
          this.validateCardAvailability(item)
      )
      .sort((a, b) => {
        return b.nextLevel.profitPerHourDelta - a.nextLevel.profitPerHourDelta;
      });

    /** Level Zero Cards */
    const levelZeroCards = upgradableCards.filter((item) => item.level === 0);

    /** Required Cards */
    const requiredCards = upgradableCards.filter((item) =>
      availableCards.some(
        (card) =>
          item.id === card.condition?.cardId &&
          item.level < card.condition?.level
      )
    );

    /** Choose Collection */
    const collection = levelZeroCards.length
      ? levelZeroCards
      : requiredCards.length
      ? requiredCards
      : upgradableCards;

    /** Pick First Card */
    const card = utils.randomItem(collection);

    if (card) {
      await this.api.post(
        "https://api.battle-games.com:8443/api/api/v1/cards/buy",
        {
          cardId: card.id,
          requestedAt: Date.now(),
        }
      );
    }
  }

  validateCardCondition(item) {
    return item.condition === null || item.condition.passed;
  }

  validateCardAvailability(item) {
    return (
      item.boughtAt === null ||
      item.rechargingDuration === 0 ||
      utils.dateFns.isAfter(
        new Date(),
        new Date(item.boughtAt + item.rechargingDuration)
      )
    );
  }

  validateBlockchain(item, user) {
    return item.id !== "select_blockchain" || user.blockchainId;
  }

  validateFriends(item) {
    return (
      item.friendsMinimalCount === null ||
      item.friendsCount >= item.friendsMinimalCount
    );
  }
};
