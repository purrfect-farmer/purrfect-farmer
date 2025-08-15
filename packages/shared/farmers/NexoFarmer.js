import BaseInstantTaskFarmer from "../lib/BaseInstantTaskFarmer.js";

export default class NexoFarmer extends BaseInstantTaskFarmer {
  static id = "nexo";
  static title = "Nexo";
  static host = "tg.instatasker.online";
  static domains = ["tg.instatasker.online"];
  static telegramLink = "https://t.me/Nexo_ta_bot?startapp=1147265290";
  static baseURL = `https://${this.host}`;

  getTasks(signal = this.signal) {
    return this.api
      .post(
        "/user/tasks",
        {
          ["user_id"]: this.getUserId(),
          ["webappdata"]: this.getInitData(),
        },
        { signal }
      )
      .then((res) => res.data);
  }

  verifyTask(id, signal = this.signal) {
    return this.api
      .post(
        "/user/task/verify",
        {
          ["task_id"]: id,
          ["telegram_id"]: this.getUserId(),
          ["webappdata"]: this.getInitData(),
        },
        { signal }
      )
      .then((res) => res.data);
  }

  async completeTasks() {
    return this.executeTask("Complete Tasks", async () => {
      const tasks = await this.getTasks();
      if (!tasks || tasks.length === 0) {
        this.logger.warn("No tasks available to complete.");
        return;
      }

      for (const task of tasks) {
        if (task["status"] === "Active") {
          const taskLink = `https://t.me/${task["username"].slice(1)}`;
          await this.tryToJoinTelegramLink(taskLink);
          await this.verifyTask(task["id"]);
          this.logger.success(`✓ Completed Task: ${task["name"]}`);
        } else {
          this.logger.info(`Task ${task["name"]} is already completed.`);
        }
      }
    });
  }

  async process() {
    await super.process();
    await this.completeTasks();
  }
}
