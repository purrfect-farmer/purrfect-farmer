import {
  FLAGGED_WITHDRAWAL_STATUSES,
  MAXIMUM_WITHDRAWAL,
  SETTLED_WITHDRAWAL_STATUSES,
} from "./constants.js";
import MonsterlandGrowth from "./MonsterlandGrowth.js";

/** Payouts and the pending queue */
export default class MonsterlandWithdrawal extends MonsterlandGrowth {
  /* --------------------------------------------------------------------- */
  /* Withdrawal                                                            */
  /* --------------------------------------------------------------------- */

  /** Request a payout */
  async placeWithdrawal({ max, difference }) {
    await this.ensureStateLoaded();

    const payments = this.getProfile()["payments"] || {};

    if (!payments["wallet"]) {
      return this.skipWithdrawal("No wallet connected!");
    }

    const config = await this.fetchConfig();
    const minimum = this.getMinimumWithdrawal();
    const quota = config["withdraw_quota"] || {};
    const remaining = Number(
      quota["remaining_lumis"] ?? quota["remainingLumis"] ?? quota["cap_lumis"],
    );
    const maximum =
      Number(config["max_withdrawal_lumis"]) || MAXIMUM_WITHDRAWAL;
    const balance = this.getLumis();
    const lowBalance = this.skipLowBalance(balance, minimum);

    if (lowBalance) return lowBalance;

    if (Number.isFinite(remaining) && remaining < minimum) {
      return this.skipWithdrawal("Withdrawal quota is used up!", {
        log: "warn",
      });
    }

    const amount = Math.floor(
      Number(
        this.pickWithdrawalAmount({
          balance,
          minimum,
          max,
          difference,
          ceiling: Number.isFinite(remaining)
            ? Math.min(remaining, maximum)
            : maximum,
        }),
      ),
    );

    const result = await this.requestWithdrawal(amount);

    if (result.data["status"] === "requires_reconciliation") {
      return this.skipWithdrawal(
        "Monsterland wants the balance reconciled first, do it in the app!",
        { amount, log: "warn" },
      );
    }

    if (!result.ok || !result.data["success"]) {
      const message = result.data["error"] || "Withdrawal failed";

      this.logger.error("Failed to withdraw:", message);
      return { status: false, message, amount: String(amount) };
    }

    /** The page treats a replay with no real tx as not done */
    if (
      result.data["idempotent"] &&
      (!result.data["txId"] || result.data["txId"] === "pending")
    ) {
      return this.skipWithdrawal(
        "Withdrawal was replayed but is still unconfirmed, check the app!",
        { amount, log: "warn" },
      );
    }

    this.applyResult(result.data);
    this.logger.success(`Requested a withdrawal of ${amount} lumis.`);

    return { status: true, amount: String(amount) };
  }

  /** The game publishes its minimum in its config */
  getMinimumWithdrawal() {
    return (
      Number(this.config_data?.["min_withdrawal_lumis"]) ||
      super.getMinimumWithdrawal()
    );
  }

  /** Payout rows from the payment history, newest first */
  async getWithdrawals() {
    const history = await this.fetchPaymentHistory();

    return history.filter((item) => item["type"] === "withdrawal");
  }

  /** Whether the game still owes this account a payout */
  async hasPendingWithdrawal() {
    const withdrawals = await this.getWithdrawals();

    return withdrawals.some((item) => this.isPendingWithdrawal(item));
  }

  /** Anything not settled or refused is still in flight, `processing` and `pending_approval` included */
  isPendingWithdrawal(item) {
    const status = String(item["status"] || "");

    return (
      !SETTLED_WITHDRAWAL_STATUSES.includes(status) &&
      !FLAGGED_WITHDRAWAL_STATUSES.includes(status)
    );
  }

  /** The account's own withdrawal queue */
  async getAutoWithdrawals() {
    const withdrawals = await this.getWithdrawals();

    return {
      pending: withdrawals.filter((item) => this.isPendingWithdrawal(item)),
      approved: withdrawals.filter((item) =>
        SETTLED_WITHDRAWAL_STATUSES.includes(item["status"]),
      ),
      flagged: withdrawals.filter((item) =>
        FLAGGED_WITHDRAWAL_STATUSES.includes(item["status"]),
      ),
    };
  }
}
