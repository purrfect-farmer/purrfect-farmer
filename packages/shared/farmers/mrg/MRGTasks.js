import {
  DEFAULT_TASK_COOLDOWN_HOURS,
  HOLD_TASK_TYPES,
  TASK_COOLDOWN_HOURS,
  TASK_DWELL_SECONDS,
  TASK_INELIGIBLE_CODE,
} from "./constants.js";
import Decimal from "decimal.js";

/** Trait: tasks, their cooldowns and squad rewards */
export default class MRGTasks {
  /* --------------------------------------------------------------------- */
  /* Tasks                                                                 */
  /* --------------------------------------------------------------------- */

  /** Every task the drop is currently offering */
  getTasks() {
    return this.account_data?.["tasks"] || [];
  }

  /** The tasks the drop has already settled for good */
  getCompletedTaskIds() {
    return this.account_data?.["completedTaskIds"] || [];
  }

  /** The window a recurring task waits out, in milliseconds */
  getTaskCooldownMs(task) {
    const hours =
      TASK_COOLDOWN_HOURS[task["taskType"]] ?? DEFAULT_TASK_COOLDOWN_HOURS;

    return hours * 60 * 60 * 1000;
  }

  /** Whether the local record says a recurring task is still cooling down */
  isTaskOnCooldown(task) {
    const claimedAt = Number(this.taskClaims?.[task["taskId"]]) || 0;

    return claimedAt + this.getTaskCooldownMs(task) > Date.now();
  }

  /** Remember when a task was claimed, so the next pass can wait it out */
  recordTaskClaim(taskId, claimedAt = Date.now()) {
    this.taskClaims = { ...(this.taskClaims || {}), [taskId]: claimedAt };
  }

  /** Hold a task back for this many hours instead of its own window */
  deferTask(task, hours) {
    this.recordTaskClaim(
      task["taskId"],
      Date.now() - this.getTaskCooldownMs(task) + hours * 60 * 60 * 1000,
    );
  }

  /** Whether the drop has refused this task for the account for good */
  isTaskIneligible(task) {
    return (this.ineligibleTasks || []).includes(String(task["taskId"]));
  }

  /** Never offer a task to the account again once the drop has refused it for good */
  async markTaskIneligible(task) {
    if (this.isTaskIneligible(task)) return;

    this.ineligibleTasks = [
      ...(this.ineligibleTasks || []),
      String(task["taskId"]),
    ];

    try {
      await this.storage?.set("ineligibleTasks", this.ineligibleTasks);
    } catch (error) {
      this.logger.warn("Failed to store the ineligible task:", error.message);
    }
  }

  /** Whether a task is settled against the wallet's holding rather than a link */
  isHoldTask(task) {
    return HOLD_TASK_TYPES.includes(task["verificationType"]);
  }

  /** Whether the wallet holds what a hold task asks for, so a claim is not wasted on it */
  async meetsHoldRequirement(task) {
    if (!this.getConnectedWalletAddress()) return false;

    if (task["verificationType"] === "token_hold") {
      return this.getWalletHolding().greaterThanOrEqualTo(
        task["minHolding"] || 0,
      );
    }

    return (
      this.countNftHoldings(await this.readNftHoldings()) >=
      (task["minNfts"] || 1)
    );
  }

  /** Whether a task is worth spending a claim on right now */
  isTaskClaimable(task) {
    if (task["isPaused"] || this.isTaskIneligible(task)) return false;

    /** The drop checks membership, so a chat the farmer may not join is not worth a claim */
    if (
      !this.isHoldTask(task) &&
      !this.validateTelegramTask(this.getTaskUrl(task))
    ) {
      return false;
    }

    if (!task["taskType"] || task["taskType"] === "one_time") {
      return (
        !this.getCompletedTaskIds().includes(task["taskId"]) &&
        !this.isTaskOnCooldown(task)
      );
    }

    return !this.isTaskOnCooldown(task);
  }

  /** Claim every task that is open to this account */
  async completeTasks() {
    const claimableTasks = this.getTasks().filter((task) =>
      this.isTaskClaimable(task),
    );

    if (!claimableTasks.length) {
      this.logger.info("No tasks to claim.");
      return;
    }

    for (const task of claimableTasks) {
      if (this.signal.aborted) break;

      if (this.isHoldTask(task) && !(await this.meetsHoldRequirement(task))) {
        continue;
      }

      await this.completeTask(task);
    }
  }

  /** The task's link with any referral swapped for this account, as the page opens it */
  getTaskUrl(task) {
    const userId = String(this.getUserId() || "0");

    return String(task["url"] || "")
      .replace(/REFCODE/g, userId)
      .replace(/(startapp=ref_)[A-Za-z0-9_]+/g, `$1${userId}`)
      .replace(/(startapp%3Dref_)[A-Za-z0-9_]+/g, `$1${userId}`);
  }

  /** Complete one task the way the page does: open it, dwell, then claim; a hold task is claimed straight away */
  async completeTask(task) {
    if (!this.isHoldTask(task)) {
      await this.openTaskLink(this.getTaskUrl(task), TASK_DWELL_SECONDS);
    }

    const result = await this.claimTask(task["taskId"]);

    if (result?.["success"]) {
      this.recordTaskClaim(task["taskId"]);
      this.logger.success(
        `Claimed "${task["title"]}" for ${task["reward"]} MRG.`,
      );
    } else if (result?.["code"] === TASK_INELIGIBLE_CODE) {
      /** The page hides the task for good, so it is never claimed again */
      await this.markTaskIneligible(task);
      this.logger.warn(
        `"${task["title"]}" is not available for this account, skipping it for good.`,
      );
    } else {
      /** A hold the drop has not counted long enough yet is retried after the hold it asks for, or the task's window */
      if (this.isHoldTask(task)) {
        const holdHours = Number(task["minHoldHours"]);

        if (holdHours > 0) {
          this.deferTask(task, holdHours);
        } else {
          this.recordTaskClaim(task["taskId"]);
        }
      }

      this.logger.warn(
        `Skipped "${task["title"]}": ${result?.["error"] || "Unknown error"}`,
      );
    }

    await this.utils.delayForSeconds(5, { signal: this.signal });
  }

  /* --------------------------------------------------------------------- */
  /* Squad                                                                 */
  /* --------------------------------------------------------------------- */

  /** Claim the squad bonus and the commission the squad has mined */
  async claimSquadRewards() {
    const friends = await this.fetchFriends();
    const teamStats = friends?.["teamStats"] || {};
    const unclaimedBonus = new Decimal(
      teamStats["unclaimedOneTimeBonusMRG"] || 0,
    );

    if (unclaimedBonus.greaterThan(0)) {
      const result = await this.claimOneTimeBonus();

      if (result?.["success"]) {
        this.logger.success(
          `Claimed ${this.formatAmount(unclaimedBonus)} MRG in squad bonuses.`,
        );
      } else {
        this.logger.warn(
          `Failed to claim the squad bonus: ${result?.["error"] || "Unknown error"}`,
        );
      }
    } else {
      this.logger.info("No squad bonus to claim.");
    }

    const unclaimedCommission = new Decimal(
      this.getAccountDetails()["unclaimedTeamCommission"] || 0,
    );

    if (unclaimedCommission.greaterThan(0)) {
      const result = await this.claimTeamCommission();

      if (result?.["success"]) {
        this.logger.success(
          `Claimed ${this.formatAmount(unclaimedCommission)} MRG in commission.`,
        );
      } else {
        this.logger.warn(
          `Failed to claim the commission: ${result?.["error"] || "Unknown error"}`,
        );
      }
    } else {
      this.logger.info("No commission to claim.");
    }
  }
}
