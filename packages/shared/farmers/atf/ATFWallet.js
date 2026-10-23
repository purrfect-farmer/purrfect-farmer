import { WalletContractV4, WalletContractV5R1 } from "@ton/ton";
import { keyPairFromPhraseOrSecretKey } from "../../lib/ton/wallet.js";
import { buildTonProof, getWalletStateInit } from "../../lib/ton/proof.js";
import { MAX_SYNC_ATTEMPTS } from "./constants.js";
import ATFActivity from "./ATFActivity.js";

/** TON wallet keys, proofs and connection */
export default class ATFWallet extends ATFActivity {
  /** Prepare Wallet */
  prepareWallet(publicKeyBuffer) {
    const walletV4 = WalletContractV4.create({
      workchain: 0,
      publicKey: publicKeyBuffer,
    });

    const walletV5 = WalletContractV5R1.create({
      workchain: 0,
      publicKey: publicKeyBuffer,
    });

    const addressV4 = walletV4.address.toString({
      bounceable: false,
    });
    const addressV5 = walletV5.address.toString({
      bounceable: false,
    });
    const rawAddressV4 = walletV4.address.toRawString();
    const rawAddressV5 = walletV5.address.toRawString();
    const publicKey = publicKeyBuffer.toString("hex");

    return {
      publicKey,
      walletV4,
      walletV5,
      addressV4,
      addressV5,
      rawAddressV4,
      rawAddressV5,
    };
  }

  /** Log Wallet */
  logWallet(version, publicKey, address, rawAddress) {
    /** Convert version to uppercase */
    const uppercaseVersion = version.toUpperCase();

    /** Wallet version */
    this.logger.keyValue("Wallet Version", uppercaseVersion);
    /** Public key */
    this.logger.keyValue("Public Key", publicKey, {
      valueStyle: this.logger.c.yellowBright,
    });
    this.logger.newline();

    /** Wallet Address */
    this.logger.keyValue(`Wallet Address (${uppercaseVersion})`, address, {
      valueStyle: this.logger.c.whiteBright,
    });
    this.logger.newline();

    /** Raw Wallet Address */
    this.logger.keyValue(
      `Raw Wallet Address (${uppercaseVersion})`,
      rawAddress,
      {
        valueStyle: this.logger.c.greenBright,
      },
    );
    this.logger.newline();
  }

  /** Get Key Pair */
  getKeyPair(secretKeyOrMnemonic) {
    return keyPairFromPhraseOrSecretKey(secretKeyOrMnemonic);
  }

  /** Connect Wallet Secret Key or Mnemonic */
  async connectWalletInteractive() {
    const input = await this.promptInput(
      "Enter your TON Wallet Phrase / Secret Key (hex):",
    );

    const secretKeyOrMnemonic = input.trim();
    const keyPair = await this.getKeyPair(secretKeyOrMnemonic);
    const version = await this.promptInput({
      type: "select",
      text: "Select wallet version:",
      options: [
        { value: "v5", label: "Wallet V5R1" },
        { value: "v4", label: "Wallet V4" },
      ],
    });

    const { status } = await this.connectAndSyncWallet(keyPair, version);

    if (status) {
      const password = await this.promptInput(
        "Enter a password to encrypt and store your wallet:",
      );

      if (password) {
        const encryptedPhrase = await this.utils.encryption.encryptData({
          data: secretKeyOrMnemonic,
          password,
        });

        await this.storage.set("wallet", {
          encryptedPhrase,
          version,
        });

        this.logger.success("Wallet encrypted and stored successfully!");
      }
    }
  }

  /** Reconnect Wallet */
  async reconnectWallet() {
    const saved = await this.storage.get("wallet");
    if (!saved) {
      this.logger.warn("No wallet was previously saved!");
      return this.connectWalletInteractive();
    } else {
      const password = await this.promptInput(
        "Enter your password to decrypt the wallet:",
      );

      const { version, encryptedPhrase } = saved;
      const secretKeyOrMnemonic = await this.utils.encryption.decryptData({
        ...encryptedPhrase,
        password,
        asText: true,
      });

      const keyPair = await this.getKeyPair(secretKeyOrMnemonic);
      await this.connectAndSyncWallet(keyPair, version);
    }
  }

  /** Connect and Sync Wallet */
  async connectAndSyncWallet(keyPair, version) {
    const {
      walletV4,
      walletV5,
      publicKey,
      addressV4,
      addressV5,
      rawAddressV4,
      rawAddressV5,
    } = this.prepareWallet(keyPair.publicKey);

    const wallet = version === "v5" ? walletV5 : walletV4;
    const address = version === "v5" ? addressV5 : addressV4;
    const rawAddress = version === "v5" ? rawAddressV5 : rawAddressV4;

    this.logWallet(version, publicKey, address, rawAddress);

    const walletStateInit = getWalletStateInit(wallet);

    const { proof } = await this.buildWalletProof(wallet, keyPair.secretKey);

    const data = {
      publicKey,
      wallet: rawAddress,
      walletStateInit,
      network: "-239",
      proof,
    };

    this.debugger.log("Syncing ATF Wallet:", data);

    let attempts = 0;

    while (true) {
      const result = await this.syncWallet(data);
      const isBusy = result.busy || result.status === "busy";

      if (isBusy && attempts < MAX_SYNC_ATTEMPTS) {
        attempts++;
        this.logger.warn("Server is busy, retrying...");
        await this.utils.delayForSeconds(2, { signal: this.signal });
        continue;
      }

      if (result.status !== "success") {
        const message =
          result.message ||
          "Failed to sync wallet with proof. Please check your secret key and try again.";
        this.logger.error(message);
        return { status: false, message };
      } else {
        const user = result.user;

        /** Update user */
        this.user_data.user = Object.assign(this.user_data.user, user);

        this.logger.success("Wallet synced successfully!");
        this.logUserBalance(user);
        this.logUserRisks(user);
        return { status: true, user };
      }
    }
  }

  /** Build Wallet Proof */
  async buildWalletProof(wallet, secretKey) {
    const proofPayloadData = await this.getWalletProofPayload();
    const payload = proofPayloadData.payload;

    const { proof } = await buildTonProof({
      wallet,
      secretKey,
      domain: "atftoken.com",
      payload,
    });

    return { payload, proof };
  }

  getUserWallet(user) {
    const { publicKey, addressV4, addressV5, rawAddressV4, rawAddressV5 } =
      this.prepareWallet(Buffer.from(user["wallet_public_key"], "hex"));

    const version = user["wallet_address"] === rawAddressV5 ? "v5" : "v4";
    const address = version === "v5" ? addressV5 : addressV4;
    const rawAddress = version === "v5" ? rawAddressV5 : rawAddressV4;

    return { version, publicKey, address, rawAddress };
  }

  logUserWallet(user) {
    const { version, publicKey, address, rawAddress } =
      this.getUserWallet(user);

    this.logger.newline();
    this.logWallet(version, publicKey, address, rawAddress);
  }

  /** Disconnect the wallet the way the app's disconnect button does, which settles and stops mining */
  async disconnectWalletInteractive() {
    const wallet = this.user_data?.user?.["wallet_address"];

    if (!wallet) {
      this.logger.warn("No wallet connected.");
      return;
    }

    const confirm = await this.promptInput({
      type: "select",
      text: "Disconnecting settles and stops mining. Continue?",
      options: [
        { value: "no", label: "Cancel" },
        { value: "yes", label: "Disconnect" },
      ],
    });

    if (confirm !== "yes") return;

    try {
      const result = await this.disconnectWallet(wallet);

      if (result.status !== "success") {
        this.logger.error(result.message || "Failed to disconnect wallet");
        return;
      }

      if (result.user) {
        this.user_data.user = result.user;
      }
      this.logger.success("Wallet disconnected!");
    } catch (error) {
      this.logger.error(error?.response?.data?.message || error.message);
    }
  }
}
