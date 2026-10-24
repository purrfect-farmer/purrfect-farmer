import FarmerModule from "../../lib/farmer/FarmerModule.js";
import { formatAmount } from "../../lib/farmer/format.js";
import {
  DEFAULT_TASK_WAIT_SECONDS,
  LOOT_TOKEN,
  SOCIAL_CHECK_TYPES,
  TASK_STATUS,
} from "./constants.js";
import { fromNano } from "./loot.js";

/** The daily streak, the task board and the friends reward */
export default class LootVaultTasks extends FarmerModule {
  /** Claim today's streak day when it is open */
  async claimStreak() {
    const { streak } = await this.ctx.api.fetchTasks();

    if (!streak?.["canClaim"]) {
      this.logger.info("The streak is not claimable yet.");
      return;
    }

    const result = await this.ctx.api.claimStreak();
    const parts = (result["droppedItems"] || []).length;

    this.logger.success(
      `Claimed streak day ${result["claimedDay"]} for ${result["reward"]} ${LOOT_TOKEN}` +
        (parts ? ` and ${parts} part(s).` : "."),
    );
  }

  /** Claim every ready task and start the rest */
  async completeTasks() {
    const { tasks = [] } = await this.ctx.api.fetchTasks();
    const open = tasks.filter((task) => task["status"] !== TASK_STATUS.CLAIMED);

    if (!open.length) {
      this.logger.info("No tasks to complete.");
      return;
    }

    for (const task of open) {
      if (this.signal.aborted) break;

      await this.completeTask(task);
    }
  }

  /** Claim a ready task, otherwise join its chat or wait out its timer between starting and claiming */
  async completeTask(task) {
    if (task["status"] === TASK_STATUS.NEW) {
      const started = await this.startTask(task);

      if (!started) return;
    }

    return this.claimTask(task);
  }

  /** Join the task's chat or wait out its timer around starting it, returning whether it started */
  async startTask(task) {
    const link = task["link"];

    /** A task with no link is an achievement the page only lets you claim once ready */
    if (!link || !this.core.telegram.validateTask(link)) return false;

    await this.core.telegram.openTaskLink(link, 0);
    await this.ctx.api.startTask(task["id"]);

    if (!SOCIAL_CHECK_TYPES.has(task["checkType"])) {
      await this.utils.delayForSeconds(
        parseInt(task["checkParam"]) || DEFAULT_TASK_WAIT_SECONDS,
        { signal: this.signal },
      );
    }

    return true;
  }

  /** Claim one task, leaving it for a later run when its check has not passed */
  async claimTask(task) {
    try {
      const result = await this.ctx.api.claimTask(task["id"]);

      this.logger.success(
        `Claimed "${task["title"]}" for ${result["reward"]} ${LOOT_TOKEN}.`,
      );
    } catch (error) {
      this.logger.warn(`Skipped "${task["title"]}":`, error.message);
    }

    await this.utils.delayForSeconds(2, { signal: this.signal });
  }

  /** Collect the friends reward when a friend has earned one */
  async claimFriendsReward() {
    const { friends = [] } = await this.ctx.session.loadFriends();
    const pending = friends.reduce(
      (total, friend) => total.plus(fromNano(friend["p"])),
      fromNano(0),
    );

    if (pending.lessThanOrEqualTo(0)) {
      this.logger.info("No friends reward to collect.");
      return;
    }

    await this.ctx.api.claimFriendsReward();
    this.ctx.session.forgetFriends();

    this.logger.success(
      `Collected ${formatAmount(pending)} ${LOOT_TOKEN} from friends.`,
    );
  }
}
