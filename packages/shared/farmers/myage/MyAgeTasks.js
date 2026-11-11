import FarmerModule from "../../lib/farmer/FarmerModule.js";
import { formatAmount } from "../../lib/farmer/format.js";
import {
  AGE_POINTS,
  GRAM_CURRENCY,
  HANDLED_TASK_KINDS,
  TASK_PRESS_SECONDS,
} from "./constants.js";

/** The task board: channel joins the drop checks and custom tasks it only counts */
export default class MyAgeTasks extends FarmerModule {
  /** Complete every open task the farmer can pass */
  async completeTasks() {
    const tasks = await this.ctx.api.fetchTasks();
    const open = tasks.filter(
      (task) => HANDLED_TASK_KINDS.has(task["kind"]) && !task["done"],
    );

    if (!open.length) {
      this.logger.info("No tasks to complete.");
      return;
    }

    for (const task of open) {
      if (this.signal.aborted) break;

      await this.completeTask(task);
    }

    /* Tasks pay spins and finish steps, so read the account again */
    await this.ctx.state.load();
  }

  /** Open a task's link, then press it until the drop counts it done */
  async completeTask(task) {
    const link = task["url"];

    /* A chat the farmer cannot join is left for a later run */
    if (link && !this.core.telegram.validateTask(link)) {
      this.logger.warn(`Skipped "${task["title"]}": cannot open its link.`);
      return;
    }

    try {
      await this.core.telegram.openTaskLink(link, 0);

      let current = task;

      while (!current["done"] && !this.signal.aborted) {
        current = await this.pressTask(current);

        /* A press that moved nothing will not move on a repeat */
        if (!current) return;
      }
    } catch (error) {
      this.logger.warn(`Skipped "${task["title"]}":`, error.message);
    }
  }

  /** Press a task once after its wait, returning the task as the drop now has it, or null when it did not count */
  async pressTask(task) {
    await this.waitBeforePress(task);

    const result = await this.ctx.api.pressTask(task["id"]);
    const updated = result["task"] || { ...task, done: true };

    this.ctx.state.applyBalances(result);

    if (updated["done"]) {
      this.logReward(task, result);
      return updated;
    }

    /* A press that did not count is a check the drop has not passed */
    if ((Number(updated["presses"]) || 0) <= (Number(task["presses"]) || 0)) {
      this.logger.warn(
        `"${task["title"]}" not done:`,
        result["message"] || "the check did not pass",
      );
      return null;
    }

    this.logger.info(
      `Pressed "${task["title"]}" (${updated["presses"]}/${updated["pressesRequired"]}).`,
    );

    return updated;
  }

  /** Wait out the drop's timer, or a person's pause between presses of a custom task */
  async waitBeforePress(task) {
    const waitSeconds = Math.ceil((Number(task["waitLeftMs"]) || 0) / 1000);
    const { MIN, MAX } = TASK_PRESS_SECONDS;
    const pauseSeconds =
      task["presses"] > 0 ? MIN + Math.floor(Math.random() * (MAX - MIN)) : 0;
    const seconds = Math.max(waitSeconds, pauseSeconds);

    if (seconds > 0) {
      await this.utils.delayForSeconds(seconds, { signal: this.signal });
    }
  }

  /** Log what a finished task paid */
  logReward(task, result) {
    const paid = [];

    /* AGE and GRAM, whichever the task paid */
    if (result["paid"] > 0) paid.push(`${result["paid"]} ${AGE_POINTS}`);

    if (result["gramPaid"] > 0) {
      paid.push(`${formatAmount(result["gramPaid"])} ${GRAM_CURRENCY}`);
    }

    this.logger.success(
      `Completed "${task["title"]}"${paid.length ? ` for ${paid.join(" + ")}` : ""}.`,
    );
  }
}
