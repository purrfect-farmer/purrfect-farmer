import {
  AD_CHECK_ATTEMPTS,
  AD_CHECK_INTERVAL_SECONDS,
  SOCIAL_CONFIRM_MARGIN_SECONDS,
  TASK_TITLES,
} from "./constants.js";

/** Trait: mining claims, tasks, streaks, commission and chests */
export default class DiggoTasks {
  /* --------------------------------------------------------------------- */
  /* Mining                                                                */
  /* --------------------------------------------------------------------- */

  /** Claim what has been mined once the eight-hour wait is over */
  async claimPendingMining() {
    const mining = this.state_data["mining"] || {};
    const nextClaimAt = Number(mining["nextClaimAt"]) || 0;

    if (nextClaimAt > this.getServerNow()) {
      this.logger.info(
        `Next mining claim at ${new Date(nextClaimAt).toLocaleString()}.`,
      );
      return;
    }

    if (!(Number(mining["pendingUnits"]) > 0)) {
      this.logger.info("Nothing mined yet.");
      return;
    }

    const result = await this.claimMining();

    this.logger.success(
      `Claimed ${this.formatAmount(result["amount"])} DIGGO.`,
    );
  }

  /* --------------------------------------------------------------------- */
  /* Tasks                                                                 */
  /* --------------------------------------------------------------------- */

  /** A task's record as the latest state has it */
  getTask(taskId) {
    return this.state_data?.["tasks"]?.[taskId];
  }

  /** A readable name for a task */
  getTaskTitle(taskId) {
    return TASK_TITLES[taskId] || taskId;
  }

  /** Whether a task is open to work on, the way the page enables its button */
  isTaskOpen(record) {
    return (
      Boolean(record) &&
      record["enabled"] !== false &&
      !record["pending"] &&
      !record["claimed"]
    );
  }

  /** Whether a task only needs its claim */
  isTaskReady(taskId, record) {
    return taskId === "checkin" || record["progress"] >= record["total"];
  }

  /** Work every open task, claiming those whose progress is complete */
  async completeTasks() {
    const taskIds = Object.keys(this.state_data["tasks"] || {});

    for (const taskId of taskIds) {
      if (this.signal.aborted) break;
      if (!this.isTaskOpen(this.getTask(taskId))) continue;

      try {
        await this.completeTask(taskId);
      } catch (error) {
        this.logger.warn(
          `Skipped "${this.getTaskTitle(taskId)}": ${error.message}`,
        );
      }
    }
  }

  /** Complete one task the way the page's button does */
  async completeTask(taskId) {
    const record = this.getTask(taskId);

    if (this.isTaskReady(taskId, record)) {
      return this.claimReadyTask(taskId);
    }

    if (taskId === "telegram") {
      return this.completeTelegramTask(record);
    }

    if (record["verification"] === "self_reported") {
      return this.completeSocialTask(taskId, record);
    }

    if (taskId === "ad" && record["blockId"]) {
      return this.completeAdTask(record);
    }
  }

  /** Claim a task whose progress is complete */
  async claimReadyTask(taskId) {
    const result = await this.claimTask(taskId);

    if (result["amount"] > 0) {
      this.logger.success(
        `Claimed "${this.getTaskTitle(taskId)}" for ${this.formatAmount(result["amount"])} DIGGO.`,
      );
    } else {
      this.logger.info(`"${this.getTaskTitle(taskId)}" was already claimed.`);
    }
  }

  /** Join the community, have the backend check it, then claim */
  async completeTelegramTask(record) {
    if (!this.validateTelegramTask(record["url"])) return;

    await this.tryToJoinTelegramLink(record["url"]);
    await this.verifyTelegramTask();

    const updated = this.getTask("telegram");

    if (this.isTaskOpen(updated) && this.isTaskReady("telegram", updated)) {
      await this.claimReadyTask("telegram");
    }
  }

  /** Open a self-reported task, wait out its confirm time, confirm it, then claim */
  async completeSocialTask(taskId, record) {
    if (!this.validateTelegramTask(record["url"])) return;

    await this.tryToJoinTelegramLink(record["url"]);

    const { attempt } = await this.startSocialTask(taskId);
    const waitMs = Math.max(
      0,
      Number(attempt["confirmAt"]) - this.getServerNow(),
    );

    await this.utils.delayForSeconds(
      waitMs / 1000 + SOCIAL_CONFIRM_MARGIN_SECONDS,
      { signal: this.signal },
    );

    await this.confirmSocialTask(taskId, attempt["attemptId"]);
    await this.claimReadyTask(taskId);
  }

  /** Watch the rewarded ad, then wait for AdsGram's callback to mark it before claiming */
  async completeAdTask(record) {
    const start = await this.startAd();

    if (start["ready"]) {
      return this.claimReadyTask("ad");
    }

    if (!start["waiting"]) {
      try {
        await this.ctx.ads.adsgram.watch(record["blockId"]);
      } catch (error) {
        await this.cancelAd(start["attemptId"]).catch(() => null);
        throw error;
      }

      await this.completeAd(start["attemptId"]);
    }

    for (let attempt = 0; attempt < AD_CHECK_ATTEMPTS; attempt++) {
      await this.utils.delayForSeconds(AD_CHECK_INTERVAL_SECONDS, {
        signal: this.signal,
      });
      await this.loadState();

      const current = this.getTask("ad");

      if (current?.["period"] !== record["period"] || current["claimed"]) {
        return;
      }

      if (current["progress"] >= current["total"]) {
        return this.claimReadyTask("ad");
      }
    }

    this.logger.warn("The ad was not credited yet.");
  }

  /* --------------------------------------------------------------------- */
  /* Streak                                                                */
  /* --------------------------------------------------------------------- */

  /** Claim the streak day whose tasks are done */
  async claimStreak() {
    const day = (this.state_data["dayRewards"] || []).find(
      (item) =>
        item["status"] === "available" &&
        item["completedTasks"] >= item["requiredTasks"],
    );

    if (!day) {
      this.logger.info("No streak day to claim.");
      return;
    }

    const result = await this.claimStreakDay(day["day"]);

    this.logger.success(
      `Claimed streak day ${day["day"]} for ${this.formatAmount(result["amount"] ?? day["diggo"])} DIGGO.`,
    );
  }

  /* --------------------------------------------------------------------- */
  /* Squad                                                                 */
  /* --------------------------------------------------------------------- */

  /** Claim the commission the squad has mined */
  async claimCommission() {
    const commission = this.state_data["friends"]?.["commission"] || {};

    if (!(Number(commission["pendingUnits"]) > 0)) {
      this.logger.info("No commission to claim.");
      return;
    }

    const result = await this.claimReferralCommission();

    this.logger.success(
      `Claimed ${this.formatAmount(result["amount"] ?? commission["pending"])} DIGGO in commission.`,
    );
  }

  /* --------------------------------------------------------------------- */
  /* Chests                                                                */
  /* --------------------------------------------------------------------- */

  /** Open every chest the holding unlocks and whose day has come round */
  async openChests() {
    const { chests } = await this.fetchChests();
    const now = Number(chests["serverNow"]) || this.getServerNow();
    const openable = (chests["chests"] || []).filter(
      (chest) =>
        chest["unlocked"] &&
        chest["funded"] &&
        (!chest["nextOpenAt"] || chest["nextOpenAt"] <= now),
    );

    if (!openable.length) {
      this.logger.info("No chest to open.");
      return;
    }

    for (const chest of openable) {
      if (this.signal.aborted) break;

      try {
        const { opening } = await this.openChest(chest["id"]);
        const reward = opening?.["reward"] || {};
        const amount =
          reward["amount"] ??
          (reward["asset"] === "TON"
            ? Number(reward["amountUnits"]) / 1e9
            : reward["amountUnits"]);

        this.logger.success(
          `Opened the ${chest["id"]} chest: ${amount ?? "?"} ${reward["asset"] || ""} (${reward["rarity"] || "?"}).`,
        );
      } catch (error) {
        this.logger.warn(
          `Failed to open the ${chest["id"]} chest: ${error.message}`,
        );
      }
    }
  }
}
