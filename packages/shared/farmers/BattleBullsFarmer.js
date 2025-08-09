import BaseFarmer from "../lib/BaseFarmer.js";

export default class BattleBullsFarmer extends BaseFarmer {
  static id = "battle-bulls";
  static title = "Battle Bulls";
  static emoji = "🐂";
  static host = "tg.battle-games.com";
  static domains = ["battle-games.com"];
  static telegramLink =
    "https://t.me/battle_games_com_bot/start?startapp=frndId1147265290";
  static cacheAuth = false;

  /** Get Referral Link */
  getReferralLink() {
    return `https://t.me/battle_games_com_bot/start?startapp=frndId${this.getUserId()}`;
  }

  /** Get Auth */
  fetchAuth() {
    return { auth: this.telegramWebApp.initData };
  }

  /** Get Meta */
  fetchMeta() {
    return this.api
      .post(
        `https://api.battle-games.com:8443/api/api/v1/user?inviteCode=${this.getStartParam()}`
      )
      .then((res) => res.data.data);
  }

  /** Get Auth Headers */
  getAuthHeaders(data) {
    return {
      Authorization: data.auth,
    };
  }

  /** Set Blockchain ID */
  setBlockchain(id) {
    return this.api
      .put("https://api.battle-games.com:8443/api/api/v1/user/blockchain", {
        blockchainId: id,
      })
      .then((res) => res.data.data);
  }

  /** Buy Card */
  buyCard(id) {
    return this.api
      .post("https://api.battle-games.com:8443/api/api/v1/cards/buy", {
        cardId: id,
        requestedAt: Date.now(),
      })
      .then((res) => res.data.data);
  }

  /** Get Cards */
  getCards(signal = this.signal) {
    return this.api
      .get("https://api.battle-games.com:8443/api/api/v1/cards", { signal })
      .then((res) =>
        res.data.data.map((card) => ({
          ...card,
          icon: `https://tg.battle-games.com/bull-cards/${card.id}.png?1`,
        }))
      );
  }

  /** Claim Daily Reward */
  claimDailyReward() {
    return this.api
      .post(
        "https://api.battle-games.com:8443/api/api/v1/tasks/streak_days/complete",
        null
      )
      .then((res) => res.data.data);
  }

  /** Claim Task */
  claimTask(id) {
    return this.api
      .post(
        `https://api.battle-games.com:8443/api/api/v1/tasks/${id}/complete`,
        null
      )
      .then((res) => res.data.data);
  }

  /** Get Friends */
  getFriends(signal = this.signal) {
    return this.api
      .get(
        "https://api.battle-games.com:8443/api/api/v1/user/friends?page=0&size=10",
        {
          signal,
        }
      )
      .then((res) => res.data.data);
  }

  /** Get Tasks */
  getTasks(signal = this.signal) {
    return this.api
      .get("https://api.battle-games.com:8443/api/api/v1/tasks", { signal })
      .then((res) => res.data.data);
  }

  /** Get User */
  getUser(signal = this.signal) {
    return this.api
      .post("https://api.battle-games.com:8443/api/api/v1/user/sync", null, {
        signal,
      })
      .then((res) => res.data.data);
  }

  /** Validate Card Availability */
  validateCardAvailability(card) {
    return (
      card.boughtAt === null ||
      card.rechargingDuration === 0 ||
      this.utils.dateFns.isAfter(
        new Date(),
        new Date(card.boughtAt + card.rechargingDuration)
      )
    );
  }

  /** Validate Card Condition */
  validateCardCondition(card) {
    return card.condition === null || card.condition.passed;
  }

  /** Validate Runnable Task */
  validateRunnableTask(task) {
    return !["streak_days"].includes(task.id);
  }

  /** Validate Blockchain Task */
  validateBlockchainTask(user, task) {
    return task.id !== "select_blockchain" || user?.blockchainId;
  }

  /** Validate Friends Task */
  validateFriendsTask(task) {
    return (
      task.friendsMinimalCount === null ||
      task.friendsCount >= task.friendsMinimalCount
    );
  }

  /** Can Claim Daily Reward */
  canClaimDailyReward(tasks) {
    const task = tasks.find((item) => item.id === "streak_days");
    const { completedAt } = task;
    const status =
      completedAt === null ||
      !this.utils.dateFns.isToday(new Date(completedAt));

    return status;
  }

  /** Available Cards */
  getAvailableCards(balance, cards) {
    return cards.filter(
      (card) =>
        card.available && card.nextLevel && card.nextLevel.cost <= balance
    );
  }

  /** Upgradable Cards */
  getUpgradableCards(availableCards) {
    return availableCards
      .filter(
        (item) =>
          this.validateCardCondition(item) &&
          this.validateCardAvailability(item)
      )
      .sort((a, b) => {
        return b.nextLevel.profitPerHourDelta - a.nextLevel.profitPerHourDelta;
      });
  }

  /** Level Zero Cards */
  getLevelZeroCards(upgradableCards) {
    return upgradableCards.filter((item) => item.level === 0);
  }

  /** Required Cards */
  getRequiredCards(upgradableCards, availableCards) {
    return upgradableCards.filter((item) =>
      availableCards.some(
        (card) =>
          item.id === card.condition?.cardId &&
          item.level < card.condition?.level
      )
    );
  }

  /** Get Cards Data */
  getCardsData(balance, cards) {
    const availableCards = this.getAvailableCards(balance, cards);
    const upgradableCards = this.getUpgradableCards(availableCards);
    const levelZeroCards = this.getLevelZeroCards(upgradableCards);
    const requiredCards = this.getRequiredCards(
      upgradableCards,
      availableCards
    );

    return {
      availableCards,
      upgradableCards,
      levelZeroCards,
      requiredCards,
    };
  }

  /** Get Available Tasks */
  getAvailableTasks(user, tasks) {
    return tasks.filter(
      (task) =>
        this.validateRunnableTask(task) &&
        this.validateFriendsTask(task) &&
        this.validateBlockchainTask(user, task)
    );
  }

  /** Get Completed Tasks */
  getCompletedTasks(availableTasks) {
    return availableTasks.filter((item) => item["completedAt"]);
  }

  /** Get Uncompleted Tasks */
  getUncompletedTasks(availableTasks) {
    return availableTasks.filter((item) => !item["completedAt"]);
  }

  /** Get Tasks Data */
  getTasksData(user, tasks) {
    const availableTasks = this.getAvailableTasks(user, tasks);
    const completedTasks = this.getCompletedTasks(availableTasks);
    const uncompletedTasks = this.getUncompletedTasks(availableTasks);

    return {
      availableTasks,
      completedTasks,
      uncompletedTasks,
    };
  }

  /** Claim Taps */
  claimTaps(taps) {
    return this.api.post("https://api.battle-games.com:8443/api/api/v1/taps", {
      taps,
      availableEnergy: 0,
      requestedAt: Date.now(),
    });
  }

  /** Process Farmer */
  async process() {
    const user = await this.getUser();

    this.logUserInfo(user);

    await this.executeTask("Complete Tasks", () => this.completeTasks(user));
    await this.executeTask("Upgrade Cards", () => this.upgradeCards(), false);
    await this.executeTask("Tap Game", () => this.tapGame(user));
  }

  logUserInfo(user) {
    this.logger.newline();
    this.logger.keyValue("User", `${user.username} (${user.id})`);
    this.logger.keyValue("Balance", user.balance);
    this.logger.keyValue("Energy", user.availableEnergy);
  }

  /** Tap Game */
  async tapGame(user) {
    if (user.availableEnergy >= 1) {
      await this.claimTaps(user.availableEnergy);
    }
  }

  /** Complete Tasks */
  async completeTasks(user) {
    /** Tasks */
    const tasks = await this.getTasks();

    /** Set Blockchain */
    if (!user.blockchainId) {
      this.logger.log("Setting blockchain...");
      await this.setBlockchain("bitcoin");
    }

    /** Claim Daily Task */
    if (this.canClaimDailyReward(tasks)) {
      this.logger.log("Claiming daily reward...");
      await this.claimDailyReward();
    }

    const { uncompletedTasks } = this.getTasksData(user, tasks);

    for (const task of uncompletedTasks) {
      try {
        await this.tryToJoinTelegramLink(task.link);
        await this.claimTask(task.id);
      } catch (e) {
        this.logger.error(task, e);
      }
    }
  }

  /** Upgrade Cards */
  async upgradeCards() {
    while (true) {
      const card = await this.getCardToUpgrade();

      if (!card) {
        this.logger.log("No cards to upgrade.");
        break;
      }

      await this.buyCard(card.id);
      await this.utils.delay(1000);
    }
  }

  async getCardToUpgrade() {
    /** Get User */
    const user = await this.getUser();

    /** Cards */
    const cards = await this.getCards();

    const { upgradableCards, levelZeroCards, requiredCards } =
      this.getCardsData(user.balance, cards);

    /** Choose Collection */
    const collection = levelZeroCards.length
      ? levelZeroCards
      : requiredCards.length
      ? requiredCards
      : upgradableCards;

    /** Pick First Card */
    const card = this.utils.randomItem(collection);

    return card;
  }
}
