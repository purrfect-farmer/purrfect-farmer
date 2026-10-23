import {
  ACTIVATION_CHECK_ATTEMPTS,
  ACTIVATION_CHECK_INTERVAL_SECONDS,
} from "./constants.js";

/** Trait: the one-time withdrawal activation fee */
export default class DiggoActivation {
  /* --------------------------------------------------------------------- */
  /* Withdrawal activation                                                 */
  /* --------------------------------------------------------------------- */

  /** The withdrawal activation as last read */
  getActivation() {
    return (
      this.activation ||
      this.state_data?.["jettonWithdrawals"]?.["activation"] ||
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
    const { activation } = await this.fetchActivation();

    this.activation = activation;

    if (
      activation?.["required"] &&
      !activation["age"]?.["known"] &&
      activation["destination"] &&
      activation["reason"] !== "unavailable"
    ) {
      const checked = await this.checkActivation();

      this.activation = checked["activation"] || activation;
    }

    return this.activation;
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

    const ordered = await this.createActivationOrder();
    const order = ordered["order"];

    this.activation = ordered["activation"] || this.activation;

    if (order?.["status"] === "pending" && order["stage"] === "created") {
      const prepared = await this.prepareActivation(order["id"]);
      const invoice = prepared["order"];

      this.activation = prepared["activation"] || this.activation;

      if (!prepared["activation"]?.["paid"]) {
        if (
          !prepared["activation"]?.["age"]?.["eligible"] ||
          prepared["activation"]["reason"] === "unavailable" ||
          invoice?.["status"] !== "pending" ||
          invoice["stage"] !== "wallet_opened" ||
          invoice["expiresAt"] <= this.getServerNow()
        ) {
          throw new Error("The activation payment is unavailable");
        }

        try {
          await this.payTonTransaction(signer, invoice["transaction"]);
        } catch (error) {
          await this.stageActivation(order["id"], "rejected").catch(() => null);
          throw error;
        }

        await this.stageActivation(order["id"], "submitted");
        this.logger.info("Activation fee sent, waiting for the game...");
      }
    }

    for (let attempt = 0; attempt < ACTIVATION_CHECK_ATTEMPTS; attempt++) {
      if (this.isActivated()) break;

      await this.utils.delayForSeconds(ACTIVATION_CHECK_INTERVAL_SECONDS, {
        signal: this.signal,
      });

      this.activation = (await this.fetchActivation())["activation"];
    }

    const status = this.isActivated();

    return {
      status,
      skipped: false,
      message: status ? "Activated" : this.describeActivation(this.activation),
    };
  }
}
