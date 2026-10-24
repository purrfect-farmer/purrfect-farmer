/** How many withdrawal records of each kind the snapshot carries */
export const SNAPSHOT_WITHDRAWAL_LIMIT = 2;

/** What an Auto account looks like right now, as stored for the Auto system */
export default class AutoSnapshot {
  /**
   * @param {object} options
   * @param {ReturnType<import("./createFarmerCore.js").default>} options.core
   * @param {() => object} options.summary - the drop's normalized account summary
   * @param {() => Promise<{ pending: object[], approved?: object[], flagged: object[] } | null>} options.withdrawals - the account's own withdrawal queue
   */
  constructor({ core, summary, withdrawals }) {
    this.core = core;
    this.summary = summary;
    this.withdrawals = withdrawals;
  }

  /** Persist what this account looks like right now
   * @returns {Promise<object>} - the snapshot that was stored
   */
  async store() {
    /** Reading the queue may load what the summary reads, such as the drop's minimum */
    const withdrawal = await this.readWithdrawals();
    const snapshot = {
      ...this.summary(),
      withdrawal,
      updatedAt: Date.now(),
    };

    try {
      await this.core.storage.set("autoSnapshot", snapshot);
    } catch (error) {
      this.core.logger.warn(
        "Failed to store the account snapshot:",
        error.message,
      );
    }

    return snapshot;
  }

  /** The withdrawal queue as the snapshot carries it, or null when unknown
   * `approved` is a count rather than records, and null when the drop does not count them
   * @returns {Promise<{ pending: object[], approved: number|null, flagged: object[], checkedAt: number } | null>}
   */
  async readWithdrawals() {
    try {
      const result = await this.withdrawals();

      if (!result) return null;

      return {
        pending: (result.pending || []).slice(0, SNAPSHOT_WITHDRAWAL_LIMIT),
        approved: Array.isArray(result.approved)
          ? result.approved.length
          : null,
        flagged: (result.flagged || []).slice(0, SNAPSHOT_WITHDRAWAL_LIMIT),
        checkedAt: Date.now(),
      };
    } catch (error) {
      this.core.logger.warn(
        "Failed to read the withdrawal queue:",
        error.message,
      );
      return null;
    }
  }
}
