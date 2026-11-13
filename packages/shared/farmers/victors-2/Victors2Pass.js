import FarmerModule from "../../lib/farmer/FarmerModule.js";
import { promptWalletVersion } from "../../lib/farmer/prompts.js";
import { sendTonConnectTransaction } from "../../lib/ton/tonConnect.js";
import {
  PASS_CHECK_ATTEMPTS,
  PASS_CHECK_FIRST_SECONDS,
  PASS_CHECK_SECONDS,
  PASS_GAS_TON,
  PASS_RETRY_HOURS,
  PASS_SENT_AT_KEY,
  PASS_STATUS,
} from "./constants.js";

/** The Mine Pass: the soulbound NFT the connected wallet pays for once, which opens claims and payouts */
export default class Victors2Pass extends FarmerModule {
  /** What stands between the account and its claims */
  describe(pass = this.ctx.state.pass()) {
    if (this.ctx.state.isPassActive()) {
      return pass["index"] != null
        ? `Active (#${pass["index"] + 1})`
        : "Active";
    }

    return (
      {
        [PASS_STATUS.NONE]: "Not minted",
        [PASS_STATUS.AWAITING]: "Ordered, payment not seen yet",
        [PASS_STATUS.WRONG_WALLET]: `Minted from another wallet (${pass["owner"]})`,
        [PASS_STATUS.DESTROYED]: "Destroyed",
        [PASS_STATUS.REVOKED]: "Revoked",
      }[pass["status"]] || `Status ${pass["status"]}`
    );
  }

  /** Log the pass and its price */
  async logStatus() {
    await this.ctx.state.ensureLoaded();

    const pass = this.ctx.state.pass();

    this.logger.newline();
    this.logger.keyValue("Mine Pass", this.describe(pass), {
      valueStyle: this.ctx.state.isPassActive()
        ? this.logger.c.greenBright
        : this.logger.c.yellowBright,
    });
    this.logger.keyValue("Price", `${pass["priceTon"]} TON`);
    this.logger.keyValue(
      "Wallet",
      this.ctx.wallet.getConnectedWalletAddress() || "Not connected",
    );

    return pass;
  }

  /** Whether a payment was sent recently enough that the drop may still be looking for it */
  async wasRecentlySent() {
    const sentAt = Number(await this.storage?.get(PASS_SENT_AT_KEY)) || 0;

    return Date.now() - sentAt < PASS_RETRY_HOURS * 60 * 60 * 1000;
  }

  /** Have the drop look for the payment until the pass settles, returning whether it is active */
  async poll(attempts = PASS_CHECK_ATTEMPTS) {
    for (let attempt = 0; attempt < attempts; attempt++) {
      if (this.signal.aborted) break;

      await this.utils.delayForSeconds(
        attempt === 0 ? PASS_CHECK_FIRST_SECONDS : PASS_CHECK_SECONDS,
        { signal: this.signal },
      );

      const result = await this.ctx.api.checkPass().catch(() => null);

      if (!result || result["success"] === false) continue;

      this.ctx.state.apply(result);

      const { status } = this.ctx.state.pass();

      if (
        status === PASS_STATUS.ACTIVE ||
        status === PASS_STATUS.WRONG_WALLET
      ) {
        break;
      }
    }

    return this.ctx.state.isPassActive();
  }

  /** Build the connected wallet's signer from its phrase, refusing a phrase for another wallet */
  async createSigner({ phrase, version, apiKey }) {
    const signer = this.utils.wallet.createTonWallet({
      phrase,
      version,
      apiKey,
    });
    const connected = this.ctx.wallet.getConnectedWalletAddress();
    const address = await signer.getAddress();

    return connected && this.utils.isSameTonAddress(connected, address)
      ? signer
      : null;
  }

  /** Pay for the pass from the wallet's phrase, only polling a payment already sent */
  async pay({ phrase, version, apiKey }, { remint = false } = {}) {
    await this.ctx.state.ensureLoaded();

    if (this.ctx.state.isPassActive()) {
      return { status: true, message: "The pass is active" };
    }

    if (!phrase) {
      return { status: false, message: "No phrase to pay the Mine Pass with" };
    }

    const pass = this.ctx.state.pass();

    /** A pass in another wallet is only replaced when asked, since it is paid for again */
    if (pass["status"] === PASS_STATUS.WRONG_WALLET && !remint) {
      const message = this.describe(pass);

      this.logger.warn(`Mine Pass: ${message}.`);
      return { status: false, message };
    }

    const signer = await this.createSigner({ phrase, version, apiKey });

    if (!signer) {
      const message = "The phrase does not match the connected wallet";

      this.logger.warn(message);
      return { status: false, message };
    }

    /** A payment already sent is only checked, so it is never paid twice */
    const alreadyPaid =
      pass["status"] === PASS_STATUS.AWAITING && (await this.wasRecentlySent());

    if (alreadyPaid) {
      this.logger.info("The pass is already paid, checking it...");
    } else {
      const sent = await this.order(signer);

      if (!sent.status) return sent;
    }

    const status = await this.poll();
    const message = this.describe();

    if (status) {
      this.logger.success(`Mine Pass ${message}.`);
    } else {
      this.logger.warn(`Mine Pass: ${message}, check it later.`);
    }

    return { status, message };
  }

  /** Order the pass and send the transaction the drop asks for */
  async order(signer) {
    const result = await this.ctx.api.orderPass();
    const transaction = result?.["tx"];

    if (result?.["success"] === false || !transaction) {
      const message = result?.["error"] || "The drop returned no transaction";

      this.logger.warn("Failed to order the pass:", message);
      return { status: false, message };
    }

    this.ctx.state.apply(result);

    if (Number(transaction["validUntil"]) * 1000 <= Date.now()) {
      return {
        status: false,
        message: "The pass order expired before it could be paid",
      };
    }

    try {
      /** Recorded once sent and before confirming, so a lost confirmation is never paid twice */
      const paid = await sendTonConnectTransaction(signer, transaction, {
        gasTon: PASS_GAS_TON,
        signal: this.signal,
        onSent: () => this.storage?.set(PASS_SENT_AT_KEY, Date.now()),
      });

      this.logger.info(
        `Sent ${paid} TON for the pass, waiting for the mint...`,
      );
    } catch (error) {
      this.logger.warn("Failed to pay for the pass:", error.message);
      return { status: false, message: error.message };
    }

    return { status: true };
  }

  /** Pay for the pass, prompting for the connected wallet's phrase and confirming the price */
  async mintInteractive() {
    const pass = await this.logStatus();

    if (this.ctx.state.isPassActive()) return;

    if (!this.ctx.wallet.getConnectedWalletAddress()) {
      this.logger.warn("Connect a wallet first.");
      return;
    }

    const phrase = ((await this.core.prompt("Enter the wallet phrase:")) || "")
      .trim()
      .split(/\s+/)
      .join(" ");

    if (!phrase) {
      this.logger.warn("No phrase provided.");
      return;
    }

    const version = await promptWalletVersion(this.core);

    if (!version) {
      this.logger.warn("No wallet version selected.");
      return;
    }

    const confirm = await this.core.prompt({
      type: "select",
      text: `Pay ${pass["priceTon"]} TON for the Mine Pass?`,
      options: [
        { value: "no", label: "Cancel" },
        { value: "yes", label: "Mint" },
      ],
    });

    if (confirm !== "yes") return;

    const { status, message } = await this.pay(
      { phrase, version },
      { remint: true },
    );

    if (!status) {
      this.logger.error("Mine Pass not active:", message);
    }
  }

  /** Ask the drop once whether an ordered pass has landed */
  async checkInteractive() {
    const pass = await this.logStatus();

    if (pass["status"] !== PASS_STATUS.AWAITING) return;

    if (await this.poll(1)) {
      this.logger.success(`Mine Pass ${this.describe()}.`);
    } else {
      this.logger.warn("The pass payment has not been seen yet.");
    }
  }
}
