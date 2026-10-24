import FarmerModule from "../../lib/farmer/FarmerModule.js";
import { MAXIMUM_WITHDRAWAL } from "./constants.js";

/** Payouts and the pending queue */
export default class MonsterlandWithdrawal extends FarmerModule {
  /** Request a payout */
  async place({ max, difference }) {
    await this.ctx.state.ensureLoaded();

    const payments = this.ctx.state.profile()["payments"] || {};

    if (!payments["wallet"]) {
      return this.ctx.flow.skip("No wallet connected!");
    }

    const config = await this.ctx.api.fetchConfig();
    const minimum = this.getMinimumWithdrawal();
    const quota = config["withdraw_quota"] || {};
    const remaining = Number(
      quota["remaining_lumis"] ?? quota["remainingLumis"] ?? quota["cap_lumis"],
    );
    const maximum =
      Number(config["max_withdrawal_lumis"]) || MAXIMUM_WITHDRAWAL;
    const balance = this.ctx.state.lumis();
    const lowBalance = this.ctx.flow.skipLowBalance(balance, minimum);

    if (lowBalance) return lowBalance;

    if (Number.isFinite(remaining) && remaining < minimum) {
      return this.ctx.flow.skip("Withdrawal quota is used up!", {
        log: "warn",
      });
    }

    const amount = Math.floor(
      Number(
        this.ctx.flow.pickAmount({
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

    const result = await this.ctx.api.requestWithdrawal(amount);

    if (result.data["status"] === "requires_reconciliation") {
      return this.ctx.flow.skip(
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
      return this.ctx.flow.skip(
        "Withdrawal was replayed but is still unconfirmed, check the app!",
        { amount, log: "warn" },
      );
    }

    this.ctx.state.apply(result.data);
    this.logger.success(`Requested a withdrawal of ${amount} lumis.`);

    await this.ctx.flow.notify([
      ["Initial Balance", `${balance} lumis`],
      ["Requested", `${amount} lumis`],
      ["Destination", `<code>${payments["wallet"]}</code>`],
    ]);

    return { status: true, amount: String(amount) };
  }

  /** The game publishes its minimum in its config */
  getMinimumWithdrawal() {
    return (
      Number(this.ctx.state.config?.["min_withdrawal_lumis"]) ||
      this.ctx.flow.declaredMinimum()
    );
  }

  /** Payout rows from the payment history, newest first */
  async getWithdrawals() {
    const history = await this.ctx.api.fetchPaymentHistory();

    return history.filter((item) => item["type"] === "withdrawal");
  }
}
