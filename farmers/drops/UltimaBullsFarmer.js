const BaseFarmer = require("../BaseFarmer");
const utils = require("../../lib/utils");

module.exports = class UltimaBullsFarmer extends BaseFarmer {
  static id = "ultima-bulls";
  static title = "🐂 Ultima Bulls Farmer";
  static origin = "https://ub.battle-games.com";
  static shouldSetAuth = true;

  async setAuth() {
    /** Set Headers */
    return this.farmer.setAuthorizationHeader(this.farmer.initData);
  }

  async process() {
    /** Join */
    try {
      await this.api.post(
        `https://ub-api.battle-games.com/api/v1/user?inviteCode=${this.farmer.initDataUnsafe["start_param"]}`
      );
    } catch (error) {
      console.error(error);
    }

    /** User */
    const user = await this.api
      .post("https://ub-api.battle-games.com/api/v1/user/sync")
      .then((res) => res.data.data);

    await this.completeTasks(user);
    await this.tapGame(user);
  }

  /** Tap Game */
  async tapGame(user) {
    if (user.availableEnergy > 0) {
      await this.api.post("https://ub-api.battle-games.com/api/v1/taps", {
        taps: user.availableEnergy,
        availableEnergy: 0,
        requestedAt: Date.now(),
      });
    }
  }

  /** Complete Tasks */
  async completeTasks() {
    /** Tasks */
    const tasks = await this.api
      .get("https://ub-api.battle-games.com/api/v1/tasks")
      .then((res) => res.data.data);

    /** Complete Tasks */
    const availableTasks = tasks.filter(
      (item) =>
        this.validateTelegramTask(item.link ?? null) &&
        this.validateFriends(item)
    );

    /** Uncompleted Tasks */
    const uncompletedTasks = availableTasks.filter((item) => !item.completedAt);

    if (uncompletedTasks.length > 0) {
      const task = utils.randomItem(uncompletedTasks);

      await this.tryToJoinTelegramLink(task.link);
      await this.api.post(
        `https://ub-api.battle-games.com/api/v1/tasks/${task.id}/complete`
      );
    }
  }

  validateFriends(item) {
    return (
      item.friendsMinimalCount === null ||
      item.friendsCount >= item.friendsMinimalCount
    );
  }
};
