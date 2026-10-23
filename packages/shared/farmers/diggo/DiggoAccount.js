import DiggoMarket from "./DiggoMarket.js";

/** What the account looks like, as logged and summarized for Auto */
export default class DiggoAccount extends DiggoMarket {
  /** Log what the account looks like before the pass starts */
  logAccountInfo() {
    const state = this.state_data;
    const mining = state["mining"] || {};
    const wallet = state["wallet"] || {};

    this.logger.newline();
    this.logCurrentUser();
    this.logger.keyValue("Balance", this.formatAmount(state["balance"]));
    this.logger.keyValue("Holding", this.formatAmount(state["holding"]));
    this.logger.keyValue("Level", state["currentLevel"]);
    this.logger.keyValue("Speed", `${mining["ths"]} TH/s`, {
      valueStyle: this.logger.c.greenBright,
    });
    this.logger.keyValue("Daily Mining", this.formatAmount(mining["daily"]), {
      valueStyle: this.logger.c.greenBright,
    });
    this.logger.keyValue(
      "Pending Mining",
      this.formatAmount(mining["pending"]),
    );
    this.logger.keyValue(
      "Next Claim",
      mining["nextClaimAt"]
        ? new Date(mining["nextClaimAt"]).toLocaleString()
        : "Now",
    );
    this.logger.keyValue("In-app TON", this.formatAmount(this.getInAppTon()));
    this.logger.keyValue(
      "Wallet DIGGO",
      this.getWalletDiggo() === null
        ? "-"
        : this.formatAmount(this.getWalletDiggo()),
    );
    this.logger.keyValue(
      "Wallet",
      wallet["address"] ? this.getConnectedWalletAddress() : "Not connected",
      {
        valueStyle: wallet["address"]
          ? this.logger.c.greenBright
          : this.logger.c.yellowBright,
      },
    );
    this.logger.keyValue("Friends", this.getReferralsCount());
  }

  /* --------------------------------------------------------------------- */
  /* Auto adapter                                                          */
  /* --------------------------------------------------------------------- */

  /** Claim what is pending so the summary reflects the current balance */
  async refreshAutoState() {
    await this.ensureStateLoaded();
    await this.refreshHolding();
    await this.claimPendingMining();
  }

  /** Re-read the state and the activation for a fresh summary */
  async refreshAutoSummary() {
    await this.loadState();
    await this.loadActivation().catch((error) =>
      this.logger.warn("Failed to read the activation:", error.message),
    );

    return this.getAutoSummary();
  }

  /** Pay the one-time withdrawal activation from the wallet's phrase, binding the wallet first when the account has none */
  async verifyAutoWallet({ phrase, version, apiKey }) {
    try {
      await this.ensureStateLoaded();

      if (!this.getConnectedWalletAddress()) {
        const connected = await this.connectAutoWallet({ phrase, version });

        if (!connected.status) return connected;
      }

      if (this.isActivated(await this.loadActivation())) {
        return {
          status: true,
          skipped: true,
          message: "Already activated",
          summary: this.getAutoSummary(),
        };
      }

      const signer = await this.createSigner({ phrase, version, apiKey });

      if (!signer) {
        return {
          status: false,
          message: "The phrase does not match the bound wallet",
        };
      }

      const { status, skipped, message } = await this.payActivation(signer);

      return {
        status,
        skipped,
        message,
        summary: status
          ? await this.refreshAutoSummary()
          : this.getAutoSummary(),
      };
    } catch (error) {
      return { status: false, message: error.message || "Unknown error" };
    }
  }

  /** Put the account to work and report it afresh */
  async startAutoMining() {
    await this.ensureStateLoaded();
    await this.refreshHolding();
    await this.claimPendingMining();
    await this.claimStreak();
    await this.claimCommission();

    return this.refreshAutoSummary();
  }

  /** Normalized account snapshot, holding the bound wallet's on-chain DIGGO */
  getAutoSummary() {
    const state = this.state_data || {};
    const mining = state["mining"] || {};
    const address = this.getConnectedWalletAddress();
    const nextClaimAt = Number(mining["nextClaimAt"]) || 0;

    return {
      level: Number(state["currentLevel"]) || 0,
      holding:
        this.getWalletDiggo() === null ? null : Number(this.getWalletDiggo()),
      balance: state["balance"],
      minWithdrawal: this.getMinimumWithdrawal(),
      verified: this.isActivated(),
      mining: {
        startedAt: Math.floor(
          (Number(mining["lastAccrualAt"]) || Date.now()) / 1000,
        ),
        freezesAt: Math.floor(nextClaimAt / 1000),
        frozen: nextClaimAt > 0 && this.getServerNow() >= nextClaimAt,
      },
      wallet: address
        ? { address, version: this.connectedWalletVersion }
        : null,
      banned: false,
      banReason: null,
    };
  }
}
