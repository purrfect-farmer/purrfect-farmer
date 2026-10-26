import FarmerModule from "../../lib/farmer/FarmerModule.js";
import { formatAmount, logCurrentUser } from "../../lib/farmer/format.js";
import {
  MINIMUM_WITHDRAWAL,
  PXE_TOKEN,
  WITHDRAWAL_FEES,
  WITHDRAWAL_FORM_MS,
} from "./constants.js";

/** Withdrawal rules, payouts and the pending queue */
export default class PickaxeWithdrawal extends FarmerModule {
  /** The drop's public settings, read once */
  config = null;

  /** Read the drop's settings once, for the live minimum */
  async loadConfig() {
    return (this.config ||= await this.ctx.api.fetchConfig());
  }

  /** The drop publishes its minimum with its settings */
  getMinimumWithdrawal() {
    return Number(this.config?.["minWithdraw"]) || MINIMUM_WITHDRAWAL;
  }

  /** The fee kept from a withdrawal of `amount` */
  getFee(amount) {
    const row =
      WITHDRAWAL_FEES.find((fee) => amount >= fee.from) ||
      WITHDRAWAL_FEES.at(-1);

    return row.fee;
  }

  /** The account's withdrawals */
  getWithdrawals() {
    return this.ctx.state.data?.["withdrawals"] || [];
  }

  /** How long the page's withdrawal form stays open before submitting */
  formMs() {
    const { MIN, MAX } = WITHDRAWAL_FORM_MS;

    return MIN + Math.floor(Math.random() * (MAX - MIN));
  }

  /** Why the account cannot withdraw now, or null when it can */
  getRefusal(pending) {
    if (!this.ctx.wallet.getConnectedWalletAddress()) {
      return "No wallet connected!";
    }

    if (pending.length) {
      return "A withdrawal is already pending!";
    }

    return null;
  }

  /** Place withdrawal */
  async place({ max, difference }) {
    await this.ctx.state.ensureLoaded();
    await this.loadConfig();

    const pending = await this.ctx.withdrawals.pending();
    const refusal = this.getRefusal(pending);

    if (refusal) {
      return this.ctx.flow.skip(refusal, { log: "warn" });
    }

    const balance = this.ctx.state.balance();
    const minimum = this.getMinimumWithdrawal();
    const lowBalance = this.ctx.flow.skipLowBalance(balance, minimum);

    if (lowBalance) return lowBalance;

    const amount = this.ctx.flow.pickAmount({
      balance,
      minimum,
      max,
      difference,
    });
    const destination = this.ctx.wallet.getConnectedWalletAddress();

    try {
      const result = this.ctx.state.apply(
        await this.ctx.api.requestWithdrawal({
          amount: amount.toNumber(),
          formMs: this.formMs(),
        }),
      );
      const net = result["net"] ?? result["withdrawn"];

      this.logger.success(
        `Requested ${amount.toString()} ${PXE_TOKEN}, receiving ${net} ${PXE_TOKEN}.`,
      );
      this.logger.keyValue("Destination", destination);

      await this.ctx.flow.notify([
        ["Initial Balance", balance.toString()],
        ["Requested", amount.toString()],
        ["Receiving", String(net)],
        ["Destination", `<code>${destination}</code>`],
      ]);

      return { status: true, skipped: false, amount: amount.toString() };
    } catch (error) {
      this.logger.error("Failed to request withdrawal:", error.message);

      return {
        status: false,
        skipped: false,
        message: error.message,
        amount: amount.toString(),
      };
    }
  }

  /** Log the rules and the payouts the drop has not settled yet */
  async logStatus() {
    await this.ctx.state.ensureLoaded();
    await this.loadConfig();

    const pending = await this.ctx.withdrawals.pending();
    const minimum = this.getMinimumWithdrawal();

    this.logger.newline();
    logCurrentUser(this.logger, this.core.telegramUser());
    this.logger.keyValue("Balance", formatAmount(this.ctx.state.balance()));
    this.logger.keyValue("Minimum", minimum);
    this.logger.keyValue("Fee", `${this.getFee(minimum)} ${PXE_TOKEN}`);
    this.logger.keyValue("Pending Withdrawals", pending.length, {
      valueStyle: pending.length
        ? this.logger.c.yellowBright
        : this.logger.c.greenBright,
    });

    for (const item of pending) {
      this.logger.newline();
      this.logger.keyValue("Amount", `${item["amount"]} ${PXE_TOKEN}`);
      this.logger.keyValue("Net", `${item["net"]} ${PXE_TOKEN}`);
      this.logger.keyValue("Status", item["status"]);
      this.logger.keyValue(
        "Requested",
        new Date(item["created_at"]).toLocaleString(),
      );
    }

    return { status: true, pending };
  }
}
