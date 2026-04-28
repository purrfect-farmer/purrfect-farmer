import ATFAutoBooster from "./ATFAutoBooster.js";
import Encrypter from "@purrfect/shared/lib/Encrypter.js";
import bot from "./bot.js";
import db from "../db/models/index.js";
import farmers from "../farmers/index.js";
import { prepareMaster } from "@purrfect/shared/lib/atf-auto-transactions.js";
import utils from "./utils.js";

class ATFAuto {
  /**
   * @type {Map<number, ATFAuto>}
   */
  static instances = new Map();

  constructor({ id, master, accounts, password }) {
    this.utils = utils;
    this.encryption = Encrypter;
    this.id = id;
    this.master = master;
    this.accounts = accounts;
    this.password = password;
    this.difference = 10;
  }

  async prepareMasterData() {
    console.log("Decrypting master wallet....");
    const masterPhrase = await this.encryption.decryptData({
      ...this.master.encryptedWalletPhrase,
      password: this.password,
      asText: true,
    });

    console.log("Successfully decrypted master wallet!");

    this.masterData = {
      address: this.master.address,
      version: this.master.version,
      tonCenterApiKey: this.master.tonCenterApiKey,
      phrase: masterPhrase,
    };

    console.log("Preparing master wallet...");
    this.prepared = await prepareMaster(this.masterData);
  }

  async getCloudAccount(account) {
    return db.Account.findByPk(account.userId, {
      include: [
        {
          required: true,
          association: "farmers",
          where: {
            farmer: "atf",
            isBanned: false,
            active: true,
          },
        },
      ],
    });
  }

  /** Connect Wallet */
  async connectWallet({ cloudAccount, walletAccount }) {
    console.log("Connecting Wallet:", cloudAccount.id, cloudAccount.farmer.id);
    const FarmerClass = farmers["atf"];
    const runner = new FarmerClass(cloudAccount);

    const version = "v" + walletAccount.version;
    const keyPair = await runner.getKeyPair(walletAccount.phrase);

    /** Prepare runner */
    await runner.prepare();

    /** Connect and sync */
    const connected = await runner.connectAndSyncWallet(keyPair, version);

    if (!connected) {
      throw new Error("Failed to connect wallet!");
    }
  }

  /** Boost account */
  async boostAccount(account) {
    /** Skip if user ID is not set */
    if (!account.userId) return;

    /** Retrieve Cloud Account */
    const cloudAccount = await this.getCloudAccount(account);

    /** Skip if cloud account is missing */
    if (!cloudAccount) return;

    /** Decrypt phrase */
    const phrase = await this.encryption.decryptData({
      ...account.encryptedPhrase,
      password: this.password,
      asText: true,
    });

    /** Create Wallet account */
    const walletAccount = { ...account, phrase };

    /** Instantiate booster */
    const booster = new ATFAutoBooster(
      this.masterData,
      walletAccount,
      this.prepared,
    );

    /** Boost */
    const { jettonAmount } = await booster.boost({
      difference: this.difference,
    });
    await this.utils.delayForSeconds(10);

    /** Connect Wallet */
    await this.connectWallet({
      cloudAccount,
      walletAccount,
    });
    await this.utils.delayForSeconds(5);

    /** Collect token */
    await booster.collect();
    await this.utils.delayForSeconds(10);

    /** Send Boost Notification */
    await this.sendAccountBoostNotification(cloudAccount, jettonAmount);
  }

  /** Send Boost Notification */
  async sendAccountBoostNotification(cloudAccount, jettonAmount) {
    await bot.sendPrivateMessage(this.id, [
      `✅ Boosted (${cloudAccount.id}) with ${jettonAmount} ATF.`,
    ]);
  }

  /** Send Boost Initiated Notification */
  async sendBoostInitiatedNotification() {
    await bot.sendPrivateMessage(this.id, [`⏳ ATF Auto - Boost initiated...`]);
  }

  /** Send Boost Completion Notification */
  async sendBoostCompletionNotification() {
    await bot.sendPrivateMessage(this.id, [
      `✅ ATF Auto Boosted successfully.`,
    ]);
  }

  /** Send Boost Error Notification */
  async sendBoostErrorNotification(e) {
    const errorMessage = e.message || "Unknown error!";

    await bot.sendPrivateMessage(this.id, [
      `❌ ATF Auto - an error occured while boosting!`,
      errorMessage,
    ]);
  }

  /** Boost */
  async boost() {
    try {
      /** Send notification about initiation */
      await this.sendBoostInitiatedNotification();

      /** Prepare master */
      await this.prepareMasterData();

      /** Check jetton balance */
      if (this.prepared.jettonBalance <= 0) {
        throw new Error("Master has no jetton balance");
      }

      /** Loop through accounts and boost */
      for (const account of this.accounts) {
        await this.boostAccount(account);
      }

      /** Notify about boost completion */
      await this.sendBoostCompletionNotification();
    } catch (e) {
      /** Notify about boost error */
      await this.sendBoostErrorNotification(e);
    }
  }

  static boost({ id, password, master, accounts }) {
    if (this.instances.has(id)) return;
    const instance = new this({
      id,
      master,
      accounts,
      password,
    });

    this.instances.set(id, instance);

    instance.boost().finally(() => {
      this.instances.delete(id);
    });
  }
}

export default ATFAuto;
