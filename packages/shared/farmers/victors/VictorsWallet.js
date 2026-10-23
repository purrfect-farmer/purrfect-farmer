import BaseFarmer from "../../lib/BaseFarmer.js";
import {
  createWallet,
  keyPairFromPhraseOrSecretKey,
} from "../../lib/ton/wallet.js";
import { buildTonProof } from "../../lib/ton/proof.js";
import {
  TON_PROOF_DOMAIN,
  VERIFICATION_CHECK_ATTEMPTS,
  VERIFICATION_CHECK_INTERVAL_SECONDS,
  VERIFICATION_GAS_TON,
  VERIFICATION_RETRY_HOURS,
} from "./constants.js";
import Decimal from "decimal.js";
import { Cell } from "@ton/core";

/** Trait: binding the wallet, its holding and the on-chain verification */
export default class VictorsWallet {
  /* --------------------------------------------------------------------- */
  /* Wallet                                                                */
  /* --------------------------------------------------------------------- */

  /** The address the drop currently has the account on */
  getConnectedWalletAddress() {
    return this.state_data?.user?.["walletAddress"] || null;
  }

  /** Bind an address to the account, sent as `UQ...` the way the page sends it */
  async connectWalletAddress(address) {
    const friendly = this.utils.toFriendlyAddress(address);
    const result = await this.connectWallet(friendly);

    if (result?.["success"] === false) {
      const message = result["error"] || "Failed to connect the wallet";

      this.logger.error(message);
      return { status: false, message };
    }

    this.applyResult(result);
    this.logger.success(`Wallet connected: ${friendly}`);

    return { status: true, message: "Wallet connected" };
  }

  /** Bind the wallet a key pair controls, signing the TON proof that makes its holding count */
  async connectSignedWallet(keyPair, version) {
    const wallet = createWallet(keyPair.publicKey, Number(version));
    const address = wallet.address.toString({ bounceable: false });
    const tonProof = await buildTonProof({
      wallet,
      secretKey: keyPair.secretKey,
      domain: TON_PROOF_DOMAIN,
      payload: await this.fetchProofPayload(),
    });

    const result = await this.connectWallet(address, {
      proof: tonProof.proof,
      stateInit: tonProof.walletStateInit,
      publicKey: Buffer.from(keyPair.publicKey).toString("hex"),
    });

    if (result?.["success"] === false) {
      const message = result["error"] || "Failed to connect the wallet";

      this.logger.error(message);
      return { status: false, message };
    }

    this.applyResult(result);
    await this.rememberWalletVersion(version);

    if (!this.getUserDetails()["walletOwned"]) {
      this.logger.warn("Wallet connected but its ownership was not accepted.");
    }

    this.logger.success(`Wallet connected and proven: ${address}`);

    return { status: true, message: "Wallet connected" };
  }

  /** Bind a wallet from its phrase with a TON proof, or by address alone when no phrase is known */
  async connectAutoWallet({ phrase, address, version, refresh = false }) {
    if (!phrase) {
      return BaseFarmer.prototype.connectAutoWallet.call(this, {
        address,
        version,
        refresh,
      });
    }

    try {
      await this.ensureStateLoaded();

      const keyPair = await keyPairFromPhraseOrSecretKey(phrase);
      const { status, message } = await this.connectSignedWallet(
        keyPair,
        version,
      );

      if (!status) {
        return { status: false, message };
      }

      await this.afterAutoWalletConnected();

      return {
        status: true,
        summary: refresh
          ? await this.refreshAutoSummary()
          : this.getAutoSummary(),
      };
    } catch (error) {
      return { status: false, message: error.message || "Unknown error" };
    }
  }

  /** Have the drop re-read the on-chain holding */
  async refreshHolding() {
    if (!this.getConnectedWalletAddress()) {
      this.logger.warn("No wallet connected.");
      return;
    }

    const result = await this.refreshWallet();

    if (result?.["success"] === false) {
      this.logger.warn("Failed to refresh the wallet:", result["error"]);
      return;
    }

    this.applyResult(result);
    this.logger.keyValue(
      "On-chain VIC",
      this.formatAmount(this.getUserDetails()["walletBalance"]),
    );
  }

  /** Poll the drop until it sees the verification transfer */
  async pollVerification(attempts = VERIFICATION_CHECK_ATTEMPTS) {
    for (let attempt = 0; attempt < attempts; attempt++) {
      if (this.signal.aborted) break;

      await this.utils.delayForSeconds(VERIFICATION_CHECK_INTERVAL_SECONDS, {
        signal: this.signal,
      });

      const result = await this.checkVerification();

      if (result?.["verified"]) {
        this.applyResult(result);
        this.logger.success("Wallet verified.");
        return true;
      }
    }

    this.logger.warn("The verification transfer has not been seen yet.");
    return false;
  }

  /** Pay the one-time verification transfer from the wallet's phrase, unless it is already settled or on its way */
  async verifyWalletIfNeeded({ phrase, version, apiKey }) {
    const verify = this.getVerify();

    if (verify["verified"]) return { status: true };

    if (!phrase) {
      return { status: false, message: "No phrase to pay verification with" };
    }

    /** A transfer already sent is only checked, so it is never paid twice */
    const sentAt = Number(await this.storage?.get("verificationSentAt")) || 0;
    const recentlySent =
      Date.now() - sentAt < VERIFICATION_RETRY_HOURS * 60 * 60 * 1000;

    if (verify["pending"] && recentlySent) {
      this.logger.info("Verification was paid already, checking it...");
      return { status: await this.pollVerification(1) };
    }

    const wallet = this.utils.wallet.createTonWallet({
      phrase,
      version,
      apiKey,
    });
    const address = await wallet.getAddress();
    const connected = this.getConnectedWalletAddress();

    if (connected && !this.utils.isSameTonAddress(connected, address)) {
      const message = "The phrase does not match the connected wallet";

      this.logger.warn(message);
      return { status: false, message };
    }

    const amountTon = new Decimal(verify["amountTon"] || 0.05);
    const tonBalance = await wallet
      .getBalance({ signal: this.signal })
      .catch(() => new Decimal(0));

    if (tonBalance.lessThan(amountTon.plus(VERIFICATION_GAS_TON))) {
      const message = `Verification needs ${amountTon.plus(VERIFICATION_GAS_TON)} TON, the wallet holds ${tonBalance}`;

      this.logger.warn(message);
      return { status: false, message };
    }

    const result = await this.startVerification();
    const tx = result?.["tx"];

    if (!tx?.["address"] || !tx?.["amount"]) {
      const message = result?.["error"] || "The drop returned no transfer";

      this.logger.warn("Failed to start verification:", message);
      return { status: false, message };
    }

    const seqno = await wallet.send({
      to: tx["address"],
      value: BigInt(tx["amount"]),
      body: tx["payload"]
        ? Cell.fromBase64(tx["payload"])
        : tx["comment"] || verify["comment"],
    });

    /** Recorded before confirming, so a lost confirmation is never paid twice */
    await this.storage?.set("verificationSentAt", Date.now());
    await wallet.waitForConfirmation(seqno);

    this.logger.success(
      `Sent ${tx["amountTon"] ?? amountTon} TON to ${tx["address"]} for verification.`,
    );

    return { status: await this.pollVerification() };
  }
}
