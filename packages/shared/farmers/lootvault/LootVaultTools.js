import FarmerModule from "../../lib/farmer/FarmerModule.js";
import createAutoWalletTools from "../../lib/farmer/autoWalletTools.js";
import { promptWalletVersion } from "../../lib/farmer/prompts.js";
import { keyPairFromPhraseOrSecretKey } from "../../lib/ton/wallet.js";

/** The interactive tools the farmer offers */
export default class LootVaultTools extends FarmerModule {
  create() {
    return [
      {
        name: "Wallet",
        list: [
          ...createAutoWalletTools({
            connect: () => this.connectWalletInteractive(),
            disconnect: () => this.disconnectWalletInteractive(),
            prompts: this.ctx.connectPrompts,
          }),
          {
            id: "refresh-holding",
            icon: "search",
            title: "Refresh Holding",
            action: () =>
              this.whenPlayable(() => this.ctx.wallet.refreshHolding()),
            dispatch: false,
          },
        ],
      },
      {
        name: "Mining",
        list: [
          {
            id: "collect-mining",
            icon: "check",
            title: "Collect Mining",
            action: () => this.whenPlayable(() => this.ctx.mining.collect()),
            dispatch: false,
          },
          {
            id: "claim-streak",
            icon: "check",
            title: "Claim Streak",
            action: () => this.whenPlayable(() => this.ctx.tasks.claimStreak()),
            dispatch: false,
          },
          {
            id: "complete-tasks",
            icon: "check",
            title: "Complete Tasks",
            action: () =>
              this.whenPlayable(() => this.ctx.tasks.completeTasks()),
            dispatch: false,
          },
          {
            id: "claim-friends-reward",
            icon: "user",
            title: "Claim Friends Reward",
            action: () =>
              this.whenPlayable(() => this.ctx.tasks.claimFriendsReward()),
            dispatch: false,
          },
        ],
      },
      {
        name: "Tower",
        list: [
          {
            id: "collect-tower",
            icon: "check",
            title: "Collect Tower",
            action: () => this.whenPlayable(() => this.ctx.tower.collect()),
            dispatch: false,
          },
          {
            id: "equip-parts",
            icon: "key",
            title: "Equip Parts",
            action: () => this.whenPlayable(() => this.ctx.tower.equipParts()),
            dispatch: false,
          },
        ],
      },
      {
        name: "Withdrawal",
        list: [
          {
            id: "withdrawal-status",
            icon: "history",
            title: "Withdrawal Status",
            action: () => this.ctx.withdrawal.logStatus(),
            dispatch: false,
          },
          {
            id: "withdraw",
            icon: "withdraw",
            title: "Withdraw",
            action: () => this.ctx.flow.withdrawInteractive(),
            dispatch: false,
          },
        ],
      },
    ];
  }

  /** Run a tool once the account is known to be playable, explaining why not otherwise */
  async whenPlayable(action) {
    await this.ctx.state.ensureLoaded();

    const reason = this.ctx.state.unplayableReason();

    if (reason) {
      this.logger.warn(reason);
      return;
    }

    return action();
  }

  /** Register on or bind a wallet, from its phrase, secret key or address */
  async connectWalletInteractive() {
    const input = await this.core.prompt(
      "Enter your TON Wallet Phrase / Secret Key (hex), or an address:",
    );
    const value = (input || "").trim();

    if (!value) {
      this.logger.warn("Nothing provided.");
      return;
    }

    if (this.utils.isTonAddress(value)) {
      await this.ctx.wallet.connectWalletAddress(value);
      return;
    }

    const version = await promptWalletVersion(this.core);

    if (!version) {
      this.logger.warn("No wallet version selected.");
      return;
    }

    const keyPair = await keyPairFromPhraseOrSecretKey(value);
    const { status } = await this.ctx.wallet.connectSignedWallet(
      keyPair,
      version,
    );

    if (status) {
      await this.ctx.walletVersion.remember(version);
    }
  }

  /** Unbind the wallet the account is on */
  async disconnectWalletInteractive() {
    await this.whenPlayable(async () => {
      await this.ctx.wallet.disconnectWallet();
      await this.ctx.walletVersion.remember(undefined);
      this.logger.success("Wallet disconnected.");
    });
  }
}
