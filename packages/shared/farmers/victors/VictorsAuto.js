import FarmerModule from "../../lib/farmer/FarmerModule.js";

/** The account as the Auto system drives it */
export default class VictorsAuto extends FarmerModule {
  /** Bind a wallet from its phrase with a TON proof, or by address alone when no phrase is known */
  connectWallet(wallet) {
    return this.ctx.connector.connect(wallet);
  }

  /** Pay the one-time verification from the wallet's phrase, connecting the wallet first when the account has none */
  verifyWallet(wallet) {
    return this.ctx.verifier.verify(wallet);
  }

  /** Re-read the holding and claim pending mining so the summary reflects current balances */
  async refreshState() {
    await this.ctx.state.ensureLoaded();
    await this.ctx.wallet.refreshHolding();

    return this.ctx.mining.claimPendingMining();
  }

  /** Re-read the state for a fresh summary */
  async refreshSummary() {
    await this.ctx.state.load();

    return this.summary();
  }

  /** Put the account to work at the holding it now has, and report it afresh */
  async startMining() {
    await this.ctx.state.ensureLoaded();
    await this.ctx.wallet.refreshHolding();
    await this.ctx.mining.unlockAffordableLevel();
    await this.ctx.mining.claimPendingMining();
    await this.ctx.tasks.claimSquadRewards();

    return this.refreshSummary();
  }

  /** Normalized account snapshot */
  summary() {
    const user = this.ctx.state.user();
    const mining = this.ctx.state.mining();
    const address = this.ctx.wallet.getConnectedWalletAddress();
    const toSeconds = (value) =>
      value ? Math.floor(new Date(value).getTime() / 1000) : 0;
    const freezesAt = toSeconds(mining["sessionEndsAt"]);

    return {
      level: Number(mining["level"]) || 0,
      mining: {
        startedAt: toSeconds(mining["sessionStartedAt"]),
        freezesAt,
        frozen: Boolean(freezesAt) && Date.now() / 1000 >= freezesAt,
      },
      holding: user["walletBalance"],
      balance: user["inAppBalance"],
      minWithdrawal: this.ctx.withdrawal.getMinimumWithdrawal(),
      verified: Boolean(this.ctx.state.verify()["verified"]),
      wallet: address
        ? { address, version: this.ctx.walletVersion.current }
        : null,
      banned: Boolean(this.ctx.session.banInfo),
      banReason: this.ctx.session.banInfo?.error ?? null,
    };
  }
}
