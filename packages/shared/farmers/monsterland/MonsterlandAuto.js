import FarmerModule from "../../lib/farmer/FarmerModule.js";

/** The account as the Auto system drives it */
export default class MonsterlandAuto extends FarmerModule {
  /** Bind a wallet by its address */
  connectWallet(wallet) {
    return this.ctx.connector.connect(wallet);
  }

  /** Collect the day's free rewards so the summary reflects the current balance */
  async refreshState() {
    await this.ctx.state.ensureLoaded();
    await this.ctx.rewards.claimStreak();
  }

  /** Re-read the state for a fresh summary */
  async refreshSummary() {
    await this.ctx.state.load();

    if (!this.ctx.state.config) {
      await this.ctx.api.fetchConfig().catch(() => null);
    }

    return this.summary();
  }

  /** Put the account to work and report it afresh */
  async startMining() {
    await this.ctx.state.ensureLoaded();
    await this.ctx.rewards.claimStreak();
    await this.ctx.eggs.manageEggs();
    await this.ctx.care.careForMonsters();

    return this.refreshSummary();
  }

  /** Normalized account snapshot, with no holding since the game does not level on one */
  summary() {
    const profile = this.ctx.state.profile();
    const address = this.ctx.wallet.getConnectedWalletAddress();

    return {
      level: profile["level"] ?? 0,
      holding: null,
      balance: this.ctx.state.lumis(),
      minWithdrawal: this.ctx.withdrawal.getMinimumWithdrawal(),
      verified: true,
      wallet: address
        ? { address, version: this.ctx.walletVersion.current }
        : null,
      banned: false,
      banReason: null,
    };
  }
}
