import FarmerModule from "../../lib/farmer/FarmerModule.js";
import { formatAmount } from "../../lib/farmer/format.js";
import { ERROR_CODE, LOOT_TOKEN, MINIMUM_COLLECT } from "./constants.js";
import { fromNano } from "./loot.js";

/** Collecting what the holding has mined */
export default class LootVaultMining extends FarmerModule {
  /** Collect the mined LOOT once 1 has accrued: audit, captcha, then collect, as the page does */
  async collect() {
    const pending = this.ctx.state.pendingMined();

    if (pending < MINIMUM_COLLECT) {
      this.logger.info(
        `Only ${formatAmount(fromNano(pending))} ${LOOT_TOKEN} mined, waiting.`,
      );
      return;
    }

    try {
      const preview = await this.ctx.api.previewMining();

      this.logger.keyValue(
        "To Collect",
        `${preview["totalMinedLoot"]} ${LOOT_TOKEN}`,
      );

      if (preview["holdChanged"]) {
        this.logger.info("The holding changed during the period.");
      }

      const captchaToken = await this.ctx.captcha.obtainToken();
      const result = await this.ctx.api.collectMining(captchaToken);

      this.logger.success(
        `Collected, balance is now ${formatAmount(fromNano(result["newBalance"]))} ${LOOT_TOKEN}.`,
      );
    } catch (error) {
      if (error.code !== ERROR_CODE.HISTORY_UNAVAILABLE) throw error;

      this.logger.warn("The on-chain history is unavailable, collect later.");
      return;
    }

    await this.ctx.state.loadDashboard();
  }
}
