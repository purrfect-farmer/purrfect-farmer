import FarmerModule from "../../lib/farmer/FarmerModule.js";
import { formatAmount, logCurrentUser } from "../../lib/farmer/format.js";

/** What the account looks like, as logged before a pass */
export default class DiggoAccount extends FarmerModule {
  /** Log what the account looks like before the pass starts */
  logInfo() {
    const state = this.ctx.state.data;
    const mining = state["mining"] || {};
    const wallet = state["wallet"] || {};

    this.logger.newline();
    logCurrentUser(this.logger, this.core.telegramUser());
    this.logger.keyValue("Balance", formatAmount(state["balance"]));
    this.logger.keyValue("Holding", formatAmount(state["holding"]));
    this.logger.keyValue("Level", state["currentLevel"]);
    this.logger.keyValue("Speed", `${mining["ths"]} TH/s`, {
      valueStyle: this.logger.c.greenBright,
    });
    this.logger.keyValue("Daily Mining", formatAmount(mining["daily"]), {
      valueStyle: this.logger.c.greenBright,
    });
    this.logger.keyValue("Pending Mining", formatAmount(mining["pending"]));
    this.logger.keyValue(
      "Next Claim",
      mining["nextClaimAt"]
        ? new Date(mining["nextClaimAt"]).toLocaleString()
        : "Now",
    );
    this.logger.keyValue(
      "In-app TON",
      formatAmount(this.ctx.wallet.getInAppTon()),
    );
    this.logger.keyValue(
      "Wallet DIGGO",
      this.ctx.wallet.getWalletDiggo() === null
        ? "-"
        : formatAmount(this.ctx.wallet.getWalletDiggo()),
    );
    this.logger.keyValue(
      "Wallet",
      wallet["address"]
        ? this.ctx.wallet.getConnectedWalletAddress()
        : "Not connected",
      {
        valueStyle: wallet["address"]
          ? this.logger.c.greenBright
          : this.logger.c.yellowBright,
      },
    );
    this.logger.keyValue("Friends", this.ctx.session.getReferralsCount());
  }
}
