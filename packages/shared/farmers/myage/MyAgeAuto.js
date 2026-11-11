import AutoModule from "../../lib/farmer/AutoModule.js";

/** The account as the Auto system drives it */
export default class MyAgeAuto extends AutoModule {
  /** Re-read the account and claim the vault so the summary reflects current balances */
  async refreshState() {
    await this.ctx.state.load();

    if (!this.ctx.state.isPlayable()) return;

    await this.ctx.rewards.claimVault();
  }

  /** Normalized account snapshot, with the vault filling up as the mining clock */
  summary() {
    const { state } = this.ctx;
    const vault = state.data?.["vault"];
    const offset = this.ctx.rewards.serverOffset();
    const address = this.ctx.wallet.getConnectedWalletAddress();

    return {
      level: 0,
      holding: null,
      balance: state.gram().toNumber(),
      minWithdrawal: this.ctx.withdrawal.getMinimumWithdrawal(),
      verified: true,
      mining: vault
        ? {
            startedAt: Math.floor((vault["startedAt"] + offset) / 1000),
            freezesAt: Math.floor((vault["fullAt"] + offset) / 1000),
            frozen: Date.now() - offset >= vault["fullAt"],
          }
        : undefined,
      wallet: address
        ? { address, version: this.ctx.walletVersion.current }
        : null,
      banned: state.isBlocked(),
      banReason: state.isBlocked() ? state.unplayableReason() : null,
    };
  }
}
