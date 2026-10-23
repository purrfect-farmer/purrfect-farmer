import {
  CHECKIN_REWARDS,
  MINIMUM_CLAIMABLE_MINING,
  MINING_WINDOW_SECONDS,
} from "./constants.js";
import Decimal from "decimal.js";
import {
  findMinerLevelForHolding,
  getMinerDailyOutput,
  getMinerRequiredHolding,
  getMinerSpeed,
} from "../../lib/auto/minerCurve.js";

/** Trait: levels, mining claims and the daily check-in */
export default class MRGMining {
  /* --------------------------------------------------------------------- */
  /* Check-in                                                              */
  /* --------------------------------------------------------------------- */

  /** Today and yesterday as the page dates them, in UTC */
  getCheckInDays() {
    const today = new Date().toISOString().slice(0, 10);
    const yesterday = new Date(Date.now() - 86400000)
      .toISOString()
      .slice(0, 10);

    return { today, yesterday };
  }

  /** Check in once a day, which the page offers until the day is marked */
  async checkInDaily() {
    const user = this.getAccountDetails();
    const { today, yesterday } = this.getCheckInDays();

    if (user["checkinLastDay"] === today) {
      this.logger.info("Already checked in today.");
      return;
    }

    const streak =
      user["checkinLastDay"] === yesterday
        ? (Number(user["checkinStreak"]) || 0) + 1
        : 1;
    const day = ((streak - 1) % CHECKIN_REWARDS.length) + 1;
    const result = await this.dailyCheckIn();

    if (!result?.["success"]) {
      this.logger.warn(
        `Failed to check in: ${result?.["error"] || "Unknown error"}`,
      );
      return;
    }

    if (result["user"]) {
      this.account_data.user = result["user"];
    } else {
      user["checkinStreak"] = result["streak"] ?? streak;
      user["checkinLastDay"] = today;
    }

    this.logger.success(
      `Checked in for day ${day}, +${result["reward"] ?? CHECKIN_REWARDS[day - 1]} MRG.`,
    );
  }

  /* --------------------------------------------------------------------- */
  /* Levels                                                                */
  /* --------------------------------------------------------------------- */

  /** The level the drop is currently mining at */
  getActiveLevel() {
    return Number(this.account_data?.["activeLevel"]) || 0;
  }

  /** The MRG holding a level is unlocked with, priced exactly as the Miners Store does */
  getRequiredHoldingForLevel(level) {
    return new Decimal(getMinerRequiredHolding(level));
  }

  /** What the drop levels against: the in-app balance, plus the wallet once one is connected */
  getLevelHolding() {
    const user = this.getAccountDetails();
    const inAppBalance = new Decimal(user["inAppBalance"] || 0);

    return this.getConnectedWalletAddress()
      ? inAppBalance.plus(this.getWalletHolding())
      : inAppBalance;
  }

  /** The mining speed, in TH/s, a level runs at */
  getSpeedForLevel(level) {
    return getMinerSpeed(level);
  }

  /** The MRG a level mines per day */
  getDailyOutputForLevel(level) {
    return getMinerDailyOutput(level);
  }

  /** The highest level a holding covers, with a connected wallet granting level 1 for free */
  findLevelForHolding(holding, walletConnected = true) {
    return findMinerLevelForHolding(
      new Decimal(holding).toNumber(),
      walletConnected,
    );
  }

  /** Unlock the highest level the current holding covers */
  async unlockAffordableLevel() {
    if (!this.getConnectedWalletAddress()) {
      this.logger.info("Levels need a connected wallet.");
      return;
    }

    const holding = this.getLevelHolding();
    const activeLevel = this.getActiveLevel();
    const targetLevel = this.findLevelForHolding(holding);

    if (targetLevel <= activeLevel) {
      this.logger.info(
        `Level ${activeLevel} is the highest ${this.formatAmount(holding)} MRG covers.`,
      );
      return;
    }

    return this.unlockToLevel(targetLevel);
  }

  /** Unlock a level, which the backend grants against the holding */
  async unlockToLevel(level) {
    const result = await this.unlockLevel(level);

    if (!result?.["success"]) {
      const message = result?.["error"] || "Unknown error";

      this.logger.warn(`Failed to unlock level ${level}: ${message}`);
      return { status: false, message };
    }

    this.account_data["activeLevel"] = level;

    if (result["user"]) {
      this.account_data.user = result["user"];
    }

    this.logger.success(
      `Unlocked level ${level} at ${this.getSpeedForLevel(level)} TH/s.`,
    );

    return { status: true };
  }

  /* --------------------------------------------------------------------- */
  /* Mining                                                                */
  /* --------------------------------------------------------------------- */

  /** The 24h session the miner runs in, from its last snapshot, in seconds */
  getMiningWindow() {
    const timestamp =
      this.account_data?.user?.["miningSnapshot"]?.["timestamp"];
    const startedAt = timestamp
      ? Math.floor(new Date(timestamp).getTime() / 1000)
      : 0;
    const freezesAt = startedAt ? startedAt + MINING_WINDOW_SECONDS : 0;

    return {
      startedAt,
      freezesAt,
      frozen: Boolean(freezesAt) && Date.now() / 1000 >= freezesAt,
    };
  }

  /** Claim what the miner has produced since the last claim, which also starts a new window */
  async claimPendingMining() {
    const user = this.getAccountDetails();

    if (!user["tonWalletAddress"]) {
      this.logger.warn("Mining only runs while a wallet is connected.");
      return;
    }

    const pending = new Decimal(user["unclaimedMiningBalance"] || 0);

    if (pending.lessThanOrEqualTo(MINIMUM_CLAIMABLE_MINING)) {
      this.logger.info("Nothing mined yet.");
      return;
    }

    const result = await this.claimMining();

    if (!result?.["success"]) {
      this.logger.warn(
        `Failed to claim mining: ${result?.["error"] || "Unknown error"}`,
      );
      return;
    }

    this.account_data.user = result["user"];

    this.logger.success(
      `Claimed ${this.formatAmount(result["claimedAmount"])} MRG.`,
    );
  }
}
