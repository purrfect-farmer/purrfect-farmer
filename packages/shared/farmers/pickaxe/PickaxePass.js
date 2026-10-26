import FarmerModule from "../../lib/farmer/FarmerModule.js";
import { promptWalletVersion } from "../../lib/farmer/prompts.js";
import { sendTonConnectTransaction } from "../../lib/ton/tonConnect.js";
import {
  PAID_PASS_STATUSES,
  PASS_CHECK_ATTEMPTS,
  PASS_CHECK_FIRST_SECONDS,
  PASS_CHECK_SECONDS,
  PASS_GAS_TON,
  PASS_SENT_AT_KEY,
  PASS_SENT_WINDOW_MINUTES,
  PASS_STATUS,
} from "./constants.js";

/** The Ancient Pass: the soulbound NFT the linked wallet pays for once, which opens mining */
export default class PickaxePass extends FarmerModule {
  /** What stands between the account and mining */
  describe(pass = this.ctx.state.pass()) {
    if (pass["active"]) return `Active (#${pass["serial"]})`;
    if (pass["wrongWallet"])
      return `Pass #${pass["serial"]} is in another wallet`;

    return (
      {
        [PASS_STATUS.NONE]: "Not minted",
        [PASS_STATUS.AWAITING]: "Ordered, payment not seen yet",
        [PASS_STATUS.PAID]: "Paid, minting",
        [PASS_STATUS.MINTING]: "Minting",
        [PASS_STATUS.REVIEW]: "Paid, under manual review",
        [PASS_STATUS.REVOKED]: "Revoked",
      }[pass["status"]] || `Status ${pass["status"]}`
    );
  }

  /** Log the pass and its price */
  async logStatus() {
    await this.ctx.state.ensureLoaded();

    const pass = this.ctx.state.pass();

    this.logger.newline();
    this.logger.keyValue("Ancient Pass", this.describe(pass), {
      valueStyle: pass["active"]
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

    return Date.now() - sentAt < PASS_SENT_WINDOW_MINUTES * 60 * 1000;
  }

  /** Have the drop look for the payment until the pass is active, returning whether it is */
  async poll() {
    for (let attempt = 0; attempt < PASS_CHECK_ATTEMPTS; attempt++) {
      if (this.signal.aborted) break;

      await this.utils.delayForSeconds(
        attempt === 0 ? PASS_CHECK_FIRST_SECONDS : PASS_CHECK_SECONDS,
        { signal: this.signal },
      );

      const state = await this.ctx.api.checkPass().catch(() => null);

      if (state) this.ctx.state.apply(state);

      const pass = this.ctx.state.pass();

      if (pass["active"] || pass["status"] === PASS_STATUS.REVIEW) break;
    }

    return this.ctx.state.isPassActive();
  }

  /** Pay for the pass from the linked wallet, only polling a payment already sent */
  async pay(signer) {
    await this.ctx.state.ensureLoaded();

    const pass = this.ctx.state.pass();

    if (pass["active"]) {
      return { status: true, skipped: true, message: "The pass is active" };
    }

    const alreadyPaid =
      PAID_PASS_STATUSES.has(pass["status"]) ||
      (pass["status"] === PASS_STATUS.AWAITING &&
        (await this.wasRecentlySent()));

    if (!alreadyPaid) {
      const order = this.ctx.state.apply(await this.ctx.api.orderPass());
      const transaction = order["passTx"];

      if (Number(transaction?.["validUntil"]) * 1000 <= Date.now()) {
        throw new Error("The pass order expired before it could be paid");
      }

      /** Recorded once sent and before confirming, so a lost confirmation is never paid twice */
      const paid = await sendTonConnectTransaction(signer, transaction, {
        gasTon: PASS_GAS_TON,
        signal: this.signal,
        onSent: () => this.storage?.set(PASS_SENT_AT_KEY, Date.now()),
      });

      this.logger.info(
        `Sent ${paid} TON for the pass, waiting for the mint...`,
      );
    } else {
      this.logger.info("The pass is already paid, checking it...");
    }

    const status = await this.poll();
    const message = this.describe();

    if (status) {
      this.logger.success(`Ancient Pass ${message}, mining is open.`);
    } else {
      this.logger.warn(`Ancient Pass: ${message}, check it later.`);
    }

    return { status, skipped: false, message };
  }

  /** Pay for the pass, prompting for the linked wallet's phrase and confirming the price */
  async mintInteractive() {
    const pass = await this.logStatus();

    if (pass["active"]) return;

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

    const signer = await this.ctx.wallet.createSigner({ phrase, version });

    if (!signer) {
      this.logger.warn("The phrase does not match the linked wallet.");
      return;
    }

    const confirm = await this.core.prompt({
      type: "select",
      text: `Pay ${pass["priceTon"]} TON for the Ancient Pass?`,
      options: [
        { value: "no", label: "Cancel" },
        { value: "yes", label: "Mint" },
      ],
    });

    if (confirm !== "yes") return;

    try {
      await this.pay(signer);
    } catch (error) {
      this.logger.error("Failed to mint the pass:", error.message);
    }
  }
}
