import FarmerModule from "../../lib/farmer/FarmerModule.js";
import { formatAmount, logCurrentUser } from "../../lib/farmer/format.js";
import {
  GRAM_CURRENCY,
  MINIMUM_WITHDRAWAL,
  UNSURE_WITHDRAWAL_STATUSES,
  WITHDRAWAL_DECIMALS,
} from "./constants.js";

/** GRAM withdrawals to the linked wallet and the pending queue */
export default class MyAgeWithdrawal extends FarmerModule {
  /** The tasks the drop wants done before a withdrawal, as it last listed them */
  needs = [];

  /** The drop sends its minimum with the session */
  getMinimumWithdrawal() {
    const minimum = this.ctx.state.part("withdraw")["min"];

    return Number(minimum) || MINIMUM_WITHDRAWAL;
  }

  /** The account's withdrawals, keeping the tasks a withdrawal needs */
  async getWithdrawals() {
    const result = await this.ctx.api.fetchWithdrawals();

    this.needs = result["needs"] || [];

    return result["withdrawals"] || [];
  }

  /** The tasks still open before a withdrawal */
  openNeeds() {
    return this.needs.filter((need) => !need["done"]);
  }

  /** Whether a failed request may still have gone through */
  isUnsure(error) {
    const status = Number(error.status) || 0;

    return status >= 500 || UNSURE_WITHDRAWAL_STATUSES.has(status);
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

    /* One withdrawal at a time, to the linked wallet */
    const pending = await this.ctx.withdrawals.pending();
    const refusal = this.getRefusal(pending);

    if (refusal) {
      return this.ctx.flow.skip(refusal, { log: "warn" });
    }

    /* The balance must reach the minimum */
    const balance = this.ctx.state.gram();
    const minimum = this.getMinimumWithdrawal();
    const lowBalance = this.ctx.flow.skipLowBalance(balance, minimum);

    if (lowBalance) return lowBalance;

    /* The drop checks the channels again on every request */
    for (const need of this.openNeeds()) {
      this.logger.warn(`Withdrawal needs "${need["title"]}" first.`);
    }

    const amount = this.ctx.flow.pickAmount({
      balance,
      minimum,
      max,
      difference,
      decimals: WITHDRAWAL_DECIMALS,
    });
    const destination = this.ctx.wallet.getConnectedWalletAddress();

    try {
      const result = await this.request(amount.toNumber());

      /* A replay may have been paid before, so read the balance back */
      await this.ctx.state.load();

      this.logger.success(
        `Requested ${formatAmount(result["gram"])} ${GRAM_CURRENCY}.`,
      );
      this.logger.keyValue("Destination", destination);

      await this.ctx.flow.notify([
        ["Initial Balance", `${balance.toString()} ${GRAM_CURRENCY}`],
        ["Requested", `${amount.toString()} ${GRAM_CURRENCY}`],
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

  /** Request a withdrawal, repeating once under the same key when the answer was lost */
  async request(gram) {
    const key = crypto.randomUUID();

    try {
      return await this.ctx.api.requestWithdrawal(gram, key);
    } catch (error) {
      if (!this.isUnsure(error)) throw error;

      /* The same key makes the drop replay its first answer, not queue a second withdrawal */
      this.logger.warn("No sure answer, asking again:", error.message);
      await this.utils.delayForSeconds(5, { signal: this.signal });

      return this.ctx.api.requestWithdrawal(gram, key);
    }
  }

  /** Log the rules and the payouts the drop has not settled yet */
  async logStatus() {
    await this.ctx.state.ensureLoaded();

    const pending = await this.ctx.withdrawals.pending();

    this.logger.newline();
    logCurrentUser(this.logger, this.core.telegramUser());
    this.logger.keyValue(
      "Balance",
      `${formatAmount(this.ctx.state.gram())} ${GRAM_CURRENCY}`,
    );
    this.logger.keyValue(
      "Minimum",
      `${this.getMinimumWithdrawal()} ${GRAM_CURRENCY}`,
    );
    this.logger.keyValue("Open Needs", this.openNeeds().length, {
      valueStyle: this.openNeeds().length
        ? this.logger.c.yellowBright
        : this.logger.c.greenBright,
    });
    this.logger.keyValue("Pending Withdrawals", pending.length, {
      valueStyle: pending.length
        ? this.logger.c.yellowBright
        : this.logger.c.greenBright,
    });

    for (const item of pending) {
      this.logger.newline();
      this.logger.keyValue(
        "Amount",
        `${formatAmount(item["gram"])} ${GRAM_CURRENCY}`,
      );
      this.logger.keyValue("Status", item["status"]);
      this.logger.keyValue(
        "Requested",
        new Date(item["createdAt"]).toLocaleString(),
      );
    }

    return { status: true, pending };
  }
}
