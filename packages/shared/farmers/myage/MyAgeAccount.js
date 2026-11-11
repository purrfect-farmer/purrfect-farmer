import FarmerModule from "../../lib/farmer/FarmerModule.js";
import { formatAmount, logCurrentUser } from "../../lib/farmer/format.js";
import { AGE_POINTS, GRAM_CURRENCY } from "./constants.js";

/** What the account looks like, as logged before a pass */
export default class MyAgeAccount extends FarmerModule {
  /** Log what the account looks like before the pass starts */
  logInfo() {
    const { state, wallet } = this.ctx;
    const standing = state.part("standing");
    const league = state.part("league");
    const address = wallet.getConnectedWalletAddress();

    /* Balances */
    this.logger.newline();
    logCurrentUser(this.logger, this.core.telegramUser());
    this.logger.keyValue("Points", `${state.points()} ${AGE_POINTS}`, {
      valueStyle: this.logger.c.greenBright,
    });
    this.logger.keyValue(
      "Balance",
      `${formatAmount(state.gram())} ${GRAM_CURRENCY}`,
    );

    /* Standing */
    this.logger.keyValue("Rank", standing["rank"] ?? "Unranked");
    this.logger.keyValue("League", league["name"] ?? "None");
    this.logger.keyValue("Daily Streak", state.part("daily")["streak"] ?? 0);

    /* Wallet */
    this.logger.newline();
    this.logger.keyValue("Wallet", address || "Not connected", {
      valueStyle: address
        ? this.logger.c.greenBright
        : this.logger.c.yellowBright,
    });
  }
}
