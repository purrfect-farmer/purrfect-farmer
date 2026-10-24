import Decimal from "decimal.js";
import { formatAccountLink } from "./format.js";

/** The steps every drop's withdrawal shares, around the drop's own `place` */
export default class WithdrawalFlow {
  /**
   * @param {object} options
   * @param {ReturnType<import("./createFarmerCore.js").default>} options.core
   * @param {(options: { max?: number, difference: number }) => Promise<object>} options.place - places a forced withdrawal
   * @param {() => number} [options.minimum] - the live minimum, defaulting to the Auto descriptor's
   * @param {() => Promise<any>} [options.logStatus] - logs what the drop has not settled yet
   */
  constructor({ core, place, minimum = null, logStatus = null }) {
    this.core = core;
    this.place = place;
    this.readMinimum = minimum;
    this.logStatus = logStatus;
  }

  /** The drop's token symbol, as its Auto descriptor names it */
  token() {
    return this.core.drop.auto?.token || "";
  }

  /** The drop's declared minimum withdrawal */
  declaredMinimum() {
    return Number(this.core.drop.auto?.minWithdrawal ?? 0);
  }

  /** The minimum a withdrawal must reach */
  minimum() {
    return this.readMinimum ? this.readMinimum() : this.declaredMinimum();
  }

  /** A withdrawal that was not attempted, shaped as `withdraw` returns it and logged at `log` unless that is null */
  skip(message, { amount = "0", log = "error" } = {}) {
    if (log) {
      this.core.logger[log](message);
    }

    return { status: false, skipped: true, message, amount: String(amount) };
  }

  /** A balance below the minimum as a skip, otherwise null after logging what is available */
  skipLowBalance(balance, minimum) {
    if (new Decimal(balance).lessThan(minimum)) {
      this.core.logger.error("Not enough balance:", String(balance));
      return this.skip("Not enough balance!", { amount: balance, log: null });
    }

    this.core.logger.info("Available balance:", String(balance));

    return null;
  }

  /** The amount to request: capped, shaved by a random `difference` percent, then floored at the minimum */
  pickAmount({ balance, minimum, max, difference = 0, ceiling }) {
    let amount = new Decimal(balance);

    /** Cap to the drop's ceiling */
    if (ceiling > 0) {
      amount = Decimal.min(amount, ceiling);
    }

    /** Cap to max */
    if (max) {
      amount = Decimal.min(amount, max);
    }

    /** Apply difference */
    if (difference > 0) {
      const minPercent = new Decimal(100).minus(difference);
      const randomPercent = minPercent
        .plus(new Decimal(Math.random()).mul(difference + 1))
        .clamp(minPercent, 100);

      amount = amount.mul(randomPercent).div(100);
    }

    /** Reset amount to minimum, never past the balance */
    return Decimal.min(Decimal.max(amount, minimum), balance).floor();
  }

  /** Tell the admin about a withdrawal, but only when the run was initiated by the scheduler
   * @param {[string, string][]} rows - label and HTML value, after the account row
   */
  async notify(rows) {
    if (!this.core.scheduled) return;

    await this.core.notifyAdmin([
      `<b>🤑 ${this.token()} Withdrawal</b>`,
      `<b>Account</b>: ${formatAccountLink(this.core.userId())}`,
      ...rows.map(([label, value]) => `<b>${label}</b>: ${value}`),
    ]);
  }

  /** Withdraw, prompting for the amount */
  async withdrawInteractive() {
    await this.logStatus?.();

    const token = this.token();
    const input = await this.core.prompt(
      `How much ${token}? (minimum ${this.minimum()})`,
    );
    const trimmed = (input || "").trim();

    if (!trimmed) {
      this.core.logger.warn("No amount provided.");
      return;
    }

    const amount = Number(trimmed);

    if (!Number.isFinite(amount) || amount <= 0) {
      this.core.logger.error(`Invalid ${token} amount:`, trimmed);
      return;
    }

    return this.withdraw({ max: amount, difference: 0, force: true });
  }

  /** Request a withdrawal, only when forced (auto or the Withdraw tool), skipping quietly otherwise
   * @returns {Promise<{ status: boolean, skipped: boolean, amount: string, message: string }>}
   */
  async withdraw({ force = false, max, difference = 20 } = {}) {
    if (!force) {
      return this.skip("Withdrawal is disabled unless requested!", {
        log: null,
      });
    }

    return this.place({ max, difference });
  }
}
