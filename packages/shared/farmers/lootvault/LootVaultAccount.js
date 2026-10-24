import FarmerModule from "../../lib/farmer/FarmerModule.js";
import { formatAmount, logCurrentUser } from "../../lib/farmer/format.js";
import { LOOT_TOKEN } from "./constants.js";
import { fromNano } from "./loot.js";

/** What the account looks like, as logged before a pass */
export default class LootVaultAccount extends FarmerModule {
  /** Log what the account looks like before the pass starts */
  logInfo() {
    const { state, wallet } = this.ctx;
    const dashboard = state.dashboard || {};
    const address = wallet.getConnectedWalletAddress();

    this.logger.newline();
    logCurrentUser(this.logger, this.core.telegramUser());
    this.logger.keyValue("Balance", formatAmount(state.balance()));
    this.logger.keyValue(
      "Pending Mining",
      formatAmount(fromNano(state.pendingMined())),
    );
    this.logger.keyValue(
      "Level",
      `${state.level()} / ${dashboard["maxLvl"] ?? "?"}`,
    );
    this.logger.keyValue("League", dashboard["league"]?.["badge"] || "?");
    this.logger.keyValue("Speed", `${dashboard["spd"]} ${LOOT_TOKEN}/h`, {
      valueStyle: this.logger.c.greenBright,
    });
    this.logger.keyValue(
      "Daily Mining",
      `${dashboard["daily"]} ${LOOT_TOKEN}`,
      {
        valueStyle: this.logger.c.greenBright,
      },
    );
    this.logger.keyValue(
      "Next Level",
      `+${dashboard["rem"] ?? "?"} ${LOOT_TOKEN} held`,
    );

    this.logger.newline();
    this.logger.keyValue("Wallet", address || "Not connected", {
      valueStyle: address
        ? this.logger.c.greenBright
        : this.logger.c.yellowBright,
    });
    this.logger.keyValue(
      `On-chain ${LOOT_TOKEN}`,
      formatAmount(state.holding()),
    );
  }
}
