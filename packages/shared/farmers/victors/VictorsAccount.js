import FarmerModule from "../../lib/farmer/FarmerModule.js";
import { formatAmount, logCurrentUser } from "../../lib/farmer/format.js";

/** What the account looks like, as logged before a pass */
export default class VictorsAccount extends FarmerModule {
  /** Log what the account looks like before the pass starts */
  logInfo() {
    const user = this.ctx.state.user();
    const mining = this.ctx.state.mining();
    const verify = this.ctx.state.verify();
    const level = Number(mining["level"]) || 0;

    this.logger.newline();
    logCurrentUser(this.logger, this.core.telegramUser());
    this.logger.keyValue("Balance", formatAmount(user["inAppBalance"]));
    this.logger.keyValue(
      "Holding",
      formatAmount(this.ctx.state.data["holding"]),
    );
    this.logger.keyValue(
      "Pending Mining",
      formatAmount(this.ctx.mining.getMinedAmount()),
    );
    this.logger.keyValue("Level", level);
    this.logger.keyValue(
      "Speed",
      `${this.ctx.mining.getSpeedForLevel(level)} TH/s`,
      {
        valueStyle: this.logger.c.greenBright,
      },
    );
    this.logger.keyValue(
      "Daily Mining",
      formatAmount(this.ctx.mining.getDailyOutputForLevel(level)),
      { valueStyle: this.logger.c.greenBright },
    );
    this.logger.keyValue(
      "Session Ends",
      mining["sessionEndsAt"]
        ? new Date(mining["sessionEndsAt"]).toLocaleString()
        : "No session",
    );

    this.logger.newline();
    this.logger.keyValue("Wallet", user["walletAddress"] || "Not connected", {
      valueStyle: user["walletAddress"]
        ? this.logger.c.greenBright
        : this.logger.c.yellowBright,
    });
    this.logger.keyValue("On-chain VIC", formatAmount(user["walletBalance"]));

    if (this.ctx.withdrawal.getMinimumHolding()) {
      this.logger.keyValue(
        "Min Holding",
        formatAmount(this.ctx.withdrawal.getMinimumHolding()),
        {
          valueStyle: this.ctx.withdrawal.hasMinimumHolding()
            ? this.logger.c.greenBright
            : this.logger.c.yellowBright,
        },
      );
    }

    if (user["walletAddress"]) {
      this.logger.keyValue("Owned", user["walletOwned"] ? "Yes" : "No", {
        valueStyle: user["walletOwned"]
          ? this.logger.c.greenBright
          : this.logger.c.yellowBright,
      });
    }

    this.logger.keyValue("Verified", verify["verified"] ? "Yes" : "No", {
      valueStyle: verify["verified"]
        ? this.logger.c.greenBright
        : this.logger.c.yellowBright,
    });

    if (verify["underReview"]) {
      this.logger.keyValue("Under Review", "Yes", {
        valueStyle: this.logger.c.redBright,
      });
    }

    this.logger.keyValue(
      "Referrals",
      this.ctx.state.data.referral?.["referralsCount"] || 0,
    );
  }
}
