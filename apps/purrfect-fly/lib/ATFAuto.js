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

    this.mode = "roll"; // roll or collect
    this.difference = 10;
    this.controller = new AbortController();
    this.signal = this.controller.signal;

    this.signal.addEventListener("abort", this.handleCancellationSignal);
  }

  /** Handle cancellation signal */
  handleCancellationSignal = () => {
    return bot.sendPrivateMessage(this.id, [
      `<i>🛑 ATF Auto - Stopping operation...</i>`,
    ]);
  };

  /** Send cancellation completion notification */
  sendCancellationCompletionNotification() {
    return bot.sendPrivateMessage(this.id, [
      `<i>🛑 ATF Auto - Operation stopped. Remaining accounts skipped.</i>`,
    ]);
  }

  /** Truncate address */
  truncateAddress(address) {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  }

  /** Format account position */
  formatAccountPosition(index) {
    return `(<i><b>${index + 1}</b>/<b>${this.accounts.length}</b></i>)`;
  }

  /** Delay for safe seconds */
  delayForSafeSeconds() {
    return this.utils.delayForSeconds(30 + Math.floor(Math.random() * 90), {
      signal: this.signal,
    });
  }

  /** Delay for safe minutes */
  delayForSafeMinutes() {
    return this.utils.delayForMinutes(3 + Math.floor(Math.random() * 2), {
      signal: this.signal,
    });
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
    const cloudAccount = await db.Account.findByPk(account.userId, {
      include: [
        {
          required: false,
          association: "farmers",
          where: {
            farmer: "atf",
          },
        },
      ],
    });

    if (!cloudAccount) return;
    if (!cloudAccount.session && !cloudAccount.farmer?.active) return;
    if (cloudAccount.farmer?.isBanned) return;

    return cloudAccount;
  }

  async getRunner(cloudAccount) {
    const FarmerClass = farmers["atf"];

    /** Terminate */
    FarmerClass.terminate(cloudAccount.id);

    const runner = new FarmerClass(cloudAccount);

    /** Prepare runner */
    await runner.prepare();

    /** Delay for 5s */
    await this.utils.delayForSeconds(5);

    return runner;
  }

  /** Connect Wallet */
  async connectWallet({ cloudAccount, walletAccount }) {
    /** Seconds of delay before retry */
    const RETRY_SECONDS = 5;

    /** Initial attempts */
    let attempts = 0;
    let errorMessage;

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
        const { status, message } = await runner.connectAndSyncWallet(
          keyPair,
          version,
        );

        /** Throw error when not connected */
        if (!status) {
          throw new Error(message);
        }

        /** Log Success */
        logger.success(
          "Connected Wallet:",
          cloudAccount.id,
          walletAccount.address,
        );

        /** Delay for 5s */
        await this.utils.delayForSeconds(5);

        /** Start or claim mining */
        await runner.startOrClaimMining();

        return { status: true };
      } catch (e) {
        errorMessage = e.message;
        logger.error(
          "Failed to connect wallet:",
          cloudAccount.id,
          walletAccount.address,
          errorMessage,
        );
        attempts++;

        /** Delay before retrying... */
        if (attempts < 3) {
          logger.info(`Retrying in ${RETRY_SECONDS}s... (${attempts}/3)`);
          await this.utils.delayForSeconds(RETRY_SECONDS);
        }
      }
    }

    return { status: false, message: errorMessage };
  }

  async decryptPhrase(encryptedPhrase) {
    return this.encryption.decryptData({
      ...encryptedPhrase,
      password: this.password,
      asText: true,
    });
  }

  /** Process boost for account */
  async processBoost(account, index) {
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
    const { status, message } = await this.connectWallet({
      cloudAccount,
      walletAccount,
    });

    /** Send Boost Notification */
    await bot.sendPrivateMessage(this.id, [
      status
        ? `⚡ Boosted <b>(${cloudAccount.id})</b> with <i>${jettonAmount} ATF</i> ${this.formatAccountPosition(index)}`
        : `❌ Failed to boost <b>(${cloudAccount.id})</b> with <i>${jettonAmount} ATF</i> ${this.formatAccountPosition(index)}\n<i>Error: ${message || "Unknown error!"}</i>`,
    ]);

    /** Delay for 5s */
    await this.utils.delayForSeconds(5);

    /** Apply mode */
    await this.applyMode(account, phrase, booster);

    /** Delay */
    if (cloudAccount.farmer) {
      await this.delayForSafeSeconds();
    } else {
      /** Delay for minutes */
      await this.delayForSafeMinutes();
    }
  }

  /** Apply mode */
  async applyMode(account, phrase, booster) {
    if (this.mode === "roll") {
      await this.rollToAccount(account, phrase);
    } else {
      await this.collectTokensFromAccount(account, booster);
    }
  }

  /** Collect from account */
  async collectTokensFromAccount(account, booster) {
    /** Collect token */
    logger.info("Collecting ATF and TON:", account.address);
    await booster.collect();
    logger.success("Successfully collected ATF and TON:", account.address);
  }

  /** Roll to account */
  async rollToAccount(account, phrase) {
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

    /** Delay for 5s */
    await this.utils.delayForSeconds(5);

    /** Prepare account as the master wallet */
    logger.info(`Preparing (${account.address}) as master wallet...`);
    this.prepared = await prepareMaster(this.masterData);
    logger.success(
      `Successfully prepared (${account.address}) as the master wallet!`,
    );
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
      for (const [index, account] of this.accounts.entries()) {
        if (this.signal.aborted) {
          break;
        }
        await this.processBoost(account, index);
      }

      /** Return funds to master */
      await this.returnFundsToMaster();

      /** Notify about cancellation */
      if (this.signal.aborted) {
        await this.sendCancellationCompletionNotification();
      } else {
        /** Notify about boost completion */
        await bot.sendPrivateMessage(this.id, [
          `✅ ATF Auto - Boost completed.`,
        ]);
      }
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
      for (const [index, account] of this.accounts.entries()) {
        if (this.signal.aborted) {
          break;
        }
        await this.processCollect(account, index);
      }

      /** Notify about completion */
      if (this.signal.aborted) {
        await this.sendCancellationCompletionNotification();
      } else {
        await bot.sendPrivateMessage(this.id, [
          `✅ ATF Auto - Collection completed.`,
        ]);
      }
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

  /** Process collect */
  async processCollect(account, index) {
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
        ? `⏩ Skipped <b>(${this.truncateAddress(account.address)})</b> ${this.formatAccountPosition(index)}`
        : status
          ? `💰 Collected <b>(${this.truncateAddress(account.address)})</b> - <i>${collected?.toString()} ATF</i> ${this.formatAccountPosition(index)}`
          : `❌ Failed to collect <b>(${this.truncateAddress(account.address)})</b> ${this.formatAccountPosition(index)}\n<i>Error: ${error?.message || "Unknown error!"}</i>`,
    ]);

    /** Log completion */
    logger.success("Completed collection:", account.address);

    /** Delay for 5s */
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
      for (const [index, account] of this.accounts.entries()) {
        if (this.signal.aborted) {
          break;
        }
        await this.processWithdraw(account, index);
      }

      /** Notify about cancellation completion */
      if (this.signal.aborted) {
        await this.sendCancellationCompletionNotification();
      } else {
        /** Notify about completion */
        await bot.sendPrivateMessage(this.id, [
          `✅ ATF Auto - Withdrawal completed.`,
        ]);
      }
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
  async processWithdraw(account, index) {
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
        ? `⏩ Skipped <b>(${cloudAccount.id})</b> - <i>${amount} ATF</i> ${this.formatAccountPosition(index)}`
        : status
          ? `🤑 Withdrawn <b>(${cloudAccount.id})</b> - <i>${amount} ATF</i> ${this.formatAccountPosition(index)}\n<i>Message: ${message}</i>`
          : `❌ Failed to withdraw <b>(${cloudAccount.id})</b> - <i>${amount} ATF</i> ${this.formatAccountPosition(index)}\n<i>Reason: ${message}</i>`,
    ]);

    if (skipped) {
      /** Delay for seconds */
      await this.delayForSafeSeconds();
    } else {
      /** Delay for minutes */
      await this.delayForSafeMinutes();
    }
  }

  /** Request withdrawal */
  async requestWithdrawal(cloudAccount) {
    try {
      /** Log */
      logger.info("Withdrawing account:", cloudAccount.id);

      /** Get runner */
      const runner = await this.getRunner(cloudAccount);

      /** Delay for 5s */
      await this.utils.delayForSeconds(5);

      /** Start or Claim Mining */
      await runner.startOrClaimMining(true);

      /** Delay for 5s */
      await this.utils.delayForSeconds(5);

      /** Result */
      const { status, skipped, amount, message } = await runner.withdraw();

      /** Log Success */
      logger.success(
        "Completed withdrawal:",
        cloudAccount.id,
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

  /** Cancel operation */
  cancel() {
    this.controller.abort();
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

  static cancel({ id }) {
    const instance = this.instances.get(id);
    if (instance) {
      instance.cancel();
    }
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
