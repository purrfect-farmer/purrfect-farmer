import FarmerModule from "../../lib/farmer/FarmerModule.js";
import createAutoWalletTools from "../../lib/farmer/autoWalletTools.js";
import { promptWalletVersion } from "../../lib/farmer/prompts.js";
import { keyPairFromPhraseOrSecretKey } from "../../lib/ton/wallet.js";

/** The interactive tools the farmer offers */
export default class PickaxeTools extends FarmerModule {
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
        name: "Ancient Pass",
        list: [
          {
            id: "pass-status",
            icon: "search",
            title: "Pass Status",
            action: () => this.whenPlayable(() => this.ctx.pass.logStatus()),
            dispatch: false,
          },
          {
            id: "mint-pass",
            icon: "key",
            title: "Mint Pass",
            action: () =>
              this.whenPlayable(() => this.ctx.pass.mintInteractive()),
            dispatch: false,
          },
        ],
      },
      {
        name: "Mining",
        list: [
          {
            id: "claim-mining",
            icon: "check",
            title: "Claim Mining",
            action: () => this.whenPlayable(() => this.ctx.mining.claim()),
            dispatch: false,
          },
          {
            id: "check-in",
            icon: "check",
            title: "Check In",
            action: () => this.whenPlayable(() => this.ctx.tasks.checkIn()),
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
        name: "Withdrawal",
        list: [
          {
            id: "withdrawal-status",
            icon: "history",
            title: "Withdrawal Status",
            action: () =>
              this.whenPlayable(() => this.ctx.withdrawal.logStatus()),
            dispatch: false,
          },
          {
            id: "withdraw",
            icon: "withdraw",
            title: "Withdraw",
            action: () =>
              this.whenPlayable(() => this.ctx.flow.withdrawInteractive()),
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

  /** Link a wallet from its phrase or secret key, which signs the TON proof */
  async connectWalletInteractive() {
    const input = await this.core.prompt(
      "Enter your TON Wallet Phrase / Secret Key (hex):",
    );
    const value = (input || "").trim();

    if (!value) {
      this.logger.warn("Nothing provided.");
      return;
    }

    const version = await promptWalletVersion(this.core);

    if (!version) {
      this.logger.warn("No wallet version selected.");
      return;
    }

    await this.whenPlayable(async () => {
      const keyPair = await keyPairFromPhraseOrSecretKey(value);
      const { status } = await this.ctx.wallet.connectSignedWallet(
        keyPair,
        version,
      );

      if (status) {
        await this.ctx.walletVersion.remember(version);
      }
    });
  }

  /** Unlink the wallet the account is on */
  async disconnectWalletInteractive() {
    await this.whenPlayable(async () => {
      await this.ctx.wallet.disconnectWallet();
      await this.ctx.walletVersion.remember(undefined);
      this.logger.success("Wallet disconnected.");
    });
  }
}
