import { TASK_DWELL_SECONDS } from "./constants.js";
import VictorsMining from "./VictorsMining.js";

/** Tasks and crew rewards */
export default class VictorsTasks extends VictorsMining {
  /* --------------------------------------------------------------------- */
  /* Tasks                                                                 */
  /* --------------------------------------------------------------------- */

  /** Whether the account meets a task's own threshold */
  isTaskQualified(task) {
    const user = this.getUserDetails();

    switch (task["kind"]) {
      case "wallet_connect":
        return Boolean(user["walletAddress"]);

      case "onchain_hold":
        return (
          Boolean(user["walletAddress"]) &&
          Number(user["walletBalance"] || 0) >= Number(task["minHolding"] || 0)
        );

      case "invite_friends":
        return (
          Number(this.state_data.referral?.["walletReferralsCount"] || 0) >=
          Number(task["minReferrals"] || 0)
        );

      case "nft_hold":
        return (
          Boolean(user["walletAddress"]) &&
          this.ownedNftCount >= Number(task["minNfts"] || 1)
        );

      case "reach_level":
        return (
          Number(this.getMining()["level"] || 0) >=
          Number(task["minLevel"] || 0)
        );

      default:
        return true;
    }
  }

  /** Claim every open task the account qualifies for */
  async completeTasks() {
    const board = await this.fetchTasks();

    /** The NFT count is only read when an NFT task is open */
    if (
      board.some(
        (task) => task["kind"] === "nft_hold" && task["status"] === "open",
      )
    ) {
      const nft = await this.fetchNft().catch(() => ({}));
      this.ownedNftCount = (nft["owned"] || []).length;
    }

    const tasks = board.filter(
      (task) => task["status"] === "open" && this.isTaskQualified(task),
    );

    if (!tasks.length) {
      this.logger.info("No tasks to claim.");
      return;
    }

    for (const task of tasks) {
      if (this.signal.aborted) break;

      await this.completeTask(task);
    }
  }

  /** Complete one task the way the page does: open it, dwell, then claim */
  async completeTask(task) {
    const isVisitTask =
      task["kind"] === "link_visit" || task["kind"] === "telegram_channel";

    await this.openTaskLink(task["url"], isVisitTask ? TASK_DWELL_SECONDS : 0);

    const result = await this.claimTask(task["taskId"]);

    if (result?.["success"] === false) {
      this.logger.warn(`Skipped "${task["title"].trim()}":`, result["error"]);
    } else {
      this.applyResult(result);
      this.logger.success(
        `Claimed "${task["title"].trim()}" for ${task["reward"]} VIC.`,
      );
    }

    await this.utils.delayForSeconds(3, { signal: this.signal });
  }

  /* --------------------------------------------------------------------- */
  /* Squad                                                                 */
  /* --------------------------------------------------------------------- */

  /** Claim the hiring bonus and crew commission */
  async claimSquadRewards() {
    const referral = this.state_data.referral || {};
    const claims = [
      ["hiring bonus", referral["unclaimedBonus"], this.claimReferralBonus],
      [
        "commission",
        referral["unclaimedCommission"],
        this.claimReferralCommission,
      ],
    ];

    for (const [label, amount, claim] of claims) {
      if (!(Number(amount) > 0)) {
        this.logger.info(`No ${label} to claim.`);
        continue;
      }

      const result = await claim.call(this);

      if (result?.["success"] === false) {
        this.logger.warn(`Failed to claim the ${label}:`, result["error"]);
      } else {
        this.applyResult(result);
        this.logger.success(
          `Claimed ${this.formatAmount(result["claimed"] ?? amount)} VIC ${label}.`,
        );
      }

      await this.utils.delayForSeconds(2, { signal: this.signal });
    }
  }
}
