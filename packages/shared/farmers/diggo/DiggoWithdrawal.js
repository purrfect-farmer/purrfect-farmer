import {
  APPROVED_WITHDRAWAL_STATUSES,
  FLAGGED_WITHDRAWAL_STATUSES,
  PENDING_WITHDRAWAL_STATUSES,
  WITHDRAWAL_DECIMALS,
} from "./constants.js";
import Decimal from "decimal.js";
import DiggoActivation from "./DiggoActivation.js";

/** Jetton withdrawals and their queue */
export default class DiggoWithdrawal extends DiggoActivation {
  /* --------------------------------------------------------------------- */
  /* Withdrawal                                                            */
  /* --------------------------------------------------------------------- */

  /** The jetton withdrawal rules, withdrawable balance, destination and active request */
  async getWithdrawalStatus() {
    this.withdrawalStatus = await this.fetchWithdrawalStatus();

    if (this.withdrawalStatus["withdrawals"]?.["activation"]) {
      this.activation = this.withdrawalStatus["withdrawals"]["activation"];
    }

    return this.withdrawalStatus;
  }

  /** The game publishes its DIGGO minimum with the withdrawal status */
  getMinimumWithdrawal() {
    return (
      Number(this.withdrawalStatus?.["withdrawals"]?.["minimum"]) ||
      super.getMinimumWithdrawal()
    );
  }

  /** The account's recent jetton withdrawals, newest first */
  async getWithdrawals() {
    const { items } = await this.fetchWithdrawals();

    return items || [];
  }

  /** Whether the game still owes this account a payout */
  async hasPendingWithdrawal() {
    await this.ensureStateLoaded();

    const status = await this.getWithdrawalStatus();

    if (status["activeWithdrawal"]) return true;

    const withdrawals = await this.getWithdrawals();

    return withdrawals.some((item) =>
      PENDING_WITHDRAWAL_STATUSES.includes(item["status"]),
    );
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

  /** A DIGGO amount the way the backend takes it, at most six decimals */
  toWithdrawalAmount(value) {
    return new Decimal(value)
      .toDecimalPlaces(WITHDRAWAL_DECIMALS, Decimal.ROUND_DOWN)
      .toFixed();
  }

  /** Quote a withdrawal, log what it pays, then request it */
  async placeQuotedWithdrawal(amount) {
    const { quote } = await this.quoteWithdrawal(
      this.toWithdrawalAmount(amount),
    );

    this.logger.newline();
    this.logger.keyValue("Amount", `${quote["amount"]} DIGGO`);
    this.logger.keyValue("Fee", `${quote["fee"] ?? "-"} DIGGO`);
    this.logger.keyValue("You Get", `${quote["received"] ?? "?"} DIGGO`);

    const { withdrawal } = await this.requestWithdrawal(quote["amount"]);

    this.logger.success(`Requested ${quote["amount"]} DIGGO.`);

    return { quote, withdrawal };
  }

  /** Withdraw DIGGO on-chain to the bound wallet */
  async placeWithdrawal({ max, difference }) {
    await this.ensureStateLoaded();

    const status = await this.getWithdrawalStatus();
    const rules = status["withdrawals"] || {};
    const destinationAddress = status["destination"];

    if (!destinationAddress) {
      return this.skipWithdrawal("No wallet connected!");
    }

    if (!rules["enabled"]) {
      return this.skipWithdrawal("Withdrawals are disabled!", { log: "warn" });
    }

    if (status["activeWithdrawal"]) {
      return this.skipWithdrawal("A withdrawal is already pending!", {
        log: "warn",
      });
    }

    if (rules["activation"] && !this.isActivated(rules["activation"])) {
      return this.skipWithdrawal(
        `${this.describeActivation(rules["activation"])}, run Verify!`,
        { log: "warn" },
      );
    }

    const balance = new Decimal(status["available"] || 0);
    const minimum = this.getMinimumWithdrawal();
    const lowBalance = this.skipLowBalance(balance, minimum);

    if (lowBalance) return lowBalance;

    const amount = this.pickWithdrawalAmount({
      balance,
      minimum,
      max,
      difference,
    });

    try {
      const { quote } = await this.placeQuotedWithdrawal(amount);

      await this.notifyWithdrawal([
        ["Initial Balance", balance.toString()],
        ["Requested", amount.toString()],
        ["To be received", `${quote["received"] ?? "?"} DIGGO`],
        ["Destination", `<code>${destinationAddress}</code>`],
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

  /** Log the withdrawal rules, the activation and the recent requests */
  async logWithdrawalStatus() {
    await this.ensureStateLoaded();
    await this.loadState();

    const status = await this.getWithdrawalStatus();
    const rules = status["withdrawals"] || {};

    this.logger.newline();
    this.logger.keyValue("Enabled", rules["enabled"] ? "Yes" : "No");
    this.logger.keyValue("Available", `${status["available"] ?? "-"} DIGGO`);
    this.logger.keyValue("Minimum", `${rules["minimum"] ?? "-"} DIGGO`);
    this.logger.keyValue("Fee", `${rules["fee"] ?? "-"} DIGGO`);
    this.logger.keyValue("Destination", status["destination"] || "-");
    this.logger.keyValue(
      "Activation",
      this.describeActivation(rules["activation"] || this.getActivation()),
    );
    this.logger.keyValue(
      "Active Request",
      status["activeWithdrawal"]
        ? status["activeWithdrawal"]["type"] || "Yes"
        : "None",
    );

    for (const item of await this.getWithdrawals()) {
      this.logger.keyValue(
        new Date(item["createdAt"] || Date.now()).toLocaleString(),
        [
          `${item["amount"]} DIGGO, gets ${item["received"] ?? "?"} (${item["status"]})`,
          item["txHash"] ? `tx ${item["txHash"]}` : null,
          item["cancelable"] ? "cancelable" : null,
        ]
          .filter(Boolean)
          .join(" · "),
      );
    }
  }
}
