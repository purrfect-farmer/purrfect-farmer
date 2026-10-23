import BaseFarmer from "../../lib/BaseFarmer.js";
import { keyPairFromPhraseOrSecretKey } from "../../lib/ton/wallet.js";

/** Trait: what the account looks like, as logged and summarized for Auto */
export default class MRGAccount {
  /** Log what the account looks like before the pass starts */
  async logAccountInfo() {
    const user = this.getAccountDetails();
    const activeLevel = this.getActiveLevel();

    this.logger.newline();
    this.logCurrentUser();
    this.logger.keyValue("Balance", this.formatAmount(user["inAppBalance"]));
    this.logger.keyValue(
      "Pending Mining",
      this.formatAmount(user["unclaimedMiningBalance"]),
    );
    this.logger.keyValue("Level", activeLevel);
    this.logger.keyValue(
      "Speed",
      `${this.getSpeedForLevel(activeLevel)} TH/s`,
      { valueStyle: this.logger.c.greenBright },
    );
    this.logger.keyValue(
      "Daily Mining",
      this.formatAmount(this.getDailyOutputForLevel(activeLevel)),
      { valueStyle: this.logger.c.greenBright },
    );
    this.logger.keyValue(
      "Lifetime Mined",
      this.formatAmount(user["totalMinedLifetime"]),
    );

    const { freezesAt } = this.getMiningWindow();

    this.logger.keyValue(
      "Mining Window Ends",
      freezesAt ? new Date(freezesAt * 1000).toLocaleString() : "No session",
    );
    this.logger.keyValue(
      "Human Check",
      this.isHumanCheckValid()
        ? `Until ${new Date(this.getHumanVerifiedUntil()).toLocaleString()}`
        : "Expired",
      {
        valueStyle: this.isHumanCheckValid()
          ? this.logger.c.greenBright
          : this.logger.c.yellowBright,
      },
    );

    this.logger.newline();
    this.logger.keyValue(
      "Wallet",
      user["tonWalletAddress"] || "Not connected",
      {
        valueStyle: user["tonWalletAddress"]
          ? this.logger.c.greenBright
          : this.logger.c.yellowBright,
      },
    );
    this.logger.keyValue(
      "Holding",
      this.formatAmount(user["tonWalletBalance"]),
    );
    this.logger.keyValue(
      "Verified",
      this.isAccountVerified(user) ? "Yes" : "No",
      {
        valueStyle: this.isAccountVerified(user)
          ? this.logger.c.greenBright
          : this.logger.c.yellowBright,
      },
    );

    /** The page flags a re-check without blocking withdrawals on it */
    if (user["isVerificationRequired"]) {
      this.logger.keyValue("Re-verify Required", "Yes", {
        valueStyle: this.logger.c.yellowBright,
      });
    }
    this.logger.keyValue(
      "Check-In Streak",
      `${user["checkinStreak"] || 0} (last ${user["checkinLastDay"] || "never"})`,
    );

    const discountPercent = await this.readNftDiscountPercent();

    if (discountPercent) {
      this.logger.keyValue(
        "Genesis NFTs",
        `${this.countNftHoldings(await this.readNftHoldings())} (${discountPercent}% off the fee)`,
        { valueStyle: this.logger.c.greenBright },
      );
    }

    if (this.isAccountBanned(user)) {
      this.logger.keyValue("Banned", user["banReason"] || "Yes", {
        valueStyle: this.logger.c.redBright,
      });
    }

    const pendingWithdrawals = this.getPendingWithdrawals();

    this.logger.keyValue("Pending Withdrawals", pendingWithdrawals.length, {
      valueStyle: pendingWithdrawals.length
        ? this.logger.c.yellowBright
        : this.logger.c.greenBright,
    });
  }

  /* --------------------------------------------------------------------- */
  /* Auto adapter                                                          */
  /* --------------------------------------------------------------------- */

  /** Claim pending mining so the summary reflects the current balance */
  async refreshAutoState() {
    return this.claimPendingMining();
  }

  /** Re-read the account, without the wallet sync that makes the drop re-read the chain */
  async refreshAutoSummary() {
    await this.loadAccount();

    return this.getAutoSummary();
  }

  /** Bind a wallet from its phrase, since the drop wants a signed TON proof */
  async connectAutoWallet({ phrase, address, version, refresh = false }) {
    if (!phrase) {
      return BaseFarmer.prototype.connectAutoWallet.call(this, {
        address,
        version,
        refresh,
      });
    }

    try {
      await this.ensureStateLoaded();

      const keyPair = await keyPairFromPhraseOrSecretKey(phrase);
      const { status, message } = await this.connectSignedWallet(
        keyPair,
        version,
      );

      if (!status) {
        return { status: false, message };
      }

      await this.afterAutoWalletConnected();

      return {
        status: true,
        summary: refresh
          ? await this.refreshAutoSummary()
          : this.getAutoSummary(),
      };
    } catch (error) {
      return { status: false, message: error.message || "Unknown error" };
    }
  }

  /** Pay the one-time verification from the wallet's phrase, connecting the wallet first when the account has none */
  async verifyAutoWallet({ phrase, version, apiKey }) {
    try {
      await this.ensureStateLoaded();

      if (this.isAccountVerified(this.getAccountDetails())) {
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
        message: message || (status ? "Verified" : "Not confirmed yet"),
        summary: status
          ? await this.refreshAutoSummary()
          : this.getAutoSummary(),
      };
    } catch (error) {
      return { status: false, message: error.message || "Unknown error" };
    }
  }

  /** Put the account to work at the holding a boost just sent it */
  async startAutoMining() {
    await this.syncConnectedWallet();
    await this.unlockAffordableLevel();
    await this.claimPendingMining();

    return this.refreshAutoSummary();
  }

  /** Whether the drop lets the account withdraw, which the page reads from `isVerified` alone */
  isAccountVerified(user) {
    return Boolean(user["isVerified"]);
  }

  /** Whether the drop has banned the account */
  isAccountBanned(user) {
    return user["status"] === "banned" || Boolean(user["bannedAt"]);
  }

  /** Normalized account snapshot */
  getAutoSummary() {
    const user = this.getAccountDetails();
    const address = user["tonWalletAddress"];

    return {
      level: this.getActiveLevel(),
      mining: this.getMiningWindow(),
      holding: user["tonWalletBalance"],
      balance: user["inAppBalance"],
      minWithdrawal: this.getMinimumWithdrawal(),
      verified: this.isAccountVerified(user),
      wallet: address
        ? { address, version: this.connectedWalletVersion }
        : null,
      banned: this.isAccountBanned(user),
      banReason: user["banReason"],
    };
  }
}
