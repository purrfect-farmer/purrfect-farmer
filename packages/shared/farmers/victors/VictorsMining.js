import {
  findMinerLevelForHolding,
  getMinerDailyOutput,
  getMinerRequiredHolding,
  getMinerSpeed,
} from "../../lib/auto/minerCurve.js";
import Decimal from "decimal.js";
import {
  MINIMUM_CLAIMABLE_MINING,
  MINING_CLAIM_ATTEMPTS,
  MINING_CLAIM_RETRY_SECONDS,
} from "./constants.js";

/** Trait: levels, mining claims, the tutorial and the daily check-in */
export default class VictorsMining {
  /** Dismiss the tutorial the way the page does on first launch */
  async completeTutorialIfNeeded() {
    if (this.getUserDetails()["tutorialDone"]) return;

    const result = await this.completeTutorial();

    if (result?.["success"] === false) {
      this.logger.warn("Failed to complete the tutorial:", result["error"]);
      return;
    }

    this.applyResult(result);
    this.logger.success("Tutorial completed.");
  }

  /** Claim today's check-in */
  async claimCheckIn() {
    if (this.state_data.checkIn?.["claimedToday"]) {
      this.logger.info("Already checked in today.");
      return;
    }

    const result = await this.checkIn();

    if (result?.["success"] === false) {
      this.logger.warn("Failed to check in:", result["error"]);
      return;
    }

    this.applyResult(result);
    this.logger.success(
      `Checked in for day ${result["streak"]}, +${result["reward"]} VIC.`,
    );
  }

  /* --------------------------------------------------------------------- */
  /* Levels                                                                */
  /* --------------------------------------------------------------------- */

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
    if (!this.getConnectedWalletAddress()) {
      this.logger.info("Levels need a connected wallet.");
      return;
    }

    const holding = Number(this.state_data["holding"]) || 0;
    const activeLevel = Number(this.getMining()["level"]) || 0;
    const targetLevel = this.findLevelForHolding(holding);

    if (targetLevel <= activeLevel) {
      this.logger.info(
        `Level ${activeLevel} is the highest ${this.formatAmount(holding)} VIC covers.`,
      );
      return;
    }

    return this.unlockToLevel(targetLevel);
  }

  /** Hire a level */
  async unlockToLevel(level) {
    const result = await this.unlockLevel(level);

    if (result?.["success"] === false) {
      this.logger.warn(`Failed to unlock level ${level}:`, result["error"]);
      return { status: false, message: result["error"] };
    }

    this.applyResult(result);
    this.logger.success(
      `Unlocked level ${level} at ${this.getSpeedForLevel(level)} TH/s.`,
    );

    return { status: true };
  }

  /* --------------------------------------------------------------------- */
  /* Mining                                                                */
  /* --------------------------------------------------------------------- */

  /** What the session has mined by now, projected from the last state read the way the page does */
  getMinedAmount() {
    const mining = this.getMining();
    const accrued = new Decimal(mining["accrued"] || 0);

    if (!this.state_data?.["serverTime"] || !mining["sessionEndsAt"]) {
      return accrued;
    }

    const serverTime = new Date(this.state_data["serverTime"]).getTime();
    const endsAt = new Date(mining["sessionEndsAt"]).getTime();
    const elapsed = Math.max(
      0,
      Math.min(Date.now() - this.stateReadAt, endsAt - serverTime),
    );
    const daily = mining["accrualDaily"] ?? mining["dailyOutput"] ?? 0;

    return accrued.plus(new Decimal(daily).mul(elapsed).div(86400 * 1000));
  }

  /** Claim mining, waiting out server errors such as the holding check being down */
  async claimMiningWithRetry() {
    for (let attempt = 1; ; attempt++) {
      try {
        return await this.claimMining();
      } catch (error) {
        if (attempt >= MINING_CLAIM_ATTEMPTS || this.signal.aborted) {
          throw error;
        }

        this.logger.warn(
          `Mining claim failed, retrying in ${MINING_CLAIM_RETRY_SECONDS}s:`,
          error.message,
        );
        await this.utils.delayForSeconds(MINING_CLAIM_RETRY_SECONDS, {
          signal: this.signal,
        });
      }
    }
  }

  /** Claim what the miner has produced, which also starts a new session */
  async claimPendingMining() {
    if (!(Number(this.getMining()["level"]) > 0)) {
      this.logger.warn("Mining only runs once a wallet is connected.");
      return;
    }

    const pending = this.getMinedAmount();

    if (pending.lessThan(MINIMUM_CLAIMABLE_MINING)) {
      this.logger.info(
        `Only ${this.formatAmount(pending)} VIC mined, waiting for ${MINIMUM_CLAIMABLE_MINING}.`,
      );
      return;
    }

    const result = await this.claimMiningWithRetry();

    if (result?.["success"] === false) {
      this.logger.warn("Failed to claim mining:", result["error"]);
      return;
    }

    this.applyResult(result);
    this.logger.success(
      `Claimed ${this.formatAmount(result["claimed"] ?? pending)} VIC.`,
    );
  }
}
