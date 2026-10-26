import AutoModule from "../../lib/farmer/AutoModule.js";

/** The account as the Auto system drives it */
export default class PickaxeAuto extends AutoModule {
  /** Re-read the account and claim what the storage holds so the summary reflects current balances */
  async refreshState() {
    await this.ctx.state.load();

    if (!this.ctx.state.isPlayable()) return;

    await this.ctx.mining.claim();
  }

  /** Mint the Ancient Pass from the wallet's phrase, linking the wallet first when the account has none */
  async verifyWallet({ phrase, version, apiKey }) {
    try {
      await this.ctx.state.ensureLoaded();

      if (!this.ctx.wallet.getConnectedWalletAddress()) {
        const connected = await this.connectWallet({ phrase, version });

        if (!connected.status) return connected;
      }

      if (this.ctx.state.isPassActive()) {
        return {
          status: true,
          skipped: true,
          message: "The pass is active",
          summary: this.summary(),
        };
      }

      const signer = await this.ctx.wallet.createSigner({
        phrase,
        version,
        apiKey,
      });

      if (!signer) {
        return {
          status: false,
          message: "The phrase does not match the linked wallet",
        };
      }

      const { status, skipped, message } = await this.ctx.pass.pay(signer);

      return { status, skipped, message, summary: this.summary() };
    } catch (error) {
      return { status: false, message: error.message || "Unknown error" };
    }
  }

  /** Normalized account snapshot, with the storage filling up as the mining clock */
  summary() {
    const { state } = this.ctx;
    const data = state.data || {};
    const address = this.ctx.wallet.getConnectedWalletAddress();
    const storageCap = Number(data["storageCap"]) || 0;
    const perDay = Number(data["perDay"]) || 0;
    const unclaimed = state.unclaimed();
    const fillsInMs =
      perDay > 0 ? (Math.max(0, storageCap - unclaimed) / perDay) * 864e5 : 0;

    return {
      level: state.level(),
      holding: data["wallet"] ? state.holding().toNumber() : null,
      balance: state.balance().toNumber(),
      minWithdrawal: this.ctx.withdrawal.getMinimumWithdrawal(),
      verified: state.isPassActive(),
      mining: {
        startedAt: Math.floor(
          (Number(data["lastAccrualAt"]) || Date.now()) / 1000,
        ),
        freezesAt: Math.floor((Date.now() + fillsInMs) / 1000),
        frozen: !data["mining"] || unclaimed >= storageCap,
      },
      wallet: address
        ? { address, version: this.ctx.walletVersion.current }
        : null,
      banned: state.isBlocked(),
      banReason: state.isBlocked() ? state.unplayableReason() : null,
    };
  }
}
