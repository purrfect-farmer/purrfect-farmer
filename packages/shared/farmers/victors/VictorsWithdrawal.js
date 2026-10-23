import {
  APPROVED_WITHDRAWAL_STATUSES,
  FLAGGED_WITHDRAWAL_STATUSES,
  MINIMUM_WITHDRAWAL,
  PENDING_WITHDRAWAL_STATUSES,
  WITHDRAWAL_FEE,
} from "./constants.js";
import Decimal from "decimal.js";

/** Trait: withdrawal rules, payouts and the pending queue */
export default class VictorsWithdrawal {
  /** The drop publishes its minimum in its config */
  getMinimumWithdrawal() {
    return Number(this.getConfig()["withdrawMin"]) || MINIMUM_WITHDRAWAL;
  }

  /** The on-chain VIC the drop wants held before it pays out */
  getMinimumHolding() {
    return Number(this.getConfig()["withdrawMinHolding"]) || 0;
  }

  /** Whether the on-chain holding clears the minimum, with the page's 1 VIC slack */
  hasMinimumHolding() {
    return (
      Number(this.getUserDetails()["walletBalance"] || 0) >=
      this.getMinimumHolding() - 1
    );
  }

  /** The flat fee taken off each payout */
  getWithdrawalFee() {
    return Number(this.getConfig()["withdrawFee"] ?? WITHDRAWAL_FEE);
  }

  /* --------------------------------------------------------------------- */
  /* Verification                                                          */
  /* --------------------------------------------------------------------- */

  /** Whether the drop will let this account withdraw */
  isWithdrawalEligible() {
    const verify = this.getVerify();
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

  /* --------------------------------------------------------------------- */
  /* Withdrawal                                                            */
  /* --------------------------------------------------------------------- */

  /** The account's withdrawals among its newest history rows */
  async getWithdrawals() {
    const transactions = await this.fetchTransactions();

    return transactions.filter((item) => item["type"] === "Withdraw");
  }

  /** The withdrawals the drop has not settled yet */
  async getPendingWithdrawals() {
    return (await this.getWithdrawals()).filter((item) =>
      PENDING_WITHDRAWAL_STATUSES.includes(item["status"]),
    );
  }

  /** Whether the drop still owes this account a settlement */
  async hasPendingWithdrawal() {
    await this.ensureStateLoaded();

    return (await this.getPendingWithdrawals()).length > 0;
  }

  /** The account's own withdrawal queue */
  async getAutoWithdrawals() {
    await this.ensureStateLoaded();

    const withdrawals = await this.getWithdrawals();
    const byStatus = (statuses) =>
      withdrawals.filter((item) => statuses.includes(item["status"]));

    return {
      pending: byStatus(PENDING_WITHDRAWAL_STATUSES),
      approved: byStatus(APPROVED_WITHDRAWAL_STATUSES),
      flagged: byStatus(FLAGGED_WITHDRAWAL_STATUSES),
    };
  }

  /** Place withdrawal */
  async placeWithdrawal({ max, difference }) {
    await this.ensureStateLoaded();

    const user = this.getUserDetails();
    const destinationAddress = this.getConnectedWalletAddress();

    if (!destinationAddress) {
      return this.skipWithdrawal("No wallet connected!");
    }

    if (!this.isWithdrawalEligible()) {
      const verify = this.getVerify();
      const message = !verify["verified"]
        ? "Wallet is not verified!"
        : Number(verify["walletAgeDays"] ?? -1) <
            Number(verify["minWalletAgeDays"] || 0)
          ? `Wallet is younger than ${verify["minWalletAgeDays"]} days!`
          : verify["underReview"]
            ? "Wallet is under review!"
            : `Wallet holds ${Math.floor(Number(user["walletBalance"] || 0))} VIC on-chain, needs ${this.getMinimumHolding()}!`;

      return this.skipWithdrawal(message, { log: "warn" });
    }

    if ((await this.getPendingWithdrawals()).length > 0) {
      return this.skipWithdrawal("A withdrawal is already pending!", {
        log: "warn",
      });
    }

    const balance = new Decimal(user["inAppBalance"] || 0);
    const minimum = this.getMinimumWithdrawal();
    const lowBalance = this.skipLowBalance(balance, minimum);

    if (lowBalance) return lowBalance;

    const amount = this.pickWithdrawalAmount({
      balance,
      minimum,
      max,
      difference,
      ceiling: Number(this.getConfig()["withdrawMax"]) || 0,
    });

    /** Read before the request, while the state still holds the pre-payout holding */
    this.logLevelAfterWithdrawal(amount);

    const result = await this.requestWithdrawal(amount);
    const status = result?.["success"] !== false;
    const message = result?.["error"] || result?.["message"] || "";

    if (status) {
      this.applyResult(result);

      this.logger.success(
        `Requested ${amount.toString()} VIC${result["autoApproved"] ? ", auto-approved" : ""}.`,
      );
      this.logger.keyValue("Destination", destinationAddress);
      this.logger.keyValue(
        "To be received",
        Decimal.max(amount.minus(this.getWithdrawalFee()), 0).toString(),
      );

      await this.notifyWithdrawal([
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
    const activeLevel = Number(this.getMining()["level"]) || 0;
    const holding = new Decimal(this.state_data["holding"] || 0).minus(amount);
    const levelAfter = this.findLevelForHolding(
      Decimal.max(holding, 0).toNumber(),
      Boolean(this.getConnectedWalletAddress()),
    );

    if (levelAfter < activeLevel) {
      this.logger.keyValue("Level After", `${activeLevel} → ${levelAfter}`, {
        valueStyle: this.logger.c.yellowBright,
      });
    }
  }

  /** Log the payouts the drop has not settled yet */
  async logWithdrawalStatus() {
    await this.ensureStateLoaded();

    const pending = await this.getPendingWithdrawals();
    const verify = this.getVerify();

    this.logger.newline();
    this.logCurrentUser();
    this.logger.keyValue(
      "Balance",
      this.formatAmount(this.getUserDetails()["inAppBalance"]),
    );
    this.logger.keyValue("Minimum", this.getMinimumWithdrawal());
    this.logger.keyValue("Fee", this.getWithdrawalFee());
    this.logger.keyValue(
      "Holding",
      `${this.formatAmount(this.getUserDetails()["walletBalance"])} / ${this.getMinimumHolding()}`,
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
