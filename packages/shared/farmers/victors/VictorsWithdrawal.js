import FarmerModule from "../../lib/farmer/FarmerModule.js";
import { formatAmount, logCurrentUser } from "../../lib/farmer/format.js";
import { MINIMUM_WITHDRAWAL, WITHDRAWAL_FEE } from "./constants.js";
import Decimal from "decimal.js";

/** Withdrawal rules, payouts and the pending queue */
export default class VictorsWithdrawal extends FarmerModule {
  /** The drop publishes its minimum in its config */
  getMinimumWithdrawal() {
    return Number(this.ctx.state.config()["withdrawMin"]) || MINIMUM_WITHDRAWAL;
  }

  /** The on-chain VIC the drop wants held before it pays out */
  getMinimumHolding() {
    return Number(this.ctx.state.config()["withdrawMinHolding"]) || 0;
  }

  /** Whether the on-chain holding clears the minimum, with the page's 1 VIC slack */
  hasMinimumHolding() {
    return (
      Number(this.ctx.state.user()["walletBalance"] || 0) >=
      this.getMinimumHolding() - 1
    );
  }

  /** The flat fee taken off each payout */
  getWithdrawalFee() {
    return Number(this.ctx.state.config()["withdrawFee"] ?? WITHDRAWAL_FEE);
  }

  /** Whether the drop will let this account withdraw */
  isWithdrawalEligible() {
    const verify = this.ctx.state.verify();
    const ageDays = verify["walletAgeDays"];

    return (
      Boolean(verify["verified"]) &&
      !verify["underReview"] &&
      ageDays !== null &&
      ageDays !== undefined &&
      Number(ageDays) >= Number(verify["minWalletAgeDays"] || 0) &&
      this.hasMinimumHolding()
    );
  }

  /** The account's withdrawals among its newest history rows */
  async getWithdrawals() {
    const transactions = await this.ctx.api.fetchTransactions();

    return transactions.filter((item) => item["type"] === "Withdraw");
  }

  /** The withdrawals the drop has not settled yet */
  getPendingWithdrawals() {
    return this.ctx.withdrawals.pending();
  }

  /** Place withdrawal */
  async place({ max, difference }) {
    await this.ctx.state.ensureLoaded();

    const user = this.ctx.state.user();
    const destinationAddress = this.ctx.wallet.getConnectedWalletAddress();

    if (!destinationAddress) {
      return this.ctx.flow.skip("No wallet connected!");
    }

    if (!this.isWithdrawalEligible()) {
      const verify = this.ctx.state.verify();
      const message = !verify["verified"]
        ? "Wallet is not verified!"
        : Number(verify["walletAgeDays"] ?? -1) <
            Number(verify["minWalletAgeDays"] || 0)
          ? `Wallet is younger than ${verify["minWalletAgeDays"]} days!`
          : verify["underReview"]
            ? "Wallet is under review!"
            : `Wallet holds ${Math.floor(Number(user["walletBalance"] || 0))} VIC on-chain, needs ${this.getMinimumHolding()}!`;

      return this.ctx.flow.skip(message, { log: "warn" });
    }

    if ((await this.getPendingWithdrawals()).length > 0) {
      return this.ctx.flow.skip("A withdrawal is already pending!", {
        log: "warn",
      });
    }

    const balance = new Decimal(user["inAppBalance"] || 0);
    const minimum = this.getMinimumWithdrawal();
    const lowBalance = this.ctx.flow.skipLowBalance(balance, minimum);

    if (lowBalance) return lowBalance;

    const amount = this.ctx.flow.pickAmount({
      balance,
      minimum,
      max,
      difference,
      ceiling: Number(this.ctx.state.config()["withdrawMax"]) || 0,
    });

    /** Read before the request, while the state still holds the pre-payout holding */
    this.logLevelAfterWithdrawal(amount);

    const result = await this.ctx.api.requestWithdrawal(amount);
    const status = result?.["success"] !== false;
    const message = result?.["error"] || result?.["message"] || "";

    if (status) {
      this.ctx.state.apply(result);

      this.logger.success(
        `Requested ${amount.toString()} VIC${result["autoApproved"] ? ", auto-approved" : ""}.`,
      );
      this.logger.keyValue("Destination", destinationAddress);
      this.logger.keyValue(
        "To be received",
        Decimal.max(amount.minus(this.getWithdrawalFee()), 0).toString(),
      );

      await this.ctx.flow.notify([
        ["Initial Balance", balance.toString()],
        ["Requested", amount.toString()],
        ["Destination", `<code>${destinationAddress}</code>`],
      ]);
    } else {
      this.logger.error("Failed to request withdrawal:", message);
    }

    return {
      status,
      message,
      result,
      skipped: false,
      amount: amount.toString(),
    };
  }

  /** Warn when a payout takes the holding below the active level, as the page does */
  logLevelAfterWithdrawal(amount) {
    const activeLevel = Number(this.ctx.state.mining()["level"]) || 0;
    const holding = new Decimal(this.ctx.state.data["holding"] || 0).minus(
      amount,
    );
    const levelAfter = this.ctx.mining.findLevelForHolding(
      Decimal.max(holding, 0).toNumber(),
      Boolean(this.ctx.wallet.getConnectedWalletAddress()),
    );

    if (levelAfter < activeLevel) {
      this.logger.keyValue("Level After", `${activeLevel} → ${levelAfter}`, {
        valueStyle: this.logger.c.yellowBright,
      });
    }
  }

  /** Log the payouts the drop has not settled yet */
  async logStatus() {
    await this.ctx.state.ensureLoaded();

    const pending = await this.getPendingWithdrawals();
    const verify = this.ctx.state.verify();

    this.logger.newline();
    logCurrentUser(this.logger, this.core.telegramUser());
    this.logger.keyValue(
      "Balance",
      formatAmount(this.ctx.state.user()["inAppBalance"]),
    );
    this.logger.keyValue("Minimum", this.getMinimumWithdrawal());
    this.logger.keyValue("Fee", this.getWithdrawalFee());
    this.logger.keyValue(
      "Holding",
      `${formatAmount(this.ctx.state.user()["walletBalance"])} / ${this.getMinimumHolding()}`,
    );
    this.logger.keyValue(
      "Eligible",
      this.isWithdrawalEligible() ? "Yes" : "No",
      {
        valueStyle: this.isWithdrawalEligible()
          ? this.logger.c.greenBright
          : this.logger.c.yellowBright,
      },
    );
    this.logger.keyValue(
      "Wallet Age",
      `${verify["walletAgeDays"] ?? "?"} / ${verify["minWalletAgeDays"]} days`,
    );
    this.logger.keyValue("Pending Withdrawals", pending.length, {
      valueStyle: pending.length
        ? this.logger.c.yellowBright
        : this.logger.c.greenBright,
    });

    if (!pending.length) {
      this.logger.success("No withdrawal is awaiting processing.");
      return { status: true, pending };
    }

    for (const item of pending) {
      this.logger.newline();
      this.logger.keyValue("Amount", item["amount"]);
      this.logger.keyValue("Status", item["status"]);
      this.logger.keyValue(
        "Requested",
        new Date(item["createdAt"]).toLocaleString(),
      );
    }

    return { status: true, pending };
  }
}
