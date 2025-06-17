const BaseFarmer = require("../BaseFarmer");
const utils = require("../../lib/utils");

module.exports = class DragonzLandFarmer extends BaseFarmer {
  static id = "dragonz-land";
  static title = "🐉 Dragonz Land Farmer";
  static origin = "https://app.dragonz.land";
  static delay = 1;

  async setAuth() {
    /** Get Access Token */
    const accessToken = await this.api
      .post("https://app.dragonz.land/api/auth/telegram", {
        initData: this.farmer.initData,
      })
      .then((res) => res.data.accessToken);

    /** Set Headers */
    return this.farmer.setAuthorizationHeader("Bearer " + accessToken);
  }

  async process() {
    await this.claimWelcomeReward();

    const user = await this.api
      .get("https://app.dragonz.land/api/me")
      .then((res) => res.data);

    await this.tap(user);
    await this.completeTasks();
    await this.upgradeCards(user);
  }

  async upgradeCards(user) {
    const coins = user.coins;
    const diamonds = user.diamonds;

    const categories = await this.api
      .get("https://app.dragonz.land/api/card-categories")
      .then((res) => res.data);

    const result = await Promise.all(
      categories.map((category) =>
        this.api
          .get(`https://app.dragonz.land/api/cards?categoryId=${category.id}`)
          .then((res) => res.data.items)
      )
    );

    const cards = result.flat(1);

    const availableCards = cards.filter((item) => {
      const currentPosition = item.levelRecord ? item.levelRecord.level : 0;
      const currentLevel = item.levels[currentPosition];
      const nextLevel = item.levels[currentPosition + 1];

      if (!nextLevel) {
        return false;
      } else if (nextLevel.currency === "diamond") {
        return nextLevel.cost <= diamonds;
      } else {
        return nextLevel.cost <= coins;
      }
    });

    const card = utils.randomItem(availableCards);

    if (card) {
      await this.buyCard(card.id);
    }
  }

  async buyCard(cardId) {
    await this.api
      .post("https://app.dragonz.land/api/me/cards/buy", {
        cardId,
      })
      .then((res) => res.data);
  }

  async getBoosts() {
    return this.api
      .get("https://app.dragonz.land/api/boosts")
      .then((res) => res.data);
  }

  async tap(user) {
    /** Initial Energy */
    let energy = user.energy;

    /** Tap */
    if (energy > 0) {
      await this.feed(energy);
    }
  }

  async completeTasks() {
    const tasks = await this.api
      .get("https://app.dragonz.land/api/tasks")
      .then((res) => res.data);

    const availableTasks = tasks.filter(
      (item) =>
        ["visit", "claim", "watch-adsgram-ad"].includes(item.type) &&
        this.validateTaskLevel(item) &&
        this.validateTelegramTask(item.data?.url)
    );

    for (const task of availableTasks) {
      await this.tryToJoinTelegramLink(task.data?.url);
      await this.verifyTask(task.id);
    }
  }

  validateTaskLevel(item) {
    if (item.attemptsLimit === item.levelRecord?.attempts) {
      return false;
    }

    const currentPosition = item.levelRecord ? item.levelRecord.level : 0;
    const currentLevel = item.levels[currentPosition];
    const nextLevel = item.levels[currentPosition + 1];

    if (!nextLevel) {
      return false;
    }

    return (
      !currentLevel.waitingTime ||
      utils.dateFns.isAfter(
        new Date(),
        utils.dateFns.addSeconds(
          item.levelRecord?.attemptedAt
            ? new Date(item.levelRecord?.attemptedAt)
            : new Date(),
          currentLevel.waitingTime
        )
      )
    );
  }

  async claimWelcomeReward() {
    const reward = await this.api
      .get("https://app.dragonz.land/api/tasks/welcome-reward")
      .then((res) => res.data);

    if (!reward.levelRecord) {
      await this.verifyTask("welcome-reward");
    }
  }

  async feed(feedCount = 1) {
    await this.api.post("https://app.dragonz.land/api/me/feed", {
      feedCount,
    });
  }

  async verifyTask(taskId) {
    await this.api.post("https://app.dragonz.land/api/me/tasks/verify", {
      taskId,
    });
  }
};
