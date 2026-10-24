import FarmerModule from "../../lib/farmer/FarmerModule.js";

/** The account as the Auto system drives it */
export default class DiggoAuto extends FarmerModule {
  /** Bind a wallet from its phrase, since the game wants a signed TON proof */
  connectWallet(wallet) {
    return this.ctx.connector.connect(wallet);
  }

  /** Claim what is pending so the summary reflects the current balance */
  async refreshState() {
    await this.ctx.state.ensureLoaded();
    await this.ctx.wallet.refreshHolding();
    await this.ctx.tasks.claimPendingMining();
  }

  /** Re-read the state and the activation for a fresh summary */
  async refreshSummary() {
    await this.ctx.state.load();
    await this.ctx.activation
      .loadActivation()
      .catch((error) =>
        this.logger.warn("Failed to read the activation:", error.message),
      );

    return this.summary();
  }

  /** Pay the one-time withdrawal activation from the wallet's phrase, binding the wallet first when the account has none */
  async verifyWallet({ phrase, version, apiKey }) {
    try {
      await this.ctx.state.ensureLoaded();

      if (!this.ctx.wallet.getConnectedWalletAddress()) {
        const connected = await this.ctx.auto.connectWallet({
          phrase,
          version,
        });

        if (!connected.status) return connected;
      }

      if (
        this.ctx.activation.isActivated(
          await this.ctx.activation.loadActivation(),
        )
      ) {
        return {
          status: true,
          skipped: true,
          message: "Already activated",
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
          message: "The phrase does not match the bound wallet",
        };
      }

      const { status, skipped, message } =
        await this.ctx.activation.payActivation(signer);

      return {
        status,
        skipped,
        message,
        summary: status ? await this.refreshSummary() : this.summary(),
      };
    } catch (error) {
      return { status: false, message: error.message || "Unknown error" };
    }
  }

  /** Put the account to work and report it afresh */
  async startMining() {
    await this.ctx.state.ensureLoaded();
    await this.ctx.wallet.refreshHolding();
    await this.ctx.tasks.claimPendingMining();
    await this.ctx.tasks.claimStreak();
    await this.ctx.tasks.claimCommission();

    return this.refreshSummary();
  }

  /** Normalized account snapshot, holding the bound wallet's on-chain DIGGO */
  summary() {
    const state = this.ctx.state.data || {};
    const mining = state["mining"] || {};
    const address = this.ctx.wallet.getConnectedWalletAddress();
    const nextClaimAt = Number(mining["nextClaimAt"]) || 0;

    return {
      level: Number(state["currentLevel"]) || 0,
      holding:
        this.ctx.wallet.getWalletDiggo() === null
          ? null
          : Number(this.ctx.wallet.getWalletDiggo()),
      balance: state["balance"],
      minWithdrawal: this.ctx.withdrawal.getMinimumWithdrawal(),
      verified: this.ctx.activation.isActivated(),
      mining: {
        startedAt: Math.floor(
          (Number(mining["lastAccrualAt"]) || Date.now()) / 1000,
        ),
        freezesAt: Math.floor(nextClaimAt / 1000),
        frozen: nextClaimAt > 0 && this.ctx.state.getServerNow() >= nextClaimAt,
      },
      wallet: address
        ? { address, version: this.ctx.walletVersion.current }
        : null,
      banned: false,
      banReason: null,
    };
  }
}
