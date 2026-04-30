import ATFAutoBooster from "./ATFAutoBooster.js";
import ATFAutoWalletTransfer from "./ATFAutoWalletTransfer.js";
import Encrypter from "@purrfect/shared/lib/Encrypter.js";
import bot from "./bot.js";
import db from "../db/models/index.js";
import farmers from "../farmers/index.js";
import logger from "./logger.js";
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

    this.mode = "boost"; // boost or collect
    this.difference = 10;
  }

  async prepareInitialMasterData() {
    logger.info("Decrypting master wallet....");
    const phrase = await this.decryptPhrase(this.master.encryptedWalletPhrase);

    logger.success("Successfully decrypted master wallet!");

    this.masterData = {
      tonCenterApiKey: this.master.tonCenterApiKey,
      address: this.master.address,
      version: this.master.version,
      phrase,
    };

    logger.info("Preparing master wallet...");
    this.prepared = await prepareMaster(this.masterData);
    logger.success("Successfully prepared the master wallet!");
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

  async getRunner(cloudAccount) {
    const FarmerClass = farmers["atf"];
    const runner = new FarmerClass(cloudAccount);

    /** Prepare runner */
    await runner.prepare();

    return runner;
  }

  /** Connect Wallet */
  async connectWallet({ cloudAccount, walletAccount }) {
    /** Seconds of delay before retry */
    const RETRY_SECONDS = 2;

    /** Initial attempts */
    let attempts = 0;

    while (attempts < 3) {
      try {
        /** Log */
        logger.info(
          "Connecting Wallet:",
          cloudAccount.id,
          walletAccount.address,
        );

        /** Get runner */
        const runner = await this.getRunner(cloudAccount);

        /** Connect and sync */
        const version = "v" + walletAccount.version;
        const keyPair = await runner.getKeyPair(walletAccount.phrase);
        const connected = await runner.connectAndSyncWallet(keyPair, version);

        /** Throw error when not connected */
        if (!connected) {
          throw new Error("Failed to connect wallet!");
        }

        /** Log Success */
        logger.success(
          "Connected Wallet:",
          cloudAccount.id,
          walletAccount.address,
        );

        return true;
      } catch (e) {
        logger.error(
          "Failed to connect wallet:",
          cloudAccount.id,
          walletAccount.address,
          e.message,
        );
        attempts++;

        /** Delay before retrying... */
        if (attempts < 3) {
          logger.info(`Retrying in ${RETRY_SECONDS}s... (${attempts}/3)`);
          await this.utils.delayForSeconds(RETRY_SECONDS);
        }
      }
    }

    return false;
  }

  async decryptPhrase(encryptedPhrase) {
    return this.encryption.decryptData({
      ...encryptedPhrase,
      password: this.password,
      asText: true,
    });
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
    logger.info("Decrypting wallet phrase:", account.address);
    const phrase = await this.decryptPhrase(account.encryptedPhrase);
    logger.success("Successfully decrypted wallet phrase:", account.address);

    /** Create Wallet account */
    const walletAccount = { ...account, phrase };

    /** Instantiate booster */
    const booster = new ATFAutoBooster(
      this.masterData,
      walletAccount,
      this.prepared,
    );

    /** Boost */
    logger.info("Boosting account:", cloudAccount.id, account.address);
    const { jettonAmount } = await booster.boost({
      difference: this.difference,
    });

    /** Log boost completion */
    logger.success(
      "Successfully boosted account:",
      cloudAccount.id,
      account.address,
    );

    /** Delay for 10s */
    await this.utils.delayForSeconds(10);

    /** Connect Wallet */
    const connected = await this.connectWallet({
      cloudAccount,
      walletAccount,
    });

    /** Send Boost Notification */
    await bot.sendPrivateMessage(this.id, [
      connected
        ? `⚡ Boosted <b>(${cloudAccount.id})</b> with <i>${jettonAmount} ATF</i>`
        : `❌ Failed to boost <b>(${cloudAccount.id})</b> with <i>${jettonAmount} ATF</i>`,
    ]);

    /** Boost mode - set account as the master */
    if (this.mode === "boost") {
      /** Transfer everything into this account */
      logger.info("Transferring funds into:", account.address);
      const walletTransfer = new ATFAutoWalletTransfer(
        this.masterData,
        account.address,
      );
      await walletTransfer.transfer();
      logger.success("Successfully transferred funds into:", account.address);

      /** Update master data */
      this.masterData = {
        ...this.masterData,
        address: account.address,
        version: account.version,
        phrase,
      };

      /** Prepare account as the master wallet */
      logger.info(`Preparing (${cloudAccount.id}) as master wallet...`);
      this.prepared = await prepareMaster(this.masterData);
      logger.success(
        `Successfully prepared (${cloudAccount.id}) as the master wallet!`,
      );
    } else {
      /** Collect token */
      logger.info("Collecting ATF and TON:", account.address);
      await booster.collect();
      logger.success("Successfully collected ATF and TON:", account.address);
    }

    /** Delay */
    await this.utils.delayForSeconds(20 + Math.floor(Math.random() * 100));
  }

  /** Boost */
  async boost() {
    try {
      /** Send notification about initiation */
      await bot.sendPrivateMessage(this.id, [
        `⏳ ATF Auto - Boost initiated...`,
      ]);

      /** Prepare initial master data */
      await this.prepareInitialMasterData();

      /** Check jetton balance */
      if (this.prepared.jettonBalance <= 0) {
        throw new Error("Master has no jetton balance");
      }

      /** Loop through accounts and boost */
      for (const account of this.accounts) {
        await this.boostAccount(account);
      }

      /** Return funds to master */
      await this.returnFundsToMaster();

      /** Notify about boost completion */
      await bot.sendPrivateMessage(this.id, [`✅ ATF Auto - Boost completed.`]);
    } catch (e) {
      const errorMessage = e.message || "Unknown error!";

      /** Log error */
      logger.error(errorMessage);

      /** Notify about boost error */
      await bot.sendPrivateMessage(this.id, [
        `❌ ATF Auto - an error occurred while boosting!`,
        errorMessage,
      ]);
    }
  }

  /** Return funds to master */
  async returnFundsToMaster() {
    /** Return funds into master */
    if (this.master.address !== this.masterData.address) {
      logger.info("Returning funds into:", this.master.address);
      const walletTransfer = new ATFAutoWalletTransfer(
        this.masterData,
        this.master.address,
      );
      await walletTransfer.transfer();
      logger.success(
        "Successfully transferred funds into:",
        this.master.address,
      );
    }
  }

  /** Collect */
  async collect() {
    try {
      /** Send notification about initiation */
      await bot.sendPrivateMessage(this.id, [
        `⏳ ATF Auto - Collection initiated...`,
      ]);

      /** Prepare initial master data */
      await this.prepareInitialMasterData();

      /** Loop through accounts and collect */
      for (const account of this.accounts) {
        await this.collectAccount(account);
      }

      /** Notify about completion */
      await bot.sendPrivateMessage(this.id, [
        `✅ ATF Auto - Collection completed.`,
      ]);
    } catch (e) {
      const errorMessage = e.message || "Unknown error!";

      /** Log error */
      logger.error(errorMessage);

      /** Notify about boost error */
      await bot.sendPrivateMessage(this.id, [
        `❌ ATF Auto - an error occurred during collection!`,
        errorMessage,
      ]);
    }
  }

  /** Collect account */
  async collectAccount(account) {
    /** Decrypt phrase */
    const phrase = await this.decryptPhrase(account.encryptedPhrase);

    /** Create Wallet account */
    const walletAccount = { ...account, phrase };

    /** Instantiate booster */
    const booster = new ATFAutoBooster(
      this.masterData,
      walletAccount,
      this.prepared,
    );

    /** Collect */
    logger.info("Collecting account:", account.address);
    const { status, skipped, collected, error } = await booster.collect();

    /** Send Notification */
    await bot.sendPrivateMessage(this.id, [
      skipped
        ? `⏩ Skipped <b>(${account.address})</b>`
        : status
          ? `💰 Collected <b>(${account.address})</b> - <i>${collected?.toString()} ATF</i>`
          : `❌ Failed to collect <b>(${account.address})</b>\n<i>Error: ${error?.message || "Unknown error!"}</i>`,
    ]);

    /** Log completion */
    logger.success("Completed collection:", account.address);

    /** Delay for 10s */
    await this.utils.delayForSeconds(5);
  }

  /** Withdraw */
  async withdraw() {
    try {
      /** Send notification about initiation */
      await bot.sendPrivateMessage(this.id, [
        `⏳ ATF Auto - Withdrawal initiated...`,
      ]);

      /** Loop through accounts and withdraw */
      for (const account of this.accounts) {
        await this.withdrawAccount(account);
      }

      /** Notify about completion */
      await bot.sendPrivateMessage(this.id, [
        `✅ ATF Auto - Withdrawal completed.`,
      ]);
    } catch (e) {
      const errorMessage = e.message || "Unknown error!";

      /** Log error */
      logger.error(errorMessage);

      /** Notify about boost error */
      await bot.sendPrivateMessage(this.id, [
        `❌ ATF Auto - an error occurred during withdrawal!`,
        errorMessage,
      ]);
    }
  }

  /** Withdraw account */
  async withdrawAccount(account) {
    /** Skip if user ID is not set */
    if (!account.userId) return;

    /** Retrieve Cloud Account */
    const cloudAccount = await this.getCloudAccount(account);

    /** Skip if cloud account is missing */
    if (!cloudAccount) return;

    /** Result */
    const { status, skipped, message, amount } =
      await this.requestWithdrawal(cloudAccount);

    /** Send Notification */
    await bot.sendPrivateMessage(this.id, [
      skipped
        ? `⏩ Skipped <b>(${cloudAccount.id})</b> - <i>${amount} ATF</i>`
        : status
          ? `🤑 Withdrawn <b>(${cloudAccount.id})</b> - <i>${amount} ATF</i>\n<i>Message: ${message}</i>`
          : `❌ Failed to withdraw <b>(${cloudAccount.id})</b> - <i>${amount} ATF</i>\n<i>Reason: ${message}</i>`,
    ]);

    if (skipped) {
      /** Delay for seconds */
      await this.utils.delayForSeconds(20 + Math.floor(Math.random() * 100));
    } else {
      /** Delay for minutes */
      await this.utils.delayForMinutes(3 + Math.floor(Math.random() * 2));
    }
  }

  /** Request withdrawal */
  async requestWithdrawal(cloudAccount) {
    try {
      /** Log */
      logger.info(
        "Withdrawing account:",
        cloudAccount.id,
        cloudAccount.farmer.id,
      );

      /** Get runner */
      const runner = await this.getRunner(cloudAccount);

      /** Result */
      const { status, skipped, amount, message } = await runner.withdraw();

      /** Log Success */
      logger.success(
        "Completed withdrawal:",
        cloudAccount.id,
        cloudAccount.farmer.id,
        status,
        skipped,
        message,
        amount,
      );

      return { status, skipped, message, amount };
    } catch (e) {
      const errorMessage = e.message || "Unknown error!";

      /** Log error */
      logger.error(errorMessage);

      return {
        status: false,
        skipped: false,
        message: errorMessage,
        amount: 0,
      };
    }
  }

  static execute({ id, password, master, accounts }, callback) {
    if (this.instances.has(id)) return;
    const instance = new this({
      id,
      password,
      master,
      accounts,
    });

    this.instances.set(id, instance);

    callback(instance).finally(() => {
      this.instances.delete(id);
    });
  }

  static boost(options) {
    this.execute(options, (instance) => instance.boost());
  }

  static collect(options) {
    this.execute(options, (instance) => instance.collect());
  }

  static withdraw(options) {
    this.execute(options, (instance) => instance.withdraw());
  }
}

export default ATFAuto;
