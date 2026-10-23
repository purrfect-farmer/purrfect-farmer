/** Categories a withdrawal row can fall into */
export const WITHDRAWAL_CATEGORY = Object.freeze({
  PENDING: "pending",
  APPROVED: "approved",
  FLAGGED: "flagged",
});

const DEFAULT_CATEGORIES = Object.freeze(Object.values(WITHDRAWAL_CATEGORY));

/**
 * Build a row classifier from status lists.
 *
 * @param {object} options
 * @param {string[]} [options.pending] - statuses still owed
 * @param {string[]} [options.approved] - statuses paid out
 * @param {string[]} [options.flagged] - statuses refused or failed
 * @param {string|null} [options.otherwise] - category for any other status
 * @param {(status: string) => string} [options.normalize] - applied to a status before matching
 * @returns {(row: object) => string|null}
 */
export function statusClassifier({
  pending = [],
  approved = [],
  flagged = [],
  otherwise = null,
  normalize = (status) => status,
}) {
  const categoryOf = new Map();

  for (const [category, statuses] of [
    [WITHDRAWAL_CATEGORY.PENDING, pending],
    [WITHDRAWAL_CATEGORY.APPROVED, approved],
    [WITHDRAWAL_CATEGORY.FLAGGED, flagged],
  ]) {
    for (const status of statuses) categoryOf.set(status, category);
  }

  return (row) => categoryOf.get(normalize(row["status"])) ?? otherwise;
}

/** A drop's withdrawal history, split into what is owed, paid and refused */
export default class WithdrawalQueue {
  /**
   * @param {object} options
   * @param {() => object[] | Promise<object[]>} options.read - the drop's withdrawal rows
   * @param {(row: object) => string|null} options.classify - a row's category
   * @param {string[]} [options.categories] - the categories reported
   * @param {() => Promise<void>} [options.prepare] - run before the queue is read
   * @param {() => Promise<boolean>} [options.hasActive] - a drop-level flag for a payout in flight
   */
  constructor({
    read,
    classify,
    categories = DEFAULT_CATEGORIES,
    prepare = null,
    hasActive = null,
  }) {
    this.read = read;
    this.classify = classify;
    this.categories = categories;
    this.prepare = prepare;
    this.hasActive = hasActive;
  }

  /** Split rows by category, keeping their order */
  split(rows) {
    const result = Object.fromEntries(
      this.categories.map((category) => [category, []]),
    );

    for (const row of rows) {
      result[this.classify(row)]?.push(row);
    }

    return result;
  }

  /** The rows still owed */
  pendingOf(rows) {
    return rows.filter(
      (row) => this.classify(row) === WITHDRAWAL_CATEGORY.PENDING,
    );
  }

  /** Read the rows still owed */
  async pending() {
    return this.pendingOf(await this.read());
  }

  /** Whether the drop still owes a payout */
  async hasPending() {
    await this.prepare?.();

    if (await this.hasActive?.()) return true;

    return (await this.pending()).length > 0;
  }

  /** Read the whole queue, split by category */
  async load() {
    await this.prepare?.();

    return this.split(await this.read());
  }
}
