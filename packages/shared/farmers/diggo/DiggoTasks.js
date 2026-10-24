import FarmerModule from "../../lib/farmer/FarmerModule.js";
import { formatAmount } from "../../lib/farmer/format.js";
import {
  AD_CHECK_ATTEMPTS,
  AD_CHECK_INTERVAL_SECONDS,
  SOCIAL_CONFIRM_MARGIN_SECONDS,
  TASK_TITLES,
} from "./constants.js";

/** Mining claims, tasks, the streak, commission and chests */
export default class DiggoTasks extends FarmerModule {
  /** Claim what has been mined once the eight-hour wait is over */
  async claimPendingMining() {
    const mining = this.ctx.state.data["mining"] || {};
    const nextClaimAt = Number(mining["nextClaimAt"]) || 0;

    if (nextClaimAt > this.ctx.state.getServerNow()) {
      this.logger.info(
        `Next mining claim at ${new Date(nextClaimAt).toLocaleString()}.`,
      );
      return;
    }

    if (!(Number(mining["pendingUnits"]) > 0)) {
      this.logger.info("Nothing mined yet.");
      return;
    }

    const result = await this.ctx.api.claimMining();

    this.logger.success(`Claimed ${formatAmount(result["amount"])} DIGGO.`);
  }

  /** A task's record as the latest state has it */
  getTask(taskId) {
    return this.ctx.state.data?.["tasks"]?.[taskId];
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
    const taskIds = Object.keys(this.ctx.state.data["tasks"] || {});

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
    const result = await this.ctx.api.claimTask(taskId);

    if (result["amount"] > 0) {
      this.logger.success(
        `Claimed "${this.getTaskTitle(taskId)}" for ${formatAmount(result["amount"])} DIGGO.`,
      );
    } else {
      this.logger.info(`"${this.getTaskTitle(taskId)}" was already claimed.`);
    }
  }

  /** Join the community, have the backend check it, then claim */
  async completeTelegramTask(record) {
    if (!this.core.telegram.validateTask(record["url"])) return;

    await this.core.telegram.tryToJoin(record["url"]);
    await this.ctx.api.verifyTelegramTask();

    const updated = this.getTask("telegram");

    if (this.isTaskOpen(updated) && this.isTaskReady("telegram", updated)) {
      await this.claimReadyTask("telegram");
    }
  }

  /** Open a self-reported task, wait out its confirm time, confirm it, then claim */
  async completeSocialTask(taskId, record) {
    if (!this.core.telegram.validateTask(record["url"])) return;

    await this.core.telegram.tryToJoin(record["url"]);

    const { attempt } = await this.ctx.api.startSocialTask(taskId);
    const waitMs = Math.max(
      0,
      Number(attempt["confirmAt"]) - this.ctx.state.getServerNow(),
    );

    await this.utils.delayForSeconds(
      waitMs / 1000 + SOCIAL_CONFIRM_MARGIN_SECONDS,
      { signal: this.signal },
    );

    await this.ctx.api.confirmSocialTask(taskId, attempt["attemptId"]);
    await this.claimReadyTask(taskId);
  }

  /** Watch the rewarded ad, then wait for AdsGram's callback to mark it before claiming */
  async completeAdTask(record) {
    const start = await this.ctx.api.startAd();

    if (start["ready"]) {
      return this.claimReadyTask("ad");
    }

    if (!start["waiting"]) {
      try {
        await this.ctx.ads.adsgram.watch(record["blockId"]);
      } catch (error) {
        await this.ctx.api.cancelAd(start["attemptId"]).catch(() => null);
        throw error;
      }

      await this.ctx.api.completeAd(start["attemptId"]);
    }

    for (let attempt = 0; attempt < AD_CHECK_ATTEMPTS; attempt++) {
      await this.utils.delayForSeconds(AD_CHECK_INTERVAL_SECONDS, {
        signal: this.signal,
      });
      await this.ctx.state.load();

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

  /** Claim the streak day whose tasks are done */
  async claimStreak() {
    const day = (this.ctx.state.data["dayRewards"] || []).find(
      (item) =>
        item["status"] === "available" &&
        item["completedTasks"] >= item["requiredTasks"],
    );

    if (!day) {
      this.logger.info("No streak day to claim.");
      return;
    }

    const result = await this.ctx.api.claimStreakDay(day["day"]);

    this.logger.success(
      `Claimed streak day ${day["day"]} for ${formatAmount(result["amount"] ?? day["diggo"])} DIGGO.`,
    );
  }

  /** Claim the commission the squad has mined */
  async claimCommission() {
    const commission = this.ctx.state.data["friends"]?.["commission"] || {};

    if (!(Number(commission["pendingUnits"]) > 0)) {
      this.logger.info("No commission to claim.");
      return;
    }

    const result = await this.ctx.api.claimReferralCommission();

    this.logger.success(
      `Claimed ${formatAmount(result["amount"] ?? commission["pending"])} DIGGO in commission.`,
    );
  }

  /** Open every chest the holding unlocks and whose day has come round */
  async openChests() {
    const { chests } = await this.ctx.api.fetchChests();
    const now = Number(chests["serverNow"]) || this.ctx.state.getServerNow();
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
        const { opening } = await this.ctx.api.openChest(chest["id"]);
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
