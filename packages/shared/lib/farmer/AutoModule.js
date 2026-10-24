import FarmerModule from "./FarmerModule.js";

/** A drop's side of the Auto contract, which the farmer's Auto methods delegate to */
export default class AutoModule extends FarmerModule {
  /** Link a TON wallet to the account and refresh the drop's view of it
   * @param {object} wallet - { phrase, address, version, refresh }
   * @returns {Promise<{ status: boolean, summary?: object, message?: string }>}
   */
  connectWallet(wallet) {
    return this.ctx.connector.connect(wallet);
  }

  /** Settle the drop's one-time wallet verification, for drops whose descriptor is `verifiable`
   * @param {object} wallet - { phrase, version, apiKey? }
   * @returns {Promise<{ status: boolean, skipped?: boolean, message?: string, summary?: object }>}
   */
  async verifyWallet(wallet) {
    throw new Error("verifyAutoWallet method must be implemented in subclass");
  }

  /** Claim whatever is pending so the next summary reflects current balances */
  async refreshState() {
    throw new Error("refreshAutoState method must be implemented in subclass");
  }

  /** Re-read the account and return a fresh summary, defaulting to claim-then-snapshot
   * @returns {Promise<object>} - see `summary`
   */
  async refreshSummary() {
    await this.refreshState();
    return this.summary();
  }

  /** Put the account to work at the holding it now has, and report it afresh
   * @returns {Promise<object>} - see `summary`
   */
  startMining() {
    return this.refreshSummary();
  }

  /** Normalized account snapshot shared by every Auto drop, without `mining` for drops that mine off the clock
   * @returns {object} - {
   *   level, holding, balance, minWithdrawal, verified,
   *   protection: { revoked, dexBuyer } | undefined,
   *   mining: { startedAt, freezesAt, frozen } | undefined,
   *   wallet: { address, version } | null,
   *   exchange: { name, uid } | null | undefined,
   *   banned, banReason,
   *   risk: { score, updatedAt, flags: string[] }
   * }
   */
  summary() {
    throw new Error("getAutoSummary method must be implemented in subclass");
  }

  /** Whether the drop still owes this account a settlement
   * @returns {Promise<boolean>}
   */
  hasPendingWithdrawal() {
    return this.ctx.withdrawals.hasPending();
  }

  /** Both withdrawal gates for this account
   * @returns {Promise<{ pending: boolean, flagged: boolean }>}
   */
  async withdrawalGuard() {
    return { pending: await this.hasPendingWithdrawal(), flagged: false };
  }
}
