import FarmerModule from "../../lib/farmer/FarmerModule.js";

/** The account as the Auto system drives it */
export default class ATFAuto extends FarmerModule {
  /** Connect a TON wallet, optionally re-reading the account afterwards */
  async connectWallet({ phrase, version, refresh = false }) {
    try {
      const keyPair = await this.ctx.wallet.getKeyPair(phrase);
      const { status, message } = await this.ctx.wallet.connectAndSyncWallet(
        keyPair,
        `v${version}`,
      );

      if (!status) {
        return { status: false, message };
      }

      await this.ctx.walletVersion.remember(version);

      return {
        status: true,
        summary: refresh ? await this.refreshSummary() : this.summary(),
      };
    } catch (error) {
      return { status: false, message: error.message || "Unknown error" };
    }
  }

  /** Claim pending mining so the summary reflects the current balance */
  async refreshState() {
    return this.ctx.mining.startOrClaimMining();
  }

  /** Log in again for a fresh summary, since only a forced login re-reads the wallet on-chain */
  async refreshSummary() {
    await this.ctx.session.login(true);
    return this.summary();
  }

  /** Start mining and report the account afresh, after a boost has landed so the level is snapshotted */
  async startMining() {
    await this.ctx.mining.startOrClaimMining();
    await this.ctx.mining.applyBoost();
    await this.ctx.tasks.claimFriendsRewards();
    return this.refreshSummary();
  }

  /** Normalized account snapshot */
  summary() {
    const user = this.ctx.state.user();
    const flags = (user["risk_flags"] || "").trim().split("|").filter(Boolean);
    const wallet = user["wallet_public_key"]
      ? this.ctx.wallet.getUserWallet(user)
      : null;

    return {
      level: user["miner_level"],
      mining: {
        startedAt: Number(user["last_mining_start"]) || 0,
        freezesAt: Number(user["mining_freezes_at"]) || 0,
        frozen: user["mining_frozen"] === 1,
      },
      holding: user["wallet_holding_atf"],
      balance: user["mined_balance"],
      minWithdrawal: this.ctx.flow.minimum(),
      verified: this.ctx.account.isUserVerified(user),
      protection: {
        revoked: this.ctx.account.isUserProtectionRevoked(user),
        dexBuyer: this.ctx.account.isUserQualifiedDexBuyer(user),
      },
      wallet: wallet
        ? { address: wallet.address, version: wallet.version }
        : null,
      exchange: this.ctx.account.getUserExchange(user),
      banned: this.ctx.account.isUserBanned(user),
      banReason: user["banned_reason"],
      risk: {
        score: user["risk_score"],
        updatedAt: user["risk_updated_at"],
        flags,
      },
    };
  }
}
