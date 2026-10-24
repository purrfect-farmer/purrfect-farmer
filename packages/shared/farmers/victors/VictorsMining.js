import {
  findMinerLevelForHolding,
  getMinerDailyOutput,
  getMinerRequiredHolding,
  getMinerSpeed,
} from "../../lib/auto/minerCurve.js";
import FarmerModule from "../../lib/farmer/FarmerModule.js";
import { formatAmount } from "../../lib/farmer/format.js";
import {
  MINIMUM_CLAIMABLE_MINING,
  MINING_CLAIM_ATTEMPTS,
  MINING_CLAIM_RETRY_SECONDS,
} from "./constants.js";
import Decimal from "decimal.js";

/** Levels, mining claims, the tutorial and the daily check-in */
export default class VictorsMining extends FarmerModule {
  /** Dismiss the tutorial the way the page does on first launch */
  async completeTutorialIfNeeded() {
    if (this.ctx.state.user()["tutorialDone"]) return;

    const result = await this.ctx.api.completeTutorial();

    if (result?.["success"] === false) {
      this.logger.warn("Failed to complete the tutorial:", result["error"]);
      return;
    }

    this.ctx.state.apply(result);
    this.logger.success("Tutorial completed.");
  }

  /** Claim today's check-in */
  async claimCheckIn() {
    if (this.ctx.state.data.checkIn?.["claimedToday"]) {
      this.logger.info("Already checked in today.");
      return;
    }

    const result = await this.ctx.api.checkIn();

    if (result?.["success"] === false) {
      this.logger.warn("Failed to check in:", result["error"]);
      return;
    }

    this.ctx.state.apply(result);
    this.logger.success(
      `Checked in for day ${result["streak"]}, +${result["reward"]} VIC.`,
    );
  }

  /** The VIC holding a level is hired with, priced exactly as the page does */
  getRequiredHoldingForLevel(level) {
    return getMinerRequiredHolding(level);
  }

  /** The mining speed, in TH/s, a level runs at */
  getSpeedForLevel(level) {
    return getMinerSpeed(level);
  }

  /** The VIC a level mines per day */
  getDailyOutputForLevel(level) {
    return getMinerDailyOutput(level);
  }

  /** The highest level a holding covers, with a connected wallet granting level 1 for free */
  findLevelForHolding(holding, walletConnected = true) {
    return findMinerLevelForHolding(holding, walletConnected);
  }

  /** Hire the highest level the combined holding covers */
  async unlockAffordableLevel() {
    if (!this.ctx.wallet.getConnectedWalletAddress()) {
      this.logger.info("Levels need a connected wallet.");
      return;
    }

    const holding = Number(this.ctx.state.data["holding"]) || 0;
    const activeLevel = Number(this.ctx.state.mining()["level"]) || 0;
    const targetLevel = this.findLevelForHolding(holding);

    if (targetLevel <= activeLevel) {
      this.logger.info(
        `Level ${activeLevel} is the highest ${formatAmount(holding)} VIC covers.`,
      );
      return;
    }

    return this.unlockToLevel(targetLevel);
  }

  /** Hire a level */
  async unlockToLevel(level) {
    const result = await this.ctx.api.unlockLevel(level);

    if (result?.["success"] === false) {
      this.logger.warn(`Failed to unlock level ${level}:`, result["error"]);
      return { status: false, message: result["error"] };
    }

    this.ctx.state.apply(result);
    this.logger.success(
      `Unlocked level ${level} at ${this.getSpeedForLevel(level)} TH/s.`,
    );

    return { status: true };
  }

  /** What the session has mined by now, projected from the last state read the way the page does */
  getMinedAmount() {
    const mining = this.ctx.state.mining();
    const accrued = new Decimal(mining["accrued"] || 0);

    if (!this.ctx.state.data?.["serverTime"] || !mining["sessionEndsAt"]) {
      return accrued;
    }

    const serverTime = new Date(this.ctx.state.data["serverTime"]).getTime();
    const endsAt = new Date(mining["sessionEndsAt"]).getTime();
    const elapsed = Math.max(
      0,
      Math.min(Date.now() - this.ctx.state.readAt, endsAt - serverTime),
    );
    const daily = mining["accrualDaily"] ?? mining["dailyOutput"] ?? 0;

    return accrued.plus(new Decimal(daily).mul(elapsed).div(86400 * 1000));
  }

  /** Claim mining, waiting out server errors such as the holding check being down, then returning the last refusal */
  async claimMiningWithRetry() {
    for (let attempt = 1; ; attempt++) {
      const isLastAttempt =
        attempt >= MINING_CLAIM_ATTEMPTS || this.signal.aborted;
      let reason;

      try {
        const result = await this.ctx.api.claimMining();

        if (!result?.["serverError"] || isLastAttempt) {
          return result;
        }

        reason = result["error"];
      } catch (error) {
        if (isLastAttempt) {
          throw error;
        }

        reason = error.message;
      }

      this.logger.warn(
        `Mining claim failed, retrying in ${MINING_CLAIM_RETRY_SECONDS}s:`,
        reason,
      );
      await this.utils.delayForSeconds(MINING_CLAIM_RETRY_SECONDS, {
        signal: this.signal,
      });
    }
  }

  /** Claim what the miner has produced, which also starts a new session */
  async claimPendingMining() {
    if (!(Number(this.ctx.state.mining()["level"]) > 0)) {
      this.logger.warn("Mining only runs once a wallet is connected.");
      return;
    }

    const pending = this.getMinedAmount();

    if (pending.lessThan(MINIMUM_CLAIMABLE_MINING)) {
      this.logger.info(
        `Only ${formatAmount(pending)} VIC mined, waiting for ${MINIMUM_CLAIMABLE_MINING}.`,
      );
      return;
    }

    const result = await this.claimMiningWithRetry();

    if (result?.["success"] === false) {
      this.logger.warn("Failed to claim mining:", result["error"]);
      return;
    }

    this.ctx.state.apply(result);
    this.logger.success(
      `Claimed ${formatAmount(result["claimed"] ?? pending)} VIC.`,
    );
  }
}
