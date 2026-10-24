import FarmerModule from "../../lib/farmer/FarmerModule.js";
import { ERROR_CODE } from "./constants.js";
import { fromNano } from "./loot.js";

/** The account as the drop last returned it */
export default class LootVaultState extends FarmerModule {
  /** Whether the account is registered and the drop is up */
  auth = null;

  /** Level, league, speed and the mining clock */
  dashboard = null;

  /** The app balance, the on-chain hold and the bound wallets */
  balances = null;

  /** When `dashboard` was read, for projecting what has been mined since */
  readAt = 0;

  /** Re-read the account, stopping at whatever keeps it from playing */
  async load() {
    this.auth = await this.fetchAuth();
    this.dashboard = null;
    this.balances = null;

    if (this.isPlayable()) {
      await Promise.all([this.loadDashboard(), this.loadBalances()]);
    }

    return this.auth;
  }

  /** The auth check, with a block or maintenance refusal read as that state */
  async fetchAuth() {
    try {
      return await this.ctx.api.fetchAuth();
    } catch (error) {
      if (error.code === ERROR_CODE.BLOCKED) return { blocked: true };
      if (error.code === ERROR_CODE.MAINTENANCE) return { maintenance: true };

      throw error;
    }
  }

  /** Re-read the dashboard */
  async loadDashboard() {
    this.dashboard = await this.ctx.api.fetchDashboard();
    this.readAt = Date.now();
  }

  /** Re-read the balances */
  async loadBalances() {
    this.balances = await this.ctx.api.fetchBalances();
  }

  /** Read the account once, for entry points that run without a full pass */
  async ensureLoaded() {
    if (!this.auth) {
      await this.load();
    }

    return this.auth;
  }

  /** Whether the account is registered */
  isRegistered() {
    return Boolean(this.auth?.["registered"]);
  }

  /** Whether the drop is down for maintenance */
  isMaintenance() {
    return Boolean(this.auth?.["maintenance"]);
  }

  /** Whether the drop has blocked the account */
  isBlocked() {
    return Boolean(this.auth?.["blocked"] || this.dashboard?.["blocked"]);
  }

  /** Whether the account can be played right now */
  isPlayable() {
    return this.isRegistered() && !this.isMaintenance() && !this.isBlocked();
  }

  /** Why the account cannot be played, or null when it can */
  unplayableReason() {
    if (this.isBlocked()) return "The account is blocked.";
    if (this.isMaintenance()) return "LootVault is under maintenance.";
    if (!this.isRegistered()) {
      return "Not registered, connect a wallet to register.";
    }

    return null;
  }

  /** The current level */
  level() {
    return Number(this.dashboard?.["lvl"]) || 0;
  }

  /** The app balance, in LOOT */
  balance() {
    return fromNano(this.dashboard?.["b"] ?? this.balances?.["mined"]);
  }

  /** The LOOT held in the bound wallet, as the drop counts it */
  holding() {
    return fromNano(this.balances?.["onchain"] ?? this.dashboard?.["hold"]);
  }

  /** What has been mined since the last collect, projected to now, in nano */
  pendingMined() {
    const dashboard = this.dashboard;

    if (!dashboard?.["lm"]) return 0;

    const ratePerMs = Number(dashboard["r"]) / 36e5;
    const elapsed =
      Number(dashboard["ts"] || this.readAt) -
      Number(dashboard["lm"]) +
      (Date.now() - this.readAt);

    return Math.max(0, ratePerMs * elapsed);
  }
}
