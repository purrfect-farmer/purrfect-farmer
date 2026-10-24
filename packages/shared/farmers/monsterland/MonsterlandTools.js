import FarmerModule from "../../lib/farmer/FarmerModule.js";
import createAutoWalletTools from "../../lib/farmer/autoWalletTools.js";

/** The interactive tools the farmer offers */
export default class MonsterlandTools extends FarmerModule {
  create() {
    return [
      {
        name: "Wallet",
        list: createAutoWalletTools({
          connect: () => this.ctx.wallet.connectWalletInteractive(),
          disconnect: () => this.ctx.wallet.disconnectWalletInteractive(),
          prompts: this.ctx.connectPrompts,
        }),
      },
    ];
  }
}
