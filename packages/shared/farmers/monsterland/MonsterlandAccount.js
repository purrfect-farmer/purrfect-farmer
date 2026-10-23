import MonsterlandWallet from "./MonsterlandWallet.js";

/** What the account looks like, as logged and summarized for Auto */
export default class MonsterlandAccount extends MonsterlandWallet {
  /** Log what the account looks like before the pass starts */
  logAccountInfo() {
    const profile = this.getProfile();
    const streak = profile["daily_streak_state"] || {};
    const payments = profile["payments"] || {};
    const monsters = this.getLiveMonsters();

    this.logger.newline();
    this.logCurrentUser();
    this.logger.keyValue("Lumis", this.formatAmount(this.getLumis()));
    this.logger.keyValue("Level", profile["level"] ?? "-");
    this.logger.keyValue("Streak", `${streak["days"] ?? 0} day(s)`);
    this.logger.keyValue(
      "Referrals",
      this.state_data?.referral?.["total_referrals"] ?? 0,
    );
    this.logger.keyValue(
      "Withdrawal Fee",
      payments["withdrawal_fee"] !== undefined
        ? `${payments["withdrawal_fee"]}%`
        : "-",
    );
    this.logger.keyValue("Wallet", payments["wallet"] || "Not connected", {
      valueStyle: payments["wallet"]
        ? this.logger.c.greenBright
        : this.logger.c.yellowBright,
    });

    this.logger.newline();
    this.logger.keyValue("Monsters", monsters.length);

    for (const monster of monsters) {
      const vitals = this.projectVitals(monster);

      this.logger.keyValue(
        monster["name"] || monster["_id"],
        `Lv ${monster["level"] ?? 1} | 🍎 ${Math.round(vitals.food)} 🧼 ${Math.round(vitals.hygiene)} ⚡ ${Math.round(vitals.energy)}${monster["is_sleeping"] ? " | 💤" : ""}`,
      );
    }
  }

  /* --------------------------------------------------------------------- */
  /* Auto adapter                                                          */
  /* --------------------------------------------------------------------- */

  /** Collect the day's free rewards so the summary reflects the current balance */
  async refreshAutoState() {
    await this.ensureStateLoaded();
    await this.claimStreak();
  }

  /** Re-read the state for a fresh summary */
  async refreshAutoSummary() {
    await this.loadState();

    if (!this.config_data) {
      await this.fetchConfig().catch(() => null);
    }

    return this.getAutoSummary();
  }

  /** Put the account to work and report it afresh */
  async startAutoMining() {
    await this.ensureStateLoaded();
    await this.claimStreak();
    await this.manageEggs();
    await this.careForMonsters();

    return this.refreshAutoSummary();
  }

  /** Normalized account snapshot, with no holding since the game does not level on one */
  getAutoSummary() {
    const profile = this.getProfile();
    const address = this.getConnectedWalletAddress();

    return {
      level: profile["level"] ?? 0,
      holding: null,
      balance: this.getLumis(),
      minWithdrawal: this.getMinimumWithdrawal(),
      verified: true,
      wallet: address
        ? { address, version: this.connectedWalletVersion }
        : null,
      banned: false,
      banReason: null,
    };
  }
}
