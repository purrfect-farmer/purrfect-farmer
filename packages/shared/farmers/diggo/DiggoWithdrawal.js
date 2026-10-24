import FarmerModule from "../../lib/farmer/FarmerModule.js";
import { WITHDRAWAL_DECIMALS } from "./constants.js";
import Decimal from "decimal.js";

/** Jetton withdrawals and their queue */
export default class DiggoWithdrawal extends FarmerModule {
  /** The withdrawal rules and active request, as last read */
  withdrawalStatus = null;

  /** The jetton withdrawal rules, withdrawable balance, destination and active request */
  async getWithdrawalStatus() {
    this.withdrawalStatus = await this.ctx.api.fetchWithdrawalStatus();

    if (this.withdrawalStatus["withdrawals"]?.["activation"]) {
      this.ctx.activation.current =
        this.withdrawalStatus["withdrawals"]["activation"];
    }

    return this.withdrawalStatus;
  }

  /** The game publishes its DIGGO minimum with the withdrawal status */
  getMinimumWithdrawal() {
    return (
      Number(this.withdrawalStatus?.["withdrawals"]?.["minimum"]) ||
      this.ctx.flow.declaredMinimum()
    );
  }

  /** The account's recent jetton withdrawals, newest first */
  async getWithdrawals() {
    const { items } = await this.ctx.api.fetchWithdrawals();

    return items || [];
  }

  /** A DIGGO amount the way the backend takes it, at most six decimals */
  toWithdrawalAmount(value) {
    return new Decimal(value)
      .toDecimalPlaces(WITHDRAWAL_DECIMALS, Decimal.ROUND_DOWN)
      .toFixed();
  }

  /** Quote a withdrawal, log what it pays, then request it */
  async placeQuotedWithdrawal(amount) {
    const { quote } = await this.ctx.api.quoteWithdrawal(
      this.toWithdrawalAmount(amount),
    );

    this.logger.newline();
    this.logger.keyValue("Amount", `${quote["amount"]} DIGGO`);
    this.logger.keyValue("Fee", `${quote["fee"] ?? "-"} DIGGO`);
    this.logger.keyValue("You Get", `${quote["received"] ?? "?"} DIGGO`);

    const { withdrawal } = await this.ctx.api.requestWithdrawal(
      quote["amount"],
    );

    this.logger.success(`Requested ${quote["amount"]} DIGGO.`);

    return { quote, withdrawal };
  }

  /** Withdraw DIGGO on-chain to the bound wallet */
  async place({ max, difference }) {
    await this.ctx.state.ensureLoaded();

    const status = await this.getWithdrawalStatus();
    const rules = status["withdrawals"] || {};
    const destinationAddress = status["destination"];

    if (!destinationAddress) {
      return this.ctx.flow.skip("No wallet connected!");
    }

    if (!rules["enabled"]) {
      return this.ctx.flow.skip("Withdrawals are disabled!", { log: "warn" });
    }

    if (status["activeWithdrawal"]) {
      return this.ctx.flow.skip("A withdrawal is already pending!", {
        log: "warn",
      });
    }

    if (
      rules["activation"] &&
      !this.ctx.activation.isActivated(rules["activation"])
    ) {
      return this.ctx.flow.skip(
        `${this.ctx.activation.describeActivation(rules["activation"])}, run Verify!`,
        { log: "warn" },
      );
    }

    const balance = new Decimal(status["available"] || 0);
    const minimum = this.getMinimumWithdrawal();
    const lowBalance = this.ctx.flow.skipLowBalance(balance, minimum);

    if (lowBalance) return lowBalance;

    const amount = this.ctx.flow.pickAmount({
      balance,
      minimum,
      max,
      difference,
    });

    try {
      const { quote } = await this.placeQuotedWithdrawal(amount);

      await this.ctx.flow.notify([
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
  async logStatus() {
    await this.ctx.state.ensureLoaded();
    await this.ctx.state.load();

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
      this.ctx.activation.describeActivation(
        rules["activation"] || this.ctx.activation.getActivation(),
      ),
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
