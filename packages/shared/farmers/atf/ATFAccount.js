/** Trait: what the account looks like, as logged and summarized for Auto */
export default class ATFAccount {
  /** Log User Info */
  async logUserInfo(user) {
    this.logger.newline();
    this.logCurrentUser();

    const diffData = await this.fetchDifficultyData();
    this.logUserBalance(user, diffData);
    this.logUserRisks(user);

    if (user["wallet_public_key"]) {
      this.logUserWallet(user);
    }

    /** Check for flagged withdrawals */
    const { flagged: hasFlagged } = await this.getWithdrawalGuard();

    /** Log flagged withdrawals */
    this.logger.keyValue("Flagged Withdrawals", hasFlagged ? "Yes" : "No", {
      valueStyle: hasFlagged
        ? this.logger.c.redBright
        : this.logger.c.greenBright,
    });

    if (hasFlagged) {
      this.logger.error(
        "You have flagged withdrawals in your history. Please check your account for details.",
      );
    } else {
      this.logger.success("No flagged withdrawals in your history.");
    }
  }

  logUserBalance(user, diffData) {
    const lastMiningStart = Number(user["last_mining_start"]);
    const miningFreezesAt = Number(user["mining_freezes_at"]);
    const isMiningFrozen = user["mining_frozen"] === 1;
    this.logger.keyValue("Wallet Balance", user["wallet_holding_atf"]);
    this.logger.keyValue("Balance", user["mined_balance"]);
    this.logger.keyValue("Pending Rewards", user["pending_reward"]);
    this.logger.keyValue("Miner Level", user["miner_level"]);

    if (diffData) {
      this.logger.keyValue(
        "Daily Mining",
        this.getDailyMiningRate(user, diffData).toDecimalPlaces(4).toString(),
        { valueStyle: this.logger.c.greenBright },
      );
    }
    this.logger.keyValue(
      "Last Mining Start",
      lastMiningStart === 0
        ? "Not mining"
        : new Date(lastMiningStart * 1000).toLocaleString(),
    );
    this.logger.keyValue(
      "Mining freezes at",
      miningFreezesAt === 0
        ? "Not mining"
        : new Date(miningFreezesAt * 1000).toLocaleString(),
    );

    if (isMiningFrozen) {
      this.logger.keyValue("Mining Frozen", "Yes", {
        valueStyle: this.logger.c.redBright,
      });
    }
  }

  logUserRisks(user) {
    const flags = (user["risk_flags"] || "").trim().split("|").filter(Boolean);
    const isVerified = this.isUserVerified(user);

    this.logger.newline();
    this.logger.keyValue("Verified", isVerified ? "Yes" : "No", {
      valueStyle: isVerified
        ? this.logger.c.greenBright
        : this.logger.c.yellowBright,
    });
    const isProtectionRevoked = this.isUserProtectionRevoked(user);
    const isDexBuyer = this.isUserQualifiedDexBuyer(user);

    this.logger.keyValue(
      "Buyer Protection",
      isProtectionRevoked ? "Revoked" : "Active",
      {
        valueStyle: isProtectionRevoked
          ? this.logger.c.redBright
          : this.logger.c.greenBright,
      },
    );
    this.logger.keyValue("DEX Buyer", isDexBuyer ? "Yes" : "No", {
      valueStyle: isDexBuyer
        ? this.logger.c.greenBright
        : this.logger.c.yellowBright,
    });

    /** Away accounts mine at 1/factor of the rate */
    const activity = user["activity_ui"];

    if (activity) {
      const mode = String(activity["mode"] || "active");
      const factor = (Number(activity["factor_milli"]) || 1000) / 1000;
      const isThrottled =
        mode !== "active" && mode !== "investor" && factor > 1;

      this.logger.keyValue(
        "Activity",
        isThrottled ? `${mode} (/${factor})` : mode,
        {
          valueStyle: isThrottled
            ? this.logger.c.yellowBright
            : this.logger.c.greenBright,
        },
      );
    }
    const exchange = this.getUserExchange(user);

    this.logger.keyValue(
      "Toobit",
      exchange ? exchange.uid || "Connected" : "Not connected",
      {
        valueStyle: exchange
          ? this.logger.c.greenBright
          : this.logger.c.yellowBright,
      },
    );
    this.logger.keyValue("Risk Score", user["risk_score"]);
    this.logger.keyValue("Risk Updated", user["risk_updated_at"]);
    this.logger.keyValue("Risk Flags", flags.length);
    flags.forEach((flag) => this.logger.info(`- ${flag}`));

    this.logger.newline();
    this.logger.keyValue("Is banned", user["is_banned"]);
    this.logger.keyValue("Banned reason", user["banned_reason"]);
    this.logger.keyValue("Banned at", user["banned_at"]);
    this.logger.keyValue("Temp banned until", user["temp_banned_until"]);
    this.logger.keyValue("Temp ban reason", user["temp_ban_reason"]);
  }

  /** Whether the drop has verified the account */
  isUserVerified(user) {
    return Number(user["is_verified"]) === 1;
  }

  /** Whether the drop has revoked the account's buyer protection */
  isUserProtectionRevoked(user) {
    return Number(user["buyer_protection_revoked"]) === 1;
  }

  /** Whether the drop counts the account as a qualified DEX buyer */
  isUserQualifiedDexBuyer(user) {
    return Number(user["qualified_dex_buyer"]) === 1;
  }

  /** The exchange the account has linked on the drop, or null when none */
  getUserExchange(user) {
    if (Number(user["toobit_connected"]) !== 1) return null;

    return { name: "Toobit", uid: user["toobit_uid"] || null };
  }

  /** Whether the drop has banned the account */
  isUserBanned(user) {
    return Number(user["is_banned"]) === 1;
  }

  /* --------------------------------------------------------------------- */
  /* Auto adapter                                                          */
  /* --------------------------------------------------------------------- */

  /** Connect a TON wallet, optionally re-reading the account afterwards */
  async connectAutoWallet({ phrase, version, refresh = false }) {
    try {
      const keyPair = await this.getKeyPair(phrase);
      const { status, message } = await this.connectAndSyncWallet(
        keyPair,
        `v${version}`,
      );

      if (!status) {
        return { status: false, message };
      }

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

  /** Claim pending mining so the summary reflects the current balance */
  async refreshAutoState() {
    return this.startOrClaimMining();
  }

  /** Log in again for a fresh summary, since only a forced login re-reads the wallet on-chain */
  async refreshAutoSummary() {
    await this.login(true);
    return this.getAutoSummary();
  }

  /** Start mining and report the account afresh, after a boost has landed so the level is snapshotted */
  async startAutoMining() {
    await this.startOrClaimMining();
    await this.applyBoost();
    await this.claimFriendsRewards();
    return this.refreshAutoSummary();
  }

  /** Normalized account snapshot */
  getAutoSummary() {
    const user = this.getUserDetails();
    const flags = (user["risk_flags"] || "").trim().split("|").filter(Boolean);
    const wallet = user["wallet_public_key"] ? this.getUserWallet(user) : null;

    return {
      level: user["miner_level"],
      mining: {
        startedAt: Number(user["last_mining_start"]) || 0,
        freezesAt: Number(user["mining_freezes_at"]) || 0,
        frozen: user["mining_frozen"] === 1,
      },
      holding: user["wallet_holding_atf"],
      balance: user["mined_balance"],
      minWithdrawal: this.getMinimumWithdrawal(),
      verified: this.isUserVerified(user),
      protection: {
        revoked: this.isUserProtectionRevoked(user),
        dexBuyer: this.isUserQualifiedDexBuyer(user),
      },
      wallet: wallet
        ? { address: wallet.address, version: wallet.version }
        : null,
      exchange: this.getUserExchange(user),
      banned: this.isUserBanned(user),
      banReason: user["banned_reason"],
      risk: {
        score: user["risk_score"],
        updatedAt: user["risk_updated_at"],
        flags,
      },
    };
  }
}
