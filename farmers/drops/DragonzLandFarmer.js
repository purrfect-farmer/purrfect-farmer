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

    await this.claimChests(user);
    await this.tap(user);
    await this.completeTasks();
    await this.upgradeCards(user);
  }

  async claimChests(user) {
    for (const chest of user.chestRecords) {
      await this.api
        .get(`https://app.dragonz.land/api/chests/${chest.chestId}`)
        .then((res) => res.data);
      await this.api
        .post("https://app.dragonz.land/api/me/chests/unlock", {
          chestRecordId: chest.chestRecordId,
        })
        .then((res) => res.data);
    }
  }

  async upgradeCards(user) {
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

    let cards = result.flat(1).map((item) => {
      const currentPosition = item.levelRecord ? item.levelRecord.level : 0;
      const currentLevel = item.levels[currentPosition];
      const nextLevel = item.levels[currentPosition + 1];
      return {
        ...item,
        currentPosition,
        currentLevel,
        nextLevel,
      };
    });

    let coins = user.coins;
    let diamonds = user.diamonds;
    let card;

    while ((card = this.getAvailableCard(cards, coins, diamonds))) {
      /** Exclude Card */
      cards = cards.filter((item) => item.id !== card.id);

      if (card.nextLevel.currency === "diamond") {
        diamonds -= card.nextLevel.cost;
      } else {
        coins -= card.nextLevel.cost;
      }

      for (const task of card.nextLevel.tasks) {
        try {
          await this.tryToJoinTelegramLink(task.data?.url);
          await this.verifyTask(task.id);
        } catch (e) {
          this.logTaskError(task, e);
        }
      }
      await this.buyCard(card.id);
    }
  }

  getAvailableCard(cards, coins, diamonds) {
    const availableCards = cards.filter((item) => {
      const nextLevel = item.nextLevel;
      if (!nextLevel) return false;

      const affordable =
        nextLevel.currency === "diamond"
          ? nextLevel.cost <= diamonds
          : nextLevel.cost <= coins;

      const allTasksValid = nextLevel.tasks.every(
        (task) =>
          task.type === "visit" && this.validateTelegramTask(task.data?.url)
      );

      return affordable && allTasksValid;
    });

    return utils.randomItem(availableCards);
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

    /** Claim Daily Reward */
    const dailyReward = tasks.find((item) => item.id === "daily-claim");

    if (
      !dailyReward.levelRecord ||
      !utils.dateFns.isToday(new Date(dailyReward.levelRecord.attemptedAt))
    ) {
      try {
        await this.verifyTask(dailyReward.id);
      } catch (e) {
        this.logTaskError(dailyReward, e);
      }
    }

    /** Ad Task */
    const adTask = tasks.find((item) => item.id === "daily-watch-adsgram-ad");

    if (this.validateTaskLevel(adTask)) {
      try {
        await this.verifyTask(adTask.id);
      } catch (e) {
        this.logTaskError(adTask, e);
      }
    }

    /** Other Tasks */
    const availableTasks = tasks.filter(
      (item) =>
        item.type === "visit" &&
        this.validateTelegramTask(item.data?.url) &&
        this.validateTaskLevel(item)
    );

    for (const task of availableTasks) {
      try {
        await this.tryToJoinTelegramLink(task.data?.url);
        await this.verifyTask(task.id);
      } catch (e) {
        this.logTaskError(task, e);
      }
    }
  }

  validateTaskLevel(item) {
    if (item.attemptsLimit === item.levelRecord?.attempts) {
      if (
        item.recurrence === "daily" &&
        !utils.dateFns.isToday(new Date(item.levelRecord.attemptedAt))
      ) {
        return true;
      } else {
        return false;
      }
    }

    const currentPosition = item.levelRecord ? item.levelRecord.level : 0;
    const currentLevel = item.levels.find(
      (level) => level.index === currentPosition
    );
    const nextLevel = item.levels.find(
      (level) => level.index === currentPosition + 1
    );

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
