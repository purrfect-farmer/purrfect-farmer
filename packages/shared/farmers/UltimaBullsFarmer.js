import BaseFarmer from "../lib/BaseFarmer.js";

export default class UltimaBullsFarmer extends BaseFarmer {
  static id = "ultima-bulls";
  static title = "Ultima Bulls";
  static emoji = "🐂";
  static host = "ub.battle-games.com";
  static domains = [
    "ub.battle-games.com",
    "ub-api.battle-games.com",
    "tg.battle-games.com",
  ];
  static telegramLink =
    "https://t.me/UltimaBulls_com_bot/start?startapp=frndId1147265290";

  static interval = "*/30 * * * *";
  static cacheAuth = false;
  static rating = 5;

  /** Get Referral Link */
  getReferralLink() {
    return `https://t.me/UltimaBulls_com_bot/start?startapp=frndId${this.getUserId()}`;
  }

  /** Get Auth */
  fetchAuth() {
    return { auth: this.telegramWebApp.initData };
  }

  /** Get Meta */
  fetchMeta() {
    return this.api
      .post(
        `https://ub-api.battle-games.com/api/v1/user?inviteCode=${this.getStartParam()}`
      )
      .then((res) => res.data.data);
  }

  /** Get Auth Headers */
  getAuthHeaders(data) {
    return {
      Authorization: data.auth,
    };
  }

  /** Claim Task */
  claimTask(id) {
    return this.api
      .post(`https://ub-api.battle-games.com/api/v1/tasks/${id}/complete`, null)
      .then((res) => res.data.data);
  }

  /** Get Tasks */
  getTasks(signal = this.signal) {
    return this.api
      .get("https://ub-api.battle-games.com/api/v1/tasks", { signal })
      .then((res) => res.data.data);
  }

  /** Get User */
  getUser(signal = this.signal) {
    return this.api
      .post("https://ub-api.battle-games.com/api/v1/user/sync", null, {
        signal,
      })
      .then((res) => res.data.data);
  }

  /** Validate Friends Task */
  validateFriendsTask(task) {
    return (
      task.friendsMinimalCount === null ||
      task.friendsCount >= task.friendsMinimalCount
    );
  }

  /** Get Available Tasks */
  getAvailableTasks(tasks) {
    return tasks.filter(
      (task) =>
        this.validateTelegramTask(task.link ?? null) &&
        this.validateFriendsTask(task)
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
  getTasksData(tasks) {
    const availableTasks = this.getAvailableTasks(tasks);
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
    return this.api.post("https://ub-api.battle-games.com/api/v1/taps", {
      taps,
      availableEnergy: 0,
      requestedAt: Date.now(),
    });
  }

  /** Process Farmer */
  async process() {
    const user = await this.getUser();

    this.logUserInfo(user);

    await this.executeTask("Complete Tasks", () => this.completeTasks());
    await this.executeTask("Tap Game", () => this.tapGame(user));
  }

  logUserInfo(user) {
    this.logger.newline();
    this.logCurrentUser();
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
  async completeTasks() {
    /** Tasks */
    const tasks = await this.getTasks();

    const { uncompletedTasks } = this.getTasksData(tasks);

    for (const task of uncompletedTasks) {
      try {
        await this.tryToJoinTelegramLink(task.link);
        await this.claimTask(task.id);
      } catch (e) {
        this.logger.error(task, e);
      }
    }
  }
}
