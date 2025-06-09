const BaseFarmer = require("../BaseFarmer");
const utils = require("../../lib/utils");

module.exports = class FrogsterFarmer extends BaseFarmer {
  static id = "frogster";
  static title = "🐸 Frogster";
  static origin = "https://frogster.app";
  static shouldSetAuth = true;

  async setAuth() {
    /** Get Access Token */
    const accessToken = await this.api
      .post("https://frogster.app/api/auth", {
        ["init_data"]: this.farmer.initData,
        ["ref_code"]: "",
      })
      .then((res) => res.data.token);

    /** Set Headers */
    return this.farmer.setAuthorizationHeader("Bearer " + accessToken);
  }

  async process() {
    const user = await this.api
      .get("https://frogster.app/api/me")
      .then((res) => res.data);

    if (!user["in_community"]) {
      await this.tryToJoinTelegramLink("https://t.me/FrogsterChat");
    }

    const tasks = await this.api
      .get("https://frogster.app/api/tasks")
      .then((res) => res.data);

    const ownTasks = await this.api
      .get("https://frogster.app/api/tasks/own")
      .then((res) => res.data);

    const completedTasks = ownTasks.map((item) => item.id);
    const availableTasks = tasks.filter(
      (item) => !completedTasks.includes(item.id) && !item.tag
    );

    const uncompletedTasks = availableTasks.filter((item) =>
      this.validateTelegramTask(item.url)
    );

    if (uncompletedTasks.length > 0) {
      const task = utils.randomItem(uncompletedTasks);
      await this.tryToJoinTelegramLink(task.url);
      await this.api.get(`https://frogster.app/api/tasks/assign/${task.id}`);
    }

    const balance = await this.api
      .get("https://frogster.app/api/wallets/balance")
      .then((res) => res.data);

    const anHourAgo = utils.dateFns.subHours(new Date(), 1);
    const lastClaimedDate = new Date(balance["last_claimed_at"] + "Z");

    if (utils.dateFns.isBefore(lastClaimedDate, anHourAgo)) {
      await this.api.post(
        "https://frogster.app/api/wallets/claim?claim_plan_type=1&currency=TON"
      );
    }
  }
};
