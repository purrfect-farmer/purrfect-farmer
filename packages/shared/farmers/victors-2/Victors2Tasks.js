import FarmerModule from "../../lib/farmer/FarmerModule.js";
import { formatAmount } from "../../lib/farmer/format.js";
import {
  MANUAL_TASK_KINDS,
  PROFILE_PROPAGATION_SECONDS,
  PROFILE_TASK_KIND,
  TASK_DWELL_SECONDS,
  TOKEN_SYMBOL,
  VISIT_TASK_KINDS,
} from "./constants.js";

/** Tasks and crew rewards */
export default class Victors2Tasks extends FarmerModule {
  /** How many of the drop's NFTs the account owns, read when an NFT task is open */
  ownedNftCount = 0;

  /** Whether the account meets a task's own threshold */
  isTaskQualified(task) {
    const user = this.ctx.state.user();

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
          Number(this.ctx.state.data.referral?.["walletReferralsCount"] || 0) >=
          Number(task["minReferrals"] || 0)
        );

      case "nft_hold":
        return (
          Boolean(user["walletAddress"]) &&
          this.ownedNftCount >= Number(task["minNfts"] || 1)
        );

      case "reach_level":
        return (
          Number(this.ctx.state.mining()["level"] || 0) >=
          Number(task["minLevel"] || 0)
        );

      default:
        return !MANUAL_TASK_KINDS.includes(task["kind"]);
    }
  }

  /** Whether the Telegram name already carries a tag */
  hasNameTag(tag) {
    return this.core.userFullName().toLowerCase().includes(tag.toLowerCase());
  }

  /** Put what a profile task checks for into the Telegram profile, when settings allow it, returning whether it was changed */
  async prepareProfile(task) {
    const update =
      task["kind"] === PROFILE_TASK_KIND.NAME_TAG
        ? this.getNameTagUpdate(task["nameTag"])
        : this.getBioLinkUpdate();

    if (!update) return false;

    this.logger.info(`Updating the Telegram profile for "${task["title"]}"...`);

    if (!(await this.core.telegram.tryToUpdateProfile(update))) return false;

    await this.utils.delayForSeconds(PROFILE_PROPAGATION_SECONDS, {
      signal: this.signal,
    });

    /** The name travels in initData, so the app is reopened for one that has it */
    await this.core.telegram.refreshWebApp();

    return true;
  }

  /** The last name with the tag added, or nothing when the name already carries it */
  getNameTagUpdate(tag) {
    if (!tag || this.hasNameTag(tag)) return null;

    return { lastName: `${this.core.userLastName()} ${tag}`.trim() };
  }

  /** The referral link as the bio, or nothing when the account has no link yet */
  getBioLinkUpdate() {
    const link = this.ctx.state.data.referral?.["link"];

    return link ? { about: link } : null;
  }

  /** Claim every open task the account qualifies for */
  async completeTasks() {
    const board = await this.ctx.api.fetchTasks();

    /** The NFT count is only read when an NFT task is open */
    if (
      board.some(
        (task) => task["kind"] === "nft_hold" && task["status"] === "open",
      )
    ) {
      const nft = await this.ctx.api.fetchNft().catch(() => ({}));
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
    const isPartnerVisit =
      task["kind"] === "partner_api" && Boolean(task["url"]);
    const isVisitTask =
      VISIT_TASK_KINDS.includes(task["kind"]) || isPartnerVisit;

    if (Object.values(PROFILE_TASK_KIND).includes(task["kind"])) {
      const changed = await this.prepareProfile(task);
      const isNameTask = task["kind"] === PROFILE_TASK_KIND.NAME_TAG;

      /** A name without the tag is known to fail, a bio cannot be read so its claim is always tried */
      if (isNameTask && !changed && !this.hasNameTag(task["nameTag"] || "")) {
        this.logger.warn(`"${task["title"].trim()}" needs a profile update.`);
        return;
      }
    }

    await this.core.telegram.openTaskLink(
      task["url"],
      isVisitTask ? TASK_DWELL_SECONDS : 0,
    );

    const result = await this.ctx.api.claimTask(task["taskId"]);

    if (result?.["success"] === false) {
      this.logger.warn(`Skipped "${task["title"].trim()}":`, result["error"]);
    } else {
      this.ctx.state.apply(result);
      this.logger.success(
        `Claimed "${task["title"].trim()}" for ${result["reward"] ?? task["reward"]} ${TOKEN_SYMBOL}.`,
      );
    }

    await this.utils.delayForSeconds(3, { signal: this.signal });
  }

  /** Claim the hiring bonus and crew commission */
  async claimSquadRewards() {
    if (!this.ctx.state.isPassActive()) {
      this.logger.info("Crew rewards need the Mine Pass.");
      return;
    }

    const referral = this.ctx.state.data.referral || {};
    const claims = [
      [
        "hiring bonus",
        referral["unclaimedBonus"],
        () => this.ctx.api.claimReferralBonus(),
      ],
      [
        "commission",
        referral["unclaimedCommission"],
        () => this.ctx.api.claimReferralCommission(),
      ],
    ];

    for (const [label, amount, claim] of claims) {
      if (!(Number(amount) > 0)) {
        this.logger.info(`No ${label} to claim.`);
        continue;
      }

      const result = await claim();

      if (result?.["success"] === false) {
        this.logger.warn(`Failed to claim the ${label}:`, result["error"]);
      } else {
        this.ctx.state.apply(result);
        this.logger.success(
          `Claimed ${formatAmount(result["claimed"] ?? amount)} ${TOKEN_SYMBOL} ${label}.`,
        );
      }

      await this.utils.delayForSeconds(2, { signal: this.signal });
    }
  }
}
