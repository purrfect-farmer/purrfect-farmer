/** Trait: what the account looks like, as logged and summarized for Auto */
export default class VictorsAccount {
  /** Log what the account looks like before the pass starts */
  logAccountInfo() {
    const user = this.getUserDetails();
    const mining = this.getMining();
    const verify = this.getVerify();
    const level = Number(mining["level"]) || 0;

    this.logger.newline();
    this.logCurrentUser();
    this.logger.keyValue("Balance", this.formatAmount(user["inAppBalance"]));
    this.logger.keyValue(
      "Holding",
      this.formatAmount(this.state_data["holding"]),
    );
    this.logger.keyValue(
      "Pending Mining",
      this.formatAmount(this.getMinedAmount()),
    );
    this.logger.keyValue("Level", level);
    this.logger.keyValue("Speed", `${this.getSpeedForLevel(level)} TH/s`, {
      valueStyle: this.logger.c.greenBright,
    });
    this.logger.keyValue(
      "Daily Mining",
      this.formatAmount(this.getDailyOutputForLevel(level)),
      { valueStyle: this.logger.c.greenBright },
    );
    this.logger.keyValue(
      "Session Ends",
      mining["sessionEndsAt"]
        ? new Date(mining["sessionEndsAt"]).toLocaleString()
        : "No session",
    );

    this.logger.newline();
    this.logger.keyValue("Wallet", user["walletAddress"] || "Not connected", {
      valueStyle: user["walletAddress"]
        ? this.logger.c.greenBright
        : this.logger.c.yellowBright,
    });
    this.logger.keyValue(
      "On-chain VIC",
      this.formatAmount(user["walletBalance"]),
    );

    if (this.getMinimumHolding()) {
      this.logger.keyValue(
        "Min Holding",
        this.formatAmount(this.getMinimumHolding()),
        {
          valueStyle: this.hasMinimumHolding()
            ? this.logger.c.greenBright
            : this.logger.c.yellowBright,
        },
      );
    }

    if (user["walletAddress"]) {
      this.logger.keyValue("Owned", user["walletOwned"] ? "Yes" : "No", {
        valueStyle: user["walletOwned"]
          ? this.logger.c.greenBright
          : this.logger.c.yellowBright,
      });
    }

    this.logger.keyValue("Verified", verify["verified"] ? "Yes" : "No", {
      valueStyle: verify["verified"]
        ? this.logger.c.greenBright
        : this.logger.c.yellowBright,
    });

    if (verify["underReview"]) {
      this.logger.keyValue("Under Review", "Yes", {
        valueStyle: this.logger.c.redBright,
      });
    }

    this.logger.keyValue(
      "Referrals",
      this.state_data.referral?.["referralsCount"] || 0,
    );
  }

  /* --------------------------------------------------------------------- */
  /* Auto adapter                                                          */
  /* --------------------------------------------------------------------- */

  /** Pay the one-time verification from the wallet's phrase, connecting the wallet first when the account has none */
  async verifyAutoWallet({ phrase, version, apiKey }) {
    try {
      await this.ensureStateLoaded();

      if (this.getVerify()["verified"]) {
        return {
          status: true,
          skipped: true,
          message: "Already verified",
          summary: this.getAutoSummary(),
        };
      }

      if (!this.getConnectedWalletAddress()) {
        const connected = await this.connectAutoWallet({ phrase, version });

        if (!connected.status) return connected;
      }

      const { status, message } = await this.verifyWalletIfNeeded({
        phrase,
        version,
        apiKey,
      });

      return {
        status,
        skipped: false,
        message:
          message || (status ? "Verified" : "Not confirmed yet, check again"),
        summary: status
          ? await this.refreshAutoSummary()
          : this.getAutoSummary(),
      };
    } catch (error) {
      return { status: false, message: error.message || "Unknown error" };
    }
  }

  /** Re-read the holding and claim pending mining so the summary reflects current balances */
  async refreshAutoState() {
    await this.ensureStateLoaded();
    await this.refreshHolding();

    return this.claimPendingMining();
  }

  /** Re-read the state for a fresh summary */
  async refreshAutoSummary() {
    await this.loadState();

    return this.getAutoSummary();
  }

  /** Put the account to work at the holding it now has, and report it afresh */
  async startAutoMining() {
    await this.ensureStateLoaded();
    await this.refreshHolding();
    await this.unlockAffordableLevel();
    await this.claimPendingMining();
    await this.claimSquadRewards();

    return this.refreshAutoSummary();
  }

  /** Normalized account snapshot */
  getAutoSummary() {
    const user = this.getUserDetails();
    const mining = this.getMining();
    const address = this.getConnectedWalletAddress();
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
      minWithdrawal: this.getMinimumWithdrawal(),
      verified: Boolean(this.getVerify()["verified"]),
      wallet: address
        ? { address, version: this.connectedWalletVersion }
        : null,
      banned: Boolean(this.banInfo),
      banReason: this.banInfo?.error ?? null,
    };
  }
}
