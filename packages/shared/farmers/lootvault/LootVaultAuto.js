import AutoModule from "../../lib/farmer/AutoModule.js";

/** The account as the Auto system drives it */
export default class LootVaultAuto extends AutoModule {
  /** Re-read the account and collect pending mining so the summary reflects current balances */
  async refreshState() {
    await this.ctx.state.load();

    if (!this.ctx.state.isPlayable()) return;

    await this.ctx.mining.collect();
    await this.ctx.state.loadBalances();
  }

  /** Re-read the account for a fresh summary */
  async refreshSummary() {
    await this.ctx.state.load();

    return this.summary();
  }

  /** Normalized account snapshot */
  summary() {
    const { state } = this.ctx;
    const address = this.ctx.wallet.getConnectedWalletAddress();

    return {
      level: state.level(),
      holding: state.isRegistered() ? state.holding().toNumber() : null,
      balance: state.balance().toNumber(),
      minWithdrawal: this.ctx.withdrawal.getMinimumWithdrawal(),
      verified: true,
      wallet: address
        ? { address, version: this.ctx.walletVersion.current }
        : null,
      banned: state.isBlocked(),
      banReason: state.isBlocked() ? state.unplayableReason() : null,
    };
  }
}
