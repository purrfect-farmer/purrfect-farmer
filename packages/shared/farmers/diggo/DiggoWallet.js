import FarmerModule from "../../lib/farmer/FarmerModule.js";
import { readOnChainHolding } from "../../lib/farmer/onChain.js";
import { buildTonProof } from "../../lib/ton/proof.js";
import {
  createWallet,
  deriveMnemonicFromTelegramId,
} from "../../lib/ton/wallet.js";
import {
  CONVERSION_PRICE_ERRORS,
  MINIMUM_CONVERSION_NANO,
  TON_NETWORK,
  TON_PROOF_DOMAIN,
} from "./constants.js";
import Decimal from "decimal.js";
import { promptWalletVersion } from "../../lib/farmer/prompts.js";

/** Binding the wallet, its balances and signing */
export default class DiggoWallet extends FarmerModule {
  /** The bound address in its friendly, non-bounceable form */
  getConnectedWalletAddress() {
    const address = this.ctx.state.data?.["wallet"]?.["address"];

    return address ? this.utils.toFriendlyAddress(address) : null;
  }

  /** Bind the wallet a key pair controls, signing the TON proof the game asks for */
  async connectSignedWallet(keyPair, version) {
    const wallet = createWallet(keyPair.publicKey, Number(version));
    const connected = this.getConnectedWalletAddress();

    /** The game binds a wallet for good, so a bound one is only checked */
    if (connected) {
      return this.utils.isSameTonAddress(connected, wallet.address.toString())
        ? { status: true, message: "Wallet already bound" }
        : {
            status: false,
            message: `Diggo is bound to ${connected} for good`,
          };
    }

    const { payload } = await this.ctx.api.fetchTonChallenge();
    const { address, walletStateInit, proof } = await buildTonProof({
      wallet,
      secretKey: keyPair.secretKey,
      domain: TON_PROOF_DOMAIN,
      payload,
    });

    try {
      await this.ctx.api.bindWallet({
        address,
        network: TON_NETWORK,
        publicKey: Buffer.from(keyPair.publicKey).toString("hex"),
        walletStateInit,
        proof,
      });
    } catch (error) {
      return { status: false, message: error.message };
    }

    this.logger.success(`Wallet bound: ${this.getConnectedWalletAddress()}`);

    return { status: true };
  }

  /** Accept an address without its phrase only when it is the one already bound */
  async connectWalletAddress(address) {
    const connected = this.getConnectedWalletAddress();

    if (connected && this.utils.isSameTonAddress(connected, address)) {
      return { status: true };
    }

    return {
      status: false,
      message: connected
        ? `Diggo is bound to ${connected} for good`
        : "Diggo needs the wallet phrase to sign a TON proof",
    };
  }

  /** The bound wallet's on-chain DIGGO, as the state reads it or the chain does, or null when unknown */
  getWalletDiggo() {
    const diggo = this.ctx.state.data?.["wallet"]?.["holdings"]?.["diggo"];

    if (diggo?.["known"] && diggo["amount"] !== undefined) {
      return String(diggo["amount"]);
    }

    return this.onChainDiggo ?? null;
  }

  /** The in-app TON balance the conversion spends, in nanotons */
  getInAppTonNano() {
    const nano = String(
      this.ctx.state.data?.["wallet"]?.["tonBalanceNano"] ?? "",
    );

    if (/^\d+$/.test(nano)) return BigInt(nano);

    return BigInt(
      new Decimal(this.ctx.state.data?.["market"]?.["tonAvailable"] || 0)
        .mul(1e9)
        .floor()
        .toFixed(),
    );
  }

  /** The in-app TON balance, in TON */
  getInAppTon() {
    return new Decimal(this.getInAppTonNano().toString()).div(1e9);
  }

  /** Have the backend re-read the bound wallet's DIGGO, reading the chain when it cannot */
  async refreshHolding() {
    const address = this.getConnectedWalletAddress();

    if (!address) {
      this.logger.info("No wallet bound.");
      return null;
    }

    await this.ctx.api
      .refreshWalletBalance("diggo")
      .catch((error) =>
        this.logger.warn("Failed to refresh the holding:", error.message),
      );

    const diggo = this.ctx.state.data?.["wallet"]?.["holdings"]?.["diggo"];

    this.onChainDiggo = diggo?.["known"]
      ? undefined
      : (await readOnChainHolding(this.core, address)).toString();

    this.logger.keyValue("Wallet DIGGO", this.getWalletDiggo() ?? "-");

    return this.getWalletDiggo();
  }

  /** Convert the whole in-app TON balance into DIGGO at the STON.fi rate, once the conversion is open */
  async convertTon() {
    const transition = (await this.ctx.state.getTransition()) || {};

    if (!transition["conversion"]?.["enabled"]) {
      this.logger.info("Conversion is closed.");
      return;
    }

    const nano = this.getInAppTonNano();

    if (nano <= MINIMUM_CONVERSION_NANO) {
      this.logger.info("No in-app TON to convert.");
      return;
    }

    const amount = new Decimal(nano.toString()).div(1e9).toFixed();

    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        const { quote } = await this.ctx.api.quoteConversion(amount);

        this.logger.newline();
        this.logger.keyValue("Convert", `${amount} TON`);
        this.logger.keyValue("Receive", `${quote["diggo"]} DIGGO`);

        const { conversion } = await this.ctx.api.confirmConversion(
          quote["id"],
        );

        this.logger.success(
          `Converted ${amount} TON into ${conversion?.["diggo"] ?? quote["diggo"]} DIGGO.`,
        );
        return;
      } catch (error) {
        if (!CONVERSION_PRICE_ERRORS.includes(error.code)) throw error;

        if (attempt === 1) {
          this.logger.warn("Skipped the conversion:", error.message);
          return;
        }

        this.logger.warn(`${error.message}, quoting again...`);
        await this.utils.delayForSeconds(5, { signal: this.signal });
      }
    }
  }

  /** A signer for the bound wallet from its phrase, or null when the phrase is another wallet's */
  async createSigner({ phrase, version, apiKey }) {
    const wallet = this.utils.wallet.createTonWallet({
      phrase,
      version: Number(version),
      apiKey,
    });
    const address = await wallet.getAddress();

    if (
      !this.utils.isSameTonAddress(this.getConnectedWalletAddress(), address)
    ) {
      return null;
    }

    return { wallet, address };
  }

  /** Prompt for the bound wallet's phrase, typed or derived from the Telegram ID, and check it is the bound one */
  async promptSigner() {
    const bound = this.getConnectedWalletAddress();

    if (!bound) {
      this.logger.warn("Connect a wallet first.");
      return null;
    }

    const source = await this.core.prompt({
      type: "select",
      text: "Sign with:",
      options: [
        { value: "phrase", label: "Wallet Phrase" },
        { value: "derived", label: "Derived Wallet" },
      ],
    });

    let phrase;

    if (source === "derived") {
      const passphrase = (
        (await this.core.prompt(
          "Enter the passphrase (leave empty for none):",
        )) || ""
      ).trim();

      phrase = (
        await deriveMnemonicFromTelegramId(this.core.userId(), passphrase)
      ).join(" ");
    } else if (source === "phrase") {
      phrase = ((await this.core.prompt("Enter the wallet phrase:")) || "")
        .trim()
        .split(/\s+/)
        .join(" ");
    }

    if (!phrase) {
      this.logger.warn("No phrase provided.");
      return null;
    }

    const version = await promptWalletVersion(this.core);

    if (!version) {
      this.logger.warn("No wallet version selected.");
      return null;
    }

    const wallet = this.utils.wallet.createTonWallet({
      phrase,
      version: Number(version),
    });
    const address = await wallet.getAddress();

    if (!this.utils.isSameTonAddress(bound, address)) {
      this.logger.error("The phrase does not match the bound wallet:", bound);
      return null;
    }

    return { wallet, address };
  }

  /** Prompt for a positive amount, returning it as a string */
  async promptAmount(text) {
    const input = ((await this.core.prompt(text)) || "").trim();

    if (!input) {
      this.logger.warn("No amount provided.");
      return null;
    }

    try {
      const amount = new Decimal(input);

      if (amount.lessThanOrEqualTo(0)) throw new Error();

      return amount.toString();
    } catch {
      this.logger.error("Invalid amount:", input);
      return null;
    }
  }
}
