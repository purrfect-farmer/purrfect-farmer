import FarmerModule from "../../lib/farmer/FarmerModule.js";
import {
  ACTIVATION_CHECK_ATTEMPTS,
  ACTIVATION_CHECK_INTERVAL_SECONDS,
} from "./constants.js";

/** The one-time withdrawal activation the wallet pays */
export default class DiggoActivation extends FarmerModule {
  /** The activation as the game last reported it */
  current = null;

  /** The withdrawal activation as last read */
  getActivation() {
    return (
      this.current ||
      this.ctx.state.data?.["jettonWithdrawals"]?.["activation"] ||
      null
    );
  }

  /** Whether withdrawals need no activation, or have it */
  isActivated(activation = this.getActivation()) {
    return Boolean(
      activation && (!activation["required"] || activation["eligible"]),
    );
  }

  /** Whether the fee invoice can be opened or continued now, as the page offers it */
  canPayActivation(activation) {
    return (
      activation?.["reason"] === "payment" ||
      (activation?.["reason"] === "pending" &&
        activation["order"]?.["stage"] === "created")
    );
  }

  /** What stands between the account and withdrawing */
  describeActivation(activation) {
    if (!activation) return "Activation unknown";
    if (this.isActivated(activation)) return "Activated";

    return (
      {
        connect: "Bind a wallet first",
        check: "Wallet age not checked yet",
        young: `Wallet too young, eligible ${activation["age"]?.["eligibleAt"] ? new Date(activation["age"]["eligibleAt"]).toLocaleString() : "later"}`,
        uninitialized: "Wallet is not initialized on-chain",
        ageUnavailable: "Wallet age is unavailable",
        unavailable: "Activation is unavailable for this account",
        payment: "Activation fee (0.05 TON) not paid",
        pending: "Activation fee is pending",
        review: "Activation is under review, contact support",
        ready: "Activated",
      }[activation["reason"]] || `Activation ${activation["reason"]}`
    );
  }

  /** Read the activation, having the backend check the wallet's age when it does not know it, as the page does */
  async loadActivation() {
    const { activation } = await this.ctx.api.fetchActivation();

    this.current = activation;

    if (
      activation?.["required"] &&
      !activation["age"]?.["known"] &&
      activation["destination"] &&
      activation["reason"] !== "unavailable"
    ) {
      const checked = await this.ctx.api.checkActivation();

      this.current = checked["activation"] || activation;
    }

    return this.current;
  }

  /** Pay the one-time activation fee from the bound wallet, then wait for the backend to see it */
  async payActivation(signer) {
    const activation = await this.loadActivation();

    if (this.isActivated(activation)) {
      return { status: true, skipped: true, message: "Already activated" };
    }

    if (!this.canPayActivation(activation)) {
      return {
        status: false,
        skipped: true,
        message: this.describeActivation(activation),
      };
    }

    const ordered = await this.ctx.api.createActivationOrder();
    const order = ordered["order"];

    this.current = ordered["activation"] || this.current;

    if (order?.["status"] === "pending" && order["stage"] === "created") {
      const prepared = await this.ctx.api.prepareActivation(order["id"]);
      const invoice = prepared["order"];

      this.current = prepared["activation"] || this.current;

      if (!prepared["activation"]?.["paid"]) {
        if (
          !prepared["activation"]?.["age"]?.["eligible"] ||
          prepared["activation"]["reason"] === "unavailable" ||
          invoice?.["status"] !== "pending" ||
          invoice["stage"] !== "wallet_opened" ||
          invoice["expiresAt"] <= this.ctx.state.getServerNow()
        ) {
          throw new Error("The activation payment is unavailable");
        }

        try {
          await this.ctx.market.payTonTransaction(
            signer,
            invoice["transaction"],
          );
        } catch (error) {
          await this.ctx.api
            .stageActivation(order["id"], "rejected")
            .catch(() => null);
          throw error;
        }

        await this.ctx.api.stageActivation(order["id"], "submitted");
        this.logger.info("Activation fee sent, waiting for the game...");
      }
    }

    for (let attempt = 0; attempt < ACTIVATION_CHECK_ATTEMPTS; attempt++) {
      if (this.isActivated()) break;

      await this.utils.delayForSeconds(ACTIVATION_CHECK_INTERVAL_SECONDS, {
        signal: this.signal,
      });

      this.current = (await this.ctx.api.fetchActivation())["activation"];
    }

    const status = this.isActivated();

    return {
      status,
      skipped: false,
      message: status ? "Activated" : this.describeActivation(this.current),
    };
  }
}
