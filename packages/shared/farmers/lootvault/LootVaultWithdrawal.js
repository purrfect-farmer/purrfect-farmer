import FarmerModule from "../../lib/farmer/FarmerModule.js";
import { formatAmount, logCurrentUser } from "../../lib/farmer/format.js";
import { LOOT_TOKEN, MINIMUM_WITHDRAWAL } from "./constants.js";
import { fromNano } from "./loot.js";
import Decimal from "decimal.js";

/** Withdrawal rules, payouts and the pending queue */
export default class LootVaultWithdrawal extends FarmerModule {
  /** The rules, cooldown, pending claim and history, as last read */
  info = null;

  /** Re-read the withdrawal info */
  async load() {
    this.info = await this.ctx.api.fetchWithdrawals();
    return this.info;
  }

  /** The drop publishes its minimum with the withdrawal info */
  getMinimumWithdrawal() {
    return Number(this.info?.["minAmount"]) || MINIMUM_WITHDRAWAL;
  }

  /** The account's withdrawals */
  async getWithdrawals() {
    return (await this.load())["history"] || [];
  }

  /** The app balance the drop lets the account withdraw */
  getBalance() {
    return this.info["balanceLoot"] !== undefined
      ? new Decimal(this.info["balanceLoot"] || 0)
      : fromNano(this.info["balance"]);
  }

  /** Why the account cannot withdraw now, or null when it can */
  getRefusal(pending) {
    if (!this.ctx.wallet.getConnectedWalletAddress()) {
      return "No wallet connected!";
    }

    if (this.info["pendingClaim"] || pending.length) {
      return "A withdrawal is already pending!";
    }

    if (!this.info["canWithdraw"]) {
      const hours = (Number(this.info["timeLeftMs"]) || 0) / 36e5;

      return `Withdrawal cooldown, ${hours.toFixed(1)}h left!`;
    }

    return null;
  }

  /** Place withdrawal */
  async place({ max, difference }) {
    await this.ctx.state.ensureLoaded();

    /** Reading the history re-reads the rules and cooldown with it */
    const pending = await this.ctx.withdrawals.pending();
    const refusal = this.getRefusal(pending);

    if (refusal) {
      return this.ctx.flow.skip(refusal, { log: "warn" });
    }

    const balance = this.getBalance();
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
      const result = await this.ctx.api.requestWithdrawal(amount.toNumber());

      this.logger.success(
        `Requested ${amount.toString()} ${LOOT_TOKEN} (claim #${result["claimId"]}).`,
      );
      this.logger.keyValue("Destination", destination);

      await this.ctx.flow.notify([
        ["Initial Balance", balance.toString()],
        ["Requested", amount.toString()],
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

    const pending = await this.ctx.withdrawals.pending();
    const info = this.info;

    this.logger.newline();
    logCurrentUser(this.logger, this.core.telegramUser());
    this.logger.keyValue("Balance", formatAmount(this.getBalance()));
    this.logger.keyValue("Minimum", this.getMinimumWithdrawal());
    this.logger.keyValue("Fee", `${info["feePercent"]}%`);
    this.logger.keyValue("Can Withdraw", info["canWithdraw"] ? "Yes" : "No", {
      valueStyle: info["canWithdraw"]
        ? this.logger.c.greenBright
        : this.logger.c.yellowBright,
    });
    this.logger.keyValue("Pending Withdrawals", pending.length, {
      valueStyle: pending.length
        ? this.logger.c.yellowBright
        : this.logger.c.greenBright,
    });

    for (const item of pending) {
      this.logger.newline();
      this.logger.keyValue("Amount", `${item["amount"]} ${LOOT_TOKEN}`);
      this.logger.keyValue("Net", `${item["net"]} ${LOOT_TOKEN}`);
      this.logger.keyValue(
        "Requested",
        new Date(item["createdAt"]).toLocaleString(),
      );
    }

    return { status: true, pending };
  }
}
