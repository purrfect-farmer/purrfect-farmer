import FarmerModule from "../../lib/farmer/FarmerModule.js";
import createAutoWalletTools from "../../lib/farmer/autoWalletTools.js";
import { promptWalletVersion } from "../../lib/farmer/prompts.js";
import { keyPairFromPhraseOrSecretKey } from "../../lib/ton/wallet.js";

/** The interactive tools the farmer offers */
export default class MyAgeTools extends FarmerModule {
  create() {
    return [
      {
        name: "Wallet",
        list: createAutoWalletTools({
          connect: () => this.connectWalletInteractive(),
          disconnect: () => this.disconnectWalletInteractive(),
          prompts: this.ctx.connectPrompts,
        }),
      },
      {
        name: "Rewards",
        list: [
          {
            id: "claim-vault",
            icon: "check",
            title: "Claim Vault",
            action: () =>
              this.whenPlayable(() => this.ctx.rewards.claimVault()),
            dispatch: false,
          },
          {
            id: "spin-wheel",
            icon: "check",
            title: "Spin Wheel",
            action: () => this.whenPlayable(() => this.ctx.rewards.spinWheel()),
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
