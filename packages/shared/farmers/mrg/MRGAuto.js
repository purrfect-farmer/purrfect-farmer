import FarmerModule from "../../lib/farmer/FarmerModule.js";

/** The account as the Auto system drives it */
export default class MRGAuto extends FarmerModule {
  /** Claim pending mining so the summary reflects the current balance */
  refreshState() {
    return this.ctx.mining.claimPendingMining();
  }

  /** Re-read the account, without the wallet sync that makes the drop re-read the chain */
  async refreshSummary() {
    await this.ctx.state.load();

    return this.summary();
  }

  /** Bind a wallet, signing with its phrase since the drop wants a TON proof */
  connectWallet(wallet) {
    return this.ctx.connector.connect(wallet);
  }

  /** Pay the one-time verification from the wallet's phrase, connecting the wallet first when the account has none */
  async verifyWallet({ phrase, version, apiKey }) {
    try {
      await this.ctx.state.ensureLoaded();

      if (this.ctx.account.isAccountVerified(this.ctx.state.user())) {
        return {
          status: true,
          skipped: true,
          message: "Already verified",
          summary: this.summary(),
        };
      }

      if (!this.ctx.wallet.getConnectedWalletAddress()) {
        const connected = await this.connectWallet({ phrase, version });

        if (!connected.status) return connected;
      }

      const { status, message } = await this.ctx.wallet.verifyWalletIfNeeded({
        phrase,
        version,
        apiKey,
      });

      return {
        status,
        skipped: false,
        message: message || (status ? "Verified" : "Not confirmed yet"),
        summary: status ? await this.refreshSummary() : this.summary(),
      };
    } catch (error) {
      return { status: false, message: error.message || "Unknown error" };
    }
  }

  /** Put the account to work at the holding a boost just sent it */
  async startMining() {
    await this.ctx.wallet.syncConnectedWallet();
    await this.ctx.mining.unlockAffordableLevel();
    await this.ctx.mining.claimPendingMining();

    return this.refreshSummary();
  }

  /** Normalized account snapshot */
  summary() {
    const user = this.ctx.state.user();
    const address = user["tonWalletAddress"];

    return {
      level: this.ctx.mining.getActiveLevel(),
      mining: this.ctx.mining.getMiningWindow(),
      holding: user["tonWalletBalance"],
      balance: user["inAppBalance"],
      minWithdrawal: this.ctx.flow.minimum(),
      verified: this.ctx.account.isAccountVerified(user),
      wallet: address
        ? { address, version: this.ctx.walletVersion.current }
        : null,
      banned: this.ctx.account.isAccountBanned(user),
      banReason: user["banReason"],
    };
  }
}
