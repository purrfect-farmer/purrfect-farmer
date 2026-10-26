import FarmerModule from "../../lib/farmer/FarmerModule.js";
import { formatAmount } from "../../lib/farmer/format.js";
import { PXE_TOKEN } from "./constants.js";

/** Claiming what the storage holds */
export default class PickaxeMining extends FarmerModule {
  /** Claim the mined PXE once the pass has opened mining */
  async claim() {
    const { state } = this.ctx;

    if (!state.isPassActive()) {
      this.logger.warn(
        `Mining is locked until the Ancient Pass is minted (${state.pass()["priceTon"]} TON).`,
      );
      return;
    }

    const unclaimed = state.unclaimed();

    if (unclaimed <= 0) {
      this.logger.info(`No ${PXE_TOKEN} mined yet.`);
      return;
    }

    const result = state.apply(await this.ctx.api.claimMining());

    this.logger.success(
      `Claimed ${formatAmount(result["claimed"])} ${PXE_TOKEN}, balance is now ${formatAmount(state.balance())}.`,
    );
  }
}
