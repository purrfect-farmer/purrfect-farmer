import FarmerModule from "../../lib/farmer/FarmerModule.js";

/** The interactive tools the farmer offers */
export default class MiaoushiTools extends FarmerModule {
  create() {
    return [
      {
        name: "Entry",
        list: [
          {
            id: "show-wallet",
            icon: "wallet",
            title: "Show Wallet",
            action: () => this.ctx.identity.logInfo(),
            dispatch: false,
          },
          {
            id: "show-private-key",
            icon: "key",
            title: "Show Private Key",
            action: () => this.ctx.identity.logPrivateKey(),
            dispatch: false,
          },
          {
            id: "check-entry",
            icon: "search",
            title: "Check Entry",
            action: () => this.checkEntry(),
            dispatch: false,
          },
        ],
      },
      {
        name: "Mining",
        list: [
          {
            id: "start-mining",
            icon: "check",
            title: "Start Mining",
            action: () => this.ctx.mining.mine(),
            dispatch: false,
          },
        ],
      },
    ];
  }

  /** Read the entry again and log it */
  async checkEntry() {
    await this.ctx.status.load();
    this.ctx.status.logInfo();
  }
}
