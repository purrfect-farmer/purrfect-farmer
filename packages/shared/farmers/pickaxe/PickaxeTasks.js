import FarmerModule from "../../lib/farmer/FarmerModule.js";
import { formatAmount } from "../../lib/farmer/format.js";
import {
  MINIMUM_FRIENDS_REWARD,
  PXE_TOKEN,
  SKIPPED_TASK_KINDS,
  TASK_STATUS,
} from "./constants.js";

/** The daily check-in, the task board and the friends reward */
export default class PickaxeTasks extends FarmerModule {
  /** Claim today's check-in when it is open */
  async checkIn() {
    const { state } = this.ctx;

    if (state.data["checkin"]?.["checkedToday"]) {
      this.logger.info("Already checked in today.");
      return;
    }

    const result = state.apply(await this.ctx.api.checkIn());

    this.logger.success(
      `Checked in day ${result["checkin"]?.["streak"]} for ${result["checkinReward"]} ${PXE_TOKEN}.`,
    );
  }

  /** A task's status for the account, by id */
  taskStatus(taskId) {
    const statuses = this.ctx.state.data["tasks"] || [];

    return statuses.find((task) => task["id"] === taskId) || {};
  }

  /** Claim every ready task and start the rest the farmer can pass */
  async completeTasks() {
    const definitions = this.ctx.state.data["taskDefs"] || [];
    const statusById = new Map(
      (this.ctx.state.data["tasks"] || []).map((task) => [task["id"], task]),
    );
    const open = definitions.filter((task) => {
      const status = statusById.get(task["id"])?.["status"];

      return (
        !SKIPPED_TASK_KINDS.has(task["kind"]) &&
        [TASK_STATUS.TODO, TASK_STATUS.STARTED, TASK_STATUS.READY].includes(
          status,
        )
      );
    });

    if (!open.length) {
      this.logger.info("No tasks to complete.");
      return;
    }

    for (const task of open) {
      if (this.signal.aborted) break;

      await this.completeTask(task);
    }
  }

  /** Start a task that has not been, wait out its timer, then claim it */
  async completeTask(task) {
    if (this.taskStatus(task["id"])["status"] === TASK_STATUS.TODO) {
      const started = await this.startTask(task);

      if (!started) return;
    }

    const readyAt = Number(this.taskStatus(task["id"])["readyAt"]) || 0;
    const waitMs = readyAt - Date.now();

    if (waitMs > 0) {
      await this.utils.delayForSeconds(Math.ceil(waitMs / 1000) + 1, {
        signal: this.signal,
      });
    }

    return this.claimTask(task);
  }

  /** Open the task's link, joining it when it is a Telegram chat, then start it, returning whether it started */
  async startTask(task) {
    const link = task["url"];

    if (link && !this.core.telegram.validateTask(link)) return false;

    try {
      await this.core.telegram.openTaskLink(link, 0);
      this.ctx.state.apply(await this.ctx.api.startTask(task["id"]));
    } catch (error) {
      this.logger.warn(`Skipped "${task["title"]}":`, error.message);
      return false;
    }

    return true;
  }

  /** Claim one task, leaving it for a later run when its check has not passed */
  async claimTask(task) {
    try {
      const result = this.ctx.state.apply(
        await this.ctx.api.claimTask(task["id"]),
      );

      this.logger.success(
        `Claimed "${task["title"]}" for ${result["taskReward"]} ${PXE_TOKEN}.`,
      );
    } catch (error) {
      this.logger.warn(`Skipped "${task["title"]}":`, error.message);
    }

    await this.utils.delayForSeconds(2, { signal: this.signal });
  }

  /** Claim the share friends have earned once it is worth claiming */
  async claimFriendsReward() {
    const pending = Number(this.ctx.state.data["refs"]?.["pending"]) || 0;

    if (pending < MINIMUM_FRIENDS_REWARD) {
      this.logger.info("No friends reward to claim.");
      return;
    }

    const result = this.ctx.state.apply(await this.ctx.api.claimReferrals());

    this.logger.success(
      `Claimed ${formatAmount(result["refClaimed"] ?? pending)} ${PXE_TOKEN} from friends.`,
    );
  }
}
