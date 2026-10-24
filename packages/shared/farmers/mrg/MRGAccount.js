import FarmerModule from "../../lib/farmer/FarmerModule.js";
import { formatAmount, logCurrentUser } from "../../lib/farmer/format.js";

/** What the account looks like, as logged before a pass */
export default class MRGAccount extends FarmerModule {
  /** Log what the account looks like before the pass starts */
  async logInfo() {
    const user = this.ctx.state.user();
    const { mining, humanCheck, nft } = this.ctx;
    const activeLevel = mining.getActiveLevel();

    this.logger.newline();
    logCurrentUser(this.logger, this.core.telegramUser());
    this.logger.keyValue("Balance", formatAmount(user["inAppBalance"]));
    this.logger.keyValue(
      "Pending Mining",
      formatAmount(user["unclaimedMiningBalance"]),
    );
    this.logger.keyValue("Level", activeLevel);
    this.logger.keyValue(
      "Speed",
      `${mining.getSpeedForLevel(activeLevel)} TH/s`,
      { valueStyle: this.logger.c.greenBright },
    );
    this.logger.keyValue(
      "Daily Mining",
      formatAmount(mining.getDailyOutputForLevel(activeLevel)),
      { valueStyle: this.logger.c.greenBright },
    );
    this.logger.keyValue(
      "Lifetime Mined",
      formatAmount(user["totalMinedLifetime"]),
    );

    const { freezesAt } = mining.getMiningWindow();

    this.logger.keyValue(
      "Mining Window Ends",
      freezesAt ? new Date(freezesAt * 1000).toLocaleString() : "No session",
    );
    this.logger.keyValue(
      "Human Check",
      humanCheck.isValid()
        ? `Until ${new Date(humanCheck.getUntil()).toLocaleString()}`
        : "Expired",
      {
        valueStyle: humanCheck.isValid()
          ? this.logger.c.greenBright
          : this.logger.c.yellowBright,
      },
    );

    this.logger.newline();
    this.logger.keyValue(
      "Wallet",
      user["tonWalletAddress"] || "Not connected",
      {
        valueStyle: user["tonWalletAddress"]
          ? this.logger.c.greenBright
          : this.logger.c.yellowBright,
      },
    );
    this.logger.keyValue("Holding", formatAmount(user["tonWalletBalance"]));
    this.logger.keyValue(
      "Verified",
      this.isAccountVerified(user) ? "Yes" : "No",
      {
        valueStyle: this.isAccountVerified(user)
          ? this.logger.c.greenBright
          : this.logger.c.yellowBright,
      },
    );

    /** The page flags a re-check without blocking withdrawals on it */
    if (user["isVerificationRequired"]) {
      this.logger.keyValue("Re-verify Required", "Yes", {
        valueStyle: this.logger.c.yellowBright,
      });
    }
    this.logger.keyValue(
      "Check-In Streak",
      `${user["checkinStreak"] || 0} (last ${user["checkinLastDay"] || "never"})`,
    );

    const discountPercent = await nft.readNftDiscountPercent();

    if (discountPercent) {
      this.logger.keyValue(
        "Genesis NFTs",
        `${nft.countNftHoldings(await nft.readNftHoldings())} (${discountPercent}% off the fee)`,
        { valueStyle: this.logger.c.greenBright },
      );
    }

    if (this.isAccountBanned(user)) {
      this.logger.keyValue("Banned", user["banReason"] || "Yes", {
        valueStyle: this.logger.c.redBright,
      });
    }

    const pendingWithdrawals = this.ctx.withdrawal.getPendingWithdrawals();

    this.logger.keyValue("Pending Withdrawals", pendingWithdrawals.length, {
      valueStyle: pendingWithdrawals.length
        ? this.logger.c.yellowBright
        : this.logger.c.greenBright,
    });
  }

  /** Whether the drop lets the account withdraw, which the page reads from `isVerified` alone */
  isAccountVerified(user) {
    return Boolean(user["isVerified"]);
  }

  /** Whether the drop has banned the account */
  isAccountBanned(user) {
    return user["status"] === "banned" || Boolean(user["bannedAt"]);
  }
}
