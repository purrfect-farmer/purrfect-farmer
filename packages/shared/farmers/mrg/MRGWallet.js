import Decimal from "decimal.js";
import FarmerModule from "../../lib/farmer/FarmerModule.js";
import { createWallet } from "../../lib/ton/wallet.js";
import { buildTonProof } from "../../lib/ton/proof.js";
import { formatAmount } from "../../lib/farmer/format.js";
import { readOnChainHolding } from "../../lib/farmer/onChain.js";
import {
  TON_PROOF_DOMAIN,
  VERIFICATION_CHECK_FIRST_DELAY_SECONDS,
  VERIFICATION_CHECK_INTERVAL_SECONDS,
  VERIFICATION_CHECK_WINDOW_SECONDS,
  VERIFICATION_GAS_TON,
  VERIFICATION_RETRY_HOURS,
} from "./constants.js";
import { Cell } from "@ton/core";

/** Binding the wallet, its holding and the on-chain verification */
export default class MRGWallet extends FarmerModule {
  /* --------------------------------------------------------------------- */
  /* Wallet                                                                */
  /* --------------------------------------------------------------------- */

  /** The address the drop currently has the account on */
  getConnectedWalletAddress() {
    return this.ctx.state.data?.user?.["tonWalletAddress"] || null;
  }

  /** The holding the drop credits the account with */
  getWalletHolding() {
    return new Decimal(this.ctx.state.data?.user?.["tonWalletBalance"] || 0);
  }

  /** Re-read the connected wallet on-chain and send it to the drop, which re-reads it too */
  async syncConnectedWallet() {
    const address = this.getConnectedWalletAddress();

    if (!address) {
      this.logger.warn(
        "No wallet connected. Use the Connect Wallet tool to bind one.",
      );
      return { status: false, message: "No wallet connected" };
    }

    return this.connectWalletAddress(address);
  }

  /** Re-sync the bound address at its on-chain holding, which needs no proof */
  async connectWalletAddress(address) {
    if (address !== this.getConnectedWalletAddress()) {
      return {
        status: false,
        message: "MRG needs the wallet phrase to sign a TON proof",
      };
    }

    return this.reportWallet(
      address,
      await readOnChainHolding(this.core, address),
    );
  }

  /** Bind the wallet a key pair controls, signing the TON proof the drop asks for */
  async connectSignedWallet(keyPair, version) {
    const wallet = createWallet(keyPair.publicKey, Number(version));
    const address = wallet.address.toString({ bounceable: false });
    const holding = await readOnChainHolding(this.core, address);

    const tonProof = await buildTonProof({
      wallet,
      secretKey: keyPair.secretKey,
      domain: TON_PROOF_DOMAIN,
      payload: await this.ctx.api.fetchTonProofPayload(),
    });

    return this.reportWallet(address, holding, tonProof);
  }

  /** Bind an address at the holding it is reported with, which the drop takes at face value */
  async reportWallet(address, holding, tonProof) {
    const amount = new Decimal(holding);

    /** A different wallet holds different NFTs */
    if (address !== this.getConnectedWalletAddress()) {
      this.ctx.nft.reset();
    }

    this.logger.info(`Syncing ${address} at ${formatAmount(amount)} MRG...`);

    const result = await this.ctx.api.connectWallet(
      address,
      amount.toNumber(),
      tonProof,
    );

    if (!result?.["success"]) {
      const message = result?.["error"] || "Failed to connect the wallet";

      this.logger.error(message);
      return { status: false, message };
    }

    this.ctx.state.setUser(result["user"]);

    this.logger.success(
      `Wallet synced at ${formatAmount(this.getWalletHolding())} MRG.`,
    );

    return { status: true, message: "Wallet synced" };
  }

  /* --------------------------------------------------------------------- */
  /* Verification                                                          */
  /* --------------------------------------------------------------------- */

  /** Poll the drop until it sees the verification transfer or the window runs out, as the page does */
  async pollVerification(windowSeconds = VERIFICATION_CHECK_WINDOW_SECONDS) {
    const startedAt = Date.now();
    let result = null;

    await this.utils.delayForSeconds(VERIFICATION_CHECK_FIRST_DELAY_SECONDS, {
      precised: true,
      signal: this.signal,
    });

    while (!this.signal.aborted) {
      result = await this.ctx.api.checkVerification();

      if (result?.["success"] && result["status"] === "verified") {
        await this.ctx.state.load();
        this.logger.success("Account verified on-chain.");
        return { status: true };
      }

      if (result?.["success"] === false) {
        return {
          status: false,
          message: result["error"] || "Verification failed",
        };
      }

      if (result?.["status"] === "underpaid") {
        return {
          status: false,
          message: `Paid ${result["amountGram"]} TON, verification needs ${result["requiredGram"]}`,
        };
      }

      if (Date.now() - startedAt > windowSeconds * 1000) break;

      await this.utils.delayForSeconds(VERIFICATION_CHECK_INTERVAL_SECONDS, {
        precised: true,
        signal: this.signal,
      });
    }

    /** The page tells a busy chain service apart from a payment not seen yet */
    if (result?.["status"] === "unavailable") {
      this.logger.warn("The drop's blockchain service is busy right now.");
      return { status: false, message: "Blockchain service busy, check again" };
    }

    this.logger.warn("The verification transfer has not been seen yet.");
    return { status: false, message: "Not confirmed yet, check again" };
  }

  /** Pay the one-time verification transfer from the wallet's phrase, unless it is already settled or on its way */
  async verifyWalletIfNeeded({ phrase, version, apiKey }) {
    const info = await this.ctx.api.fetchVerificationInfo();

    if (info?.["verified"] && !info["verificationRequired"]) {
      return { status: true };
    }

    const payment = info?.["payment"];

    if (!payment?.["address"] || !payment?.["amountNano"]) {
      const message = info?.["error"] || "The drop returned no transfer";

      this.logger.warn("Failed to start verification:", message);
      return { status: false, message };
    }

    if (!phrase) {
      return { status: false, message: "No phrase to pay verification with" };
    }

    /** A transfer already sent is only checked, so it is never paid twice */
    const sentAt = Number(await this.storage?.get("verificationSentAt")) || 0;

    if (Date.now() - sentAt < VERIFICATION_RETRY_HOURS * 60 * 60 * 1000) {
      this.logger.info("Verification was paid already, checking it...");
      /** The page's "I already paid" polls for the last 30s of its window */
      return this.pollVerification(30);
    }

    const wallet = this.utils.wallet.createTonWallet({
      phrase,
      version,
      apiKey,
    });
    const address = await wallet.getAddress();
    const connected = this.getConnectedWalletAddress();

    /** Only a payment from the bound wallet counts */
    if (!connected || !this.utils.isSameTonAddress(connected, address)) {
      const message = "The phrase does not match the connected wallet";

      this.logger.warn(message);
      return { status: false, message };
    }

    const amount = BigInt(payment["amountNano"]);
    const amountTon = new Decimal(amount.toString()).div(1e9);
    const tonBalance = await wallet
      .getBalance({ signal: this.signal })
      .catch(() => new Decimal(0));

    if (tonBalance.lessThan(amountTon.plus(VERIFICATION_GAS_TON))) {
      const message = `Verification needs ${amountTon.plus(VERIFICATION_GAS_TON)} TON, the wallet holds ${tonBalance}`;

      this.logger.warn(message);
      return { status: false, message };
    }

    const seqno = await wallet.send({
      to: payment["address"],
      value: amount,
      body: payment["payload"]
        ? Cell.fromBase64(payment["payload"])
        : undefined,
    });

    /** Recorded before confirming, so a lost confirmation is never paid twice */
    await this.storage?.set("verificationSentAt", Date.now());
    await wallet.waitForConfirmation(seqno);

    this.logger.success(
      `Sent ${amountTon} TON to ${payment["address"]} for verification.`,
    );

    return this.pollVerification();
  }
}
