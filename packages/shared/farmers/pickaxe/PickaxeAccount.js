import FarmerModule from "../../lib/farmer/FarmerModule.js";
import { formatAmount, logCurrentUser } from "../../lib/farmer/format.js";
import { PXE_TOKEN } from "./constants.js";

/** What the account looks like, as logged before a pass */
export default class PickaxeAccount extends FarmerModule {
  /** Log what the account looks like before the pass starts */
  logInfo() {
    const { state, wallet, pass } = this.ctx;
    const data = state.data;
    const address = wallet.getConnectedWalletAddress();

    this.logger.newline();
    logCurrentUser(this.logger, this.core.telegramUser());
    this.logger.keyValue("Balance", formatAmount(state.balance()));
    this.logger.keyValue("Holding", formatAmount(data["combined"]));
    this.logger.keyValue("Level", state.level());
    this.logger.keyValue("Daily Mining", `${data["perDay"]} ${PXE_TOKEN}`, {
      valueStyle: this.logger.c.greenBright,
    });
    this.logger.keyValue(
      "Storage",
      `${formatAmount(state.unclaimed())} / ${formatAmount(data["storageCap"])} ${PXE_TOKEN}`,
    );
    this.logger.keyValue("Next Level", `${data["nextHold"]} ${PXE_TOKEN} held`);
    this.logger.keyValue("Streak", data["checkin"]?.["streak"] ?? 0);
    this.logger.keyValue("Ancient Pass", pass.describe(), {
      valueStyle: state.isPassActive()
        ? this.logger.c.greenBright
        : this.logger.c.yellowBright,
    });

    this.logger.newline();
    this.logger.keyValue("Wallet", address || "Not connected", {
      valueStyle: address
        ? this.logger.c.greenBright
        : this.logger.c.yellowBright,
    });
    this.logger.keyValue(
      `On-chain ${PXE_TOKEN}`,
      formatAmount(state.holding()),
    );
  }
}
