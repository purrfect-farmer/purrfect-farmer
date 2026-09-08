import AutoBooster from "./AutoBooster.js";
import AutoWalletTransfer from "./AutoWalletTransfer.js";
import Decimal from "decimal.js";
import Encrypter from "@purrfect/shared/lib/Encrypter.js";
import bot from "./bot.js";
import db from "../db/models/index.js";
import farmers from "../farmers/index.js";
import logger from "./logger.js";
import { prepareMaster } from "@purrfect/shared/lib/auto/transactions.js";
import utils from "./utils.js";

/**
 * BaseAuto
 */
class BaseAuto {
  /** @type {string} id of the farmer this drop farms */
  static farmerId = null;

  /** @type {string} id of the auto itself, e.g. "atf-auto" */
  static id = null;

  /** @type {string} human-readable name, e.g. "ATF Auto" */
  static title = null;

  /** @type {string} token symbol used in notifications, e.g. "ATF" */
  static token = null;

  /** @type {string} jetton master address moved by boost/collect */
  static jettonAddress = null;

  /**
   * @type {Map<number, BaseAuto>} redeclared per subclass so operations for
   * different drops can run concurrently for the same user.
   */
  static instances = new Map();

  constructor({
    id,
    master,
    accounts,
    password,
    amount = "",
    delay = 0,
    difference = 0,
    freeze = false,
    runFarmer = true,
    repeat = false,
    repeatInterval = 15,
  }) {
    this.utils = utils;
    this.encryption = Encrypter;

    /** Drop descriptor */
    this.farmerId = this.constructor.farmerId;
    this.title = this.constructor.title;
    this.token = this.constructor.token;
    this.jettonAddress = this.constructor.jettonAddress;

    /** Abort controller and signal */
    this.controller = new AbortController();
    this.signal = this.controller.signal;

    /** Accounts terminated (excluded from farming batches) by this operation */
    this.terminatedAccounts = new Set();

    /** Core properties */
    this.id = id;
    this.master = master;
    this.accounts = accounts;
    this.password = password;

    /** Configurable properties */
    this.delay = Number(delay);
    this.difference = Number(difference);
    this.amount = amount;
    this.freeze = freeze;
    this.runFarmer = runFarmer;
    this.repeat = repeat;
    this.repeatInterval = Number(repeatInterval);
    /** Boost mode */
    this.mode = "roll"; // roll or collect

    this.signal.addEventListener("abort", this.handleCancellationSignal);
  }

  /** Handle cancellation signal */
  handleCancellationSignal = () => {
    return this.sendNotification([
      `<i>🛑 ${this.title} - Stopping operation...</i>`,
    ]);
  };

  /** Send cancellation completion notification */
  sendCancellationCompletionNotification() {
    return this.sendNotification([
      `<i>🛑 ${this.title} - Operation stopped. Remaining accounts skipped.</i>`,
    ]);
  }

  /** Send pending operation notification */
  sendPendingOperationNotification() {
    return this.sendNotification([
      `<i>⚠️ ${this.title} - an operation is currently in progress. Please cancel it first!</i>`,
    ]);
  }

  /** Is Last Account */
  isLastAccount(index) {
    return index === this.accounts.length - 1;
  }

  /** Truncate address */
  truncateAddress(address) {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  }

  /** Format account position */
  formatAccountPosition(index) {
    return `(<i><b>${index + 1}</b>/<b>${this.accounts.length}</b></i>)`;
  }

  /** Format key value message */
  formatKeyValue(key, value) {
    return `<b>|</b> ${key}: <b>${value}</b>`;
  }

  /** Format account link */
  formatAccountLink(id) {
    return `<a href="tg://user?id=${id}">${id}</a>`;
  }

  /** Format address link */
  formatAddressLink(address) {
    return `<a href="https://tonviewer.com/${address}">${this.truncateAddress(address)}</a>`;
  }

  /**
   * Format a summary's wallet. Drops that link a wallet by raw address (rather
   * than by key) have no version to show.
   */
  formatWallet(wallet) {
    const link = this.formatAddressLink(wallet.address);
    return wallet.version ? `(${wallet.version.toUpperCase()}) ${link}` : link;
  }

  /** Whether an account's balance has reached the drop's withdrawal minimum */
  isWithdrawable(summary) {
    if (!summary?.minWithdrawal) return false;
    return new Decimal(summary.balance || 0).greaterThanOrEqualTo(
      summary.minWithdrawal,
    );
  }

  /** Format accounts */
  formatAccounts() {
    return this.formatKeyValue("Accounts to process", this.accounts.length);
  }

  /** Format the delay */
  formatDelay() {
    return this.formatKeyValue("Delay", `${this.delay}m`);
  }

  /** Format the difference */
  formatDifference() {
    return this.formatKeyValue("Difference", `${this.difference}%`);
  }

  /**
   * Whether boosted accounts should be left frozen.
   *
   * A repeating run always freezes: the next pass re-connects and re-boosts
   * every account, so farming in between would only fight it.
   */
  shouldFreezeAccounts() {
    return Boolean(this.repeat || this.freeze);
  }

  /** Format the freeze */
  formatFreeze() {
    return this.formatKeyValue(
      "Freeze",
      this.shouldFreezeAccounts() ? "Enabled" : "Disabled",
    );
  }

  /** Format the farmer run */
  formatRunFarmer() {
    return this.formatKeyValue(
      "Run Farmer",
      this.runFarmer ? "Enabled" : "Disabled",
    );
  }

  /** Format the repeat */
  formatRepeat() {
    return this.formatKeyValue("Repeat", this.repeat ? "Enabled" : "Disabled");
  }

  /** Format the repeat interval */
  formatRepeatInterval() {
    return this.formatKeyValue("Repeat Interval", `${this.repeatInterval}h`);
  }

  /** Format the maximum amount */
  formatMaximumAmount() {
    return this.formatKeyValue(
      "Max. Amount",
      this.amount ? `${this.amount} ${this.token}` : "(none)",
    );
  }

  /** Delay for safe seconds */
  delayForSafeSeconds() {
    return this.utils
      .delayForSeconds(60 + Math.floor(Math.random() * 30), {
        signal: this.signal,
      })
      .catch((error) => {});
  }

  /** Delay for safe minutes */
  delayForSafeMinutes() {
    return this.utils
      .delayForMinutes(this.delay, {
        signal: this.signal,
        precised: true,
      })
      .catch((error) => {});
  }

  /** Delay for safe burst */
  delayForSafeBurst() {
    return this.utils
      .delayForMinutes(10, {
        signal: this.signal,
      })
      .catch((error) => {});
  }

  /** Burst operation */
  async burstBoost() {
    /** Send notification */
    await this.sendNotification([
      `<i>🟡 ${this.title} - Bursting boost operation for 20 minutes...</i>`,
    ]);

    /** Return funds to master */
    await this.returnFundsToMaster();

    /** Delay for safe burst */
    await this.delayForSafeBurst();

    /** Prepare master data */
    await this.prepareInitialMasterData();

    /** Send notification */
    await this.sendNotification([
      `<i>🟢 ${this.title} - Boost operation resumed!</i>`,
    ]);
  }

  /** Send Notification */
  sendNotification(messages) {
    return bot.sendPrivateMessage(this.id, messages, {
      ["link_preview_options"]: {
        ["is_disabled"]: true,
      },
    });
  }

  /** Send Summary Notification */
  sendSummaryNotification(results, messages) {
    const { successful, failed, skipped, total } =
      this.getSummaryCounts(results);
    return this.sendNotification([
      "ℹ️ Operation Summary",
      ...messages,
      this.formatKeyValue("Total Accounts", `${total}/${this.accounts.length}`),
      this.formatKeyValue("Successful Accounts", `${successful}`),
      this.formatKeyValue("Skipped Accounts", `${skipped}`),
      this.formatKeyValue("Failed Accounts", `${failed}`),
    ]);
  }

  /** Get Summary Counts */
  getSummaryCounts(results) {
    const successful = results.filter(
      (result) => result.status && !result.skipped,
    ).length;
    const failed = results.filter(
      (result) => !result.status && !result.skipped,
    ).length;
    const skipped = results.filter((result) => result.skipped).length;
    const total = results.filter((result) => !result.skipped).length;

    return {
      successful,
      failed,
      skipped,
      total,
    };
  }

  /** Prepare initial master data */
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
    this.prepared = await prepareMaster(this.masterData, this.jettonAddress);
    logger.success("Successfully prepared the master wallet!");
  }

  /** Get cloud account */
  async getCloudAccount(account, allowFrozen = false) {
    const cloudAccount = await db.Account.findByPk(account.userId, {
      include: [
        {
          required: false,
          association: "farmers",
          where: {
            farmer: this.farmerId,
          },
        },
      ],
    });

    /** Skip if cloud account is missing */
    if (!cloudAccount) return;

    /** Skip if cloud account is not active */
    if (!cloudAccount.session && !cloudAccount.farmer?.status === "active")
      return;

    /** Skip if cloud account is banned */
    if (cloudAccount.farmer?.status === "banned") return;

    /** Skip if cloud account is frozen and not allowed */
    if (!allowFrozen && cloudAccount.farmer?.status === "frozen") return;

    return cloudAccount;
  }

  /** Get runner */
  async getRunner(cloudAccount) {
    const FarmerClass = farmers[this.farmerId];

    /** Terminate (excludes the account from farming batches until resumed) */
    FarmerClass.terminate(cloudAccount.id);
    this.terminatedAccounts.add(cloudAccount.id);

    /** Delay for 2s */
    await this.utils.delayForSeconds(2, { signal: this.signal });

    /** @type {import("@purrfect/shared/lib/BaseFarmer.js").default} */
    const runner = new FarmerClass({
      account: cloudAccount,
      referralLink: FarmerClass.getInstanceReferralLink(),
    });

    /**
     * Hand the runner this operation's signal so cancelling the operation
     * also cancels the runner's requests, delays and farming pass.
     */
    runner.adoptSignal(this.signal);

    /** Disable caching */
    runner.setCacheAuth(false);
    runner.setCacheTelegramWebApp(false);

    /** Prepare runner */
    await runner.prepare();

    /** Delay for 1s */
    await this.utils.delayForSeconds(1, { signal: this.signal });

    return runner;
  }

  /** Connect Wallet */
  async connectWallet({ cloudAccount, walletAccount, jettonAmount }) {
    /** Seconds of delay before retry */
    const RETRY_SECONDS = 1;

    /** Maximum attempts */
    const MAX_ATTEMPTS = 3;

    /** Initial attempts */
    let attempts = 0;
    let errorMessage;

    while (attempts < MAX_ATTEMPTS) {
      /** Stop retrying once the operation is cancelled */
      if (this.signal.aborted) {
        return { status: false, message: "Operation cancelled!" };
      }

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
        const { status, summary, message } = await this.syncWallet(
          runner,
          walletAccount,
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

        /** Wait for the boosted tokens to show up in the drop's view */
        const { summary: settledSummary, settled } =
          await this.syncBoostedHolding({
            runner,
            cloudAccount,
            walletAccount,
            summary,
            jettonAmount,
          });

        try {
          /** Set farmer status */
          if (runner.farmer) {
            runner.farmer.status = this.shouldFreezeAccounts()
              ? "frozen"
              : "active";
            await runner.farmer.save();
          }

          /**
           * Execute runner.
           *
           * Skipped when the run is only meant to register wallets with the
           * drop.
           */
          if (this.runFarmer) {
            /** Delay for 1s */
            await this.utils.delayForSeconds(1, { signal: this.signal });

            await runner.start();
          }
        } catch (e) {
          logger.error(
            "Failed to set farmer status and start runner:",
            cloudAccount.id,
            e.message,
          );
        }

        return { status: true, summary: settledSummary, settled };
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
          await this.utils.delayForSeconds(RETRY_SECONDS, {
            signal: this.signal,
            precised: true,
          });
        }
      }
    }

    return { status: false, message: errorMessage };
  }

  /** Connect the wallet and let the drop re-read it */
  syncWallet(runner, walletAccount) {
    return runner.connectAutoWallet({
      phrase: walletAccount.phrase,
      address: walletAccount.address,
      version: walletAccount.version,
    });
  }

  /**
   * Reconnect until the drop sees the tokens we boosted with.
   *
   * The boost transfer is fired without waiting for it to land, so the first
   * connect usually reports the holding from before it arrived. Reconnecting is
   * what makes the drop re-read the wallet, so keep doing it until the holding
   * covers what was sent.
   */
  async syncBoostedHolding({
    runner,
    cloudAccount,
    walletAccount,
    summary,
    jettonAmount,
  }) {
    /** Seconds of delay between re-syncs */
    const RETRY_SECONDS = 5;

    /** Maximum re-syncs, i.e. how long the transfer is given to land */
    const MAX_ATTEMPTS = 12;

    const expected = new Decimal(jettonAmount || 0);

    /** Nothing was sent, so whatever the drop reports is already current */
    if (expected.lessThanOrEqualTo(0)) {
      return { summary, settled: true };
    }

    let current = summary;
    let attempts = 0;

    while (true) {
      const holding = new Decimal(current?.holding || 0);

      if (holding.greaterThanOrEqualTo(expected)) {
        if (attempts > 0) {
          logger.success(
            "Boost settled:",
            cloudAccount.id,
            `${holding} / ${expected} ${this.token}`,
          );
        }
        return { summary: current, settled: true };
      }

      if (attempts >= MAX_ATTEMPTS) break;

      attempts++;

      logger.warn(
        "Waiting for boost to land:",
        cloudAccount.id,
        `${holding} / ${expected} ${this.token}`,
        `(${attempts}/${MAX_ATTEMPTS})`,
      );

      await this.utils.delayForSeconds(RETRY_SECONDS, { signal: this.signal });

      const {
        status,
        summary: synced,
        message,
      } = await this.syncWallet(runner, walletAccount);

      /** Keep the last good summary and try again */
      if (!status) {
        logger.error("Failed to re-sync wallet:", cloudAccount.id, message);
        continue;
      }

      current = synced;
    }

    logger.warn(
      "Boost never settled:",
      cloudAccount.id,
      `${new Decimal(current?.holding || 0)} / ${expected} ${this.token}`,
    );

    return { summary: current, settled: false };
  }

  /** Decrypt phrase */
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
    const cloudAccount = await this.getCloudAccount(account, true);

    /** Skip if cloud account is missing */
    if (!cloudAccount) return;

    /** Decrypt phrase */
    logger.info("Decrypting wallet phrase:", account.address);
    const phrase = await this.decryptPhrase(account.encryptedPhrase);
    logger.success("Successfully decrypted wallet phrase:", account.address);

    /** Create Wallet account */
    const walletAccount = { ...account, phrase };

    /** Instantiate booster */
    const booster = new AutoBooster(
      this.masterData,
      walletAccount,
      this.prepared,
    );

    /** Boost — skipped when the master has nothing to send */
    logger.info("Boosting account:", cloudAccount.id, account.address);
    const { jettonAmount, skipped } = await booster.boost({
      difference: this.difference,
    });

    /** Log boost completion */
    logger.success(
      skipped
        ? "Nothing to boost account with:"
        : "Successfully boosted account:",
      cloudAccount.id,
      account.address,
    );

    /** Give the transfer time to land. Nothing is in flight when skipped */
    if (!skipped) {
      await this.utils.delayForSeconds(3, { signal: this.signal });
    }

    /** Connect Wallet */
    const { status, message, summary, settled } = await this.connectWallet({
      cloudAccount,
      walletAccount,
      jettonAmount,
    });

    /** Send Boost Notification */
    const link = this.formatAccountLink(cloudAccount.id);
    const position = this.formatAccountPosition(index);
    const action = skipped ? "connect" : "boost";

    await this.sendNotification([
      status
        ? skipped
          ? `🔗 Connected <b>(${link})</b> holding <i>${summary.holding} ${this.token}</i> — no ${this.token} in master to boost with ${position}`
          : settled
            ? `⚡ Boosted <b>(${link})</b> with <i>${summary.holding} ${this.token}</i> ${position}`
            : `⏳ Boosted <b>(${link})</b> with <i>${jettonAmount} ${this.token}</i>, but the drop still reads <i>${summary.holding} ${this.token}</i> ${position}`
        : `❌ Failed to ${action} <b>(${link})</b>${skipped ? "" : ` with <i>${jettonAmount} ${this.token}</i>`} ${position}\n<i>Error: ${message || "Unknown error!"}</i>`,
    ]);

    /** Delay for 2s */
    await this.utils.delayForSeconds(2, { signal: this.signal });

    /**
     * Apply mode.
     *
     * Rolling exists to daisy-chain the tokens onward, so with none to send it
     * would only shuffle the master's TON through every account for gas.
     * Collecting still runs — it guards itself, and may recover jettons an
     * earlier run left behind.
     */
    if (!skipped || this.mode !== "roll") {
      await this.applyMode(account, phrase, booster);
    }

    /** Delay for minutes */
    if (!this.isLastAccount(index)) {
      const currentIndex = index + 1;
      const shouldBurst = false; // TODO: Make this dynamic
      if (shouldBurst && currentIndex % 20 === 0) {
        await this.burstBoost();
      } else {
        await this.delayForSafeMinutes();
      }
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
    logger.info(`Collecting ${this.token} and TON:`, account.address);
    await booster.collect();
    logger.success(
      `Successfully collected ${this.token} and TON:`,
      account.address,
    );
  }

  /** Roll to account */
  async rollToAccount(account, phrase) {
    /** Transfer everything into this account */
    logger.info("Transferring funds into:", account.address);
    const walletTransfer = new AutoWalletTransfer(
      this.masterData,
      account.address,
      this.jettonAddress,
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

    /** Delay for 2s */
    await this.utils.delayForSeconds(2, { signal: this.signal });

    /** Prepare account as the master wallet */
    logger.info(`Preparing (${account.address}) as master wallet...`);
    this.prepared = await prepareMaster(this.masterData, this.jettonAddress);
    logger.success(
      `Successfully prepared (${account.address}) as the master wallet!`,
    );
  }

  /** Boost */
  async boost() {
    try {
      while (true) {
        /** Check if the operation is aborted */
        if (this.signal.aborted) {
          break;
        }

        /** Send notification about initiation */
        await this.sendNotification([
          `⏳ ${this.title} - Boost initiated...`,
          this.formatAccounts(),
          this.formatDelay(),
          this.formatDifference(),
          this.formatFreeze(),
          this.formatRunFarmer(),
          this.formatRepeat(),
          this.formatRepeatInterval(),
        ]);

        /** Prepare initial master data */
        await this.prepareInitialMasterData();

        /**
         * An empty master is not a reason to abandon the run. Connecting each
         * wallet is what registers the account with the drop and refreshes its
         * holding, and that is worth doing with or without tokens to send.
         */
        if (this.prepared.jettonBalance.lessThanOrEqualTo(0)) {
          await this.sendNotification([
            `<i>🟡 ${this.title} - Master has no ${this.token}. Connecting wallets without boosting...</i>`,
          ]);
        }

        /** Loop through accounts and boost */
        for (const [index, account] of this.accounts.entries()) {
          if (this.signal.aborted) {
            break;
          }

          try {
            await this.processBoost(account, index);
          } catch (e) {
            if (this.signal.aborted) break;
            throw e;
          }
        }

        /** Return funds to master */
        await this.returnFundsToMaster();

        /** Notify about cancellation */
        if (this.signal.aborted) {
          await this.sendCancellationCompletionNotification();
        } else {
          /** Notify about boost completion */
          await this.sendNotification([`✅ ${this.title} - Boost completed.`]);

          if (this.repeat) {
            /** Calculate repeat time */
            const repeatTime = this.utils.dateFns.addHours(
              new Date(),
              this.repeatInterval,
            );

            /** Notify about repeat time */
            await this.sendNotification([
              `<i>🔄 ${this.title} - Boosting again at ${repeatTime.toUTCString()}</i>`,
            ]);

            /** Delay for repeat interval in hours */
            await this.utils.delayForHours(this.repeatInterval, {
              signal: this.signal,
              precised: true,
            });
          } else {
            /** Break the loop */
            break;
          }
        }
      }
    } catch (e) {
      const errorMessage = e.message || "Unknown error!";

      /** Log error */
      logger.error(errorMessage);

      /** Notify about boost error */
      await this.sendNotification([
        `❌ ${this.title} - an error occurred while boosting!`,
        errorMessage,
      ]);
    }
  }

  /** Return funds to master */
  async returnFundsToMaster() {
    /** Return funds into master */
    if (this.master.address !== this.masterData.address) {
      logger.info("Returning funds into:", this.master.address);
      const walletTransfer = new AutoWalletTransfer(
        this.masterData,
        this.master.address,
        this.jettonAddress,
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
      await this.sendNotification([
        `⏳ ${this.title} - Collection initiated...`,
        this.formatAccounts(),
      ]);

      /** Prepare initial master data */
      await this.prepareInitialMasterData();

      /** Results */
      const results = [];

      /** Loop through accounts and collect */
      for (const [index, account] of this.accounts.entries()) {
        if (this.signal.aborted) {
          break;
        }

        try {
          /** Process collect */
          const result = await this.processCollect(account, index);

          /** Add result to results */
          results.push(result);
        } catch (e) {
          /** Cancellation, not a collection failure */
          if (this.signal.aborted) break;
          throw e;
        }
      }

      /** Notify about completion */
      if (this.signal.aborted) {
        await this.sendCancellationCompletionNotification();
      } else {
        /** Notify about completion */
        await this.sendNotification([
          `✅ ${this.title} - Collection completed!`,
        ]);
      }

      /** Calculate total amount */
      const totalAmount = results.reduce(
        (acc, result) => acc.plus(result.collected),
        new Decimal(0),
      );

      /** Format total amount */
      const totalAmountFormatted = totalAmount
        .toDecimalPlaces(4, Decimal.ROUND_DOWN)
        .toString();

      /** Notify about summary */
      await this.sendSummaryNotification(results, [
        this.formatKeyValue(
          "Total collected",
          `💰 ${totalAmountFormatted} ${this.token}`,
        ),
      ]);
    } catch (e) {
      const errorMessage = e.message || "Unknown error!";

      /** Log error */
      logger.error(errorMessage);

      /** Notify about boost error */
      await this.sendNotification([
        `❌ ${this.title} - an error occurred during collection!`,
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
    const booster = new AutoBooster(
      this.masterData,
      walletAccount,
      this.prepared,
    );

    /** Collect */
    logger.info("Collecting account:", account.address);
    const result = await booster.collect();
    const { status, skipped, collected, error } = result;

    /** Send Notification */
    await this.sendNotification([
      skipped
        ? `⏩ Skipped <b>(${this.truncateAddress(account.address)})</b> ${this.formatAccountPosition(index)}`
        : status
          ? `💰 Collected <b>(${this.truncateAddress(account.address)})</b> - <i>${collected?.toString()} ${this.token}</i> ${this.formatAccountPosition(index)}`
          : `❌ Failed to collect <b>(${this.truncateAddress(account.address)})</b> ${this.formatAccountPosition(index)}\n<i>Error: ${error?.message || "Unknown error!"}</i>`,
    ]);

    /** Log completion */
    logger.success("Completed collection:", account.address);

    /** Delay for 2s */
    await this.utils.delayForSeconds(2, { signal: this.signal });

    return result;
  }

  /** Withdraw */
  async withdraw() {
    try {
      /** Send notification about initiation */
      await this.sendNotification([
        `⏳ ${this.title} - Withdrawal initiated...`,
        this.formatAccounts(),
        this.formatDelay(),
        this.formatDifference(),
        this.formatMaximumAmount(),
      ]);

      /** Results */
      const results = [];

      /** Loop through accounts and withdraw */
      for (const [index, account] of this.accounts.entries()) {
        if (this.signal.aborted) {
          break;
        }

        try {
          /** Process withdraw */
          const result = await this.processWithdraw(account, index);

          /** Add result to results (accounts without a cloud account yield none) */
          if (result) results.push(result);
        } catch (e) {
          /** Cancellation, not a withdrawal failure: report what was done */
          if (this.signal.aborted) break;
          throw e;
        }
      }

      /** Notify about cancellation completion */
      if (this.signal.aborted) {
        await this.sendCancellationCompletionNotification();
      } else {
        /** Notify about completion */
        await this.sendNotification([
          `✅ ${this.title} - Withdrawal completed!`,
        ]);
      }

      /** Calculate total amount */
      const totalAvailableAmount = results.reduce(
        (acc, result) => acc.plus(result.amount),
        new Decimal(0),
      );

      /** Calculate total withdrawn amount */
      const totalWithdrawnAmount = results
        .filter((result) => result.status)
        .reduce((acc, result) => acc.plus(result.amount), new Decimal(0));

      /** Format total available amount */
      const totalAvailableAmountFormatted = totalAvailableAmount
        .toDecimalPlaces(4, Decimal.ROUND_DOWN)
        .toString();

      /** Format total withdrawn amount */
      const totalWithdrawnAmountFormatted = totalWithdrawnAmount
        .toDecimalPlaces(4, Decimal.ROUND_DOWN)
        .toString();

      /** Notify about summary */
      await this.sendSummaryNotification(results, [
        this.formatKeyValue(
          "Total withdrawn",
          `🤑 ${totalWithdrawnAmountFormatted}/${totalAvailableAmountFormatted} ${this.token}`,
        ),
      ]);
    } catch (e) {
      const errorMessage = e.message || "Unknown error!";

      /** Log error */
      logger.error(errorMessage);

      /** Notify about boost error */
      await this.sendNotification([
        `❌ ${this.title} - an error occurred during withdrawal!`,
        errorMessage,
      ]);
    }
  }

  /** Withdraw account */
  async processWithdraw(account, index) {
    /** Skip if user ID is not set */
    if (!account.userId) return;

    /** Retrieve Cloud Account */
    const cloudAccount = await this.getCloudAccount(account, true);

    /** Skip if cloud account is missing */
    if (!cloudAccount) return;

    /** Result */
    const result = await this.requestWithdrawal(cloudAccount);

    /** Destructure result */
    const { status, skipped, message, amount } = result;

    /** Send Notification */
    await this.sendNotification([
      skipped
        ? `⏩ Skipped <b>(${this.formatAccountLink(cloudAccount.id)})</b> - <i>${amount} ${this.token}</i> ${this.formatAccountPosition(index)}`
        : status
          ? `🤑 Withdrawn <b>(${this.formatAccountLink(cloudAccount.id)})</b> - <i>${amount} ${this.token}</i> ${this.formatAccountPosition(index)}\n<i>Message: ${message}</i>`
          : `❌ Failed to withdraw <b>(${this.formatAccountLink(cloudAccount.id)})</b> - <i>${amount} ${this.token}</i> ${this.formatAccountPosition(index)}\n<i>Reason: ${message}</i>`,
    ]);

    /** Delay */
    if (!this.isLastAccount(index)) {
      if (skipped) {
        /** Delay for seconds */
        await this.delayForSafeSeconds();
      } else {
        /** Delay for minutes */
        await this.delayForSafeMinutes();
      }
    }

    return result;
  }

  /** Request withdrawal */
  async requestWithdrawal(cloudAccount) {
    try {
      /** Log */
      logger.info("Withdrawing account:", cloudAccount.id);

      /** Get runner */
      const runner = await this.getRunner(cloudAccount);

      /** Delay for 5s */
      await this.utils.delayForSeconds(5, { signal: this.signal });

      /** Claim whatever is pending so the full balance is withdrawable */
      await runner.refreshAutoState();

      /** Delay for 5s */
      await this.utils.delayForSeconds(5, { signal: this.signal });

      /** Result */
      const { status, skipped, amount, message } = await runner.withdraw({
        max: this.amount,
        difference: this.difference,
        force: true,
      });

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
        amount: "0",
      };
    }
  }

  /** Status */
  async status() {
    try {
      /** Send notification about initiation */
      await this.sendNotification([
        `⏳ ${this.title} - Status request initiated...`,
        this.formatAccounts(),
      ]);

      /** Results */
      const results = [];

      /** Loop through accounts and fetch status */
      for (const [index, account] of this.accounts.entries()) {
        if (this.signal.aborted) {
          break;
        }

        try {
          const result = await this.processStatus(account, index);

          /** Add result to results (accounts without a cloud account yield none) */
          if (result) results.push(result);
        } catch (e) {
          /** Cancellation, not a status failure: report what was gathered */
          if (this.signal.aborted) break;
          throw e;
        }
      }

      /** Notify about cancellation completion */
      if (this.signal.aborted) {
        await this.sendCancellationCompletionNotification();
      } else {
        /** Notify about completion */
        await this.sendNotification([
          `✅ ${this.title} - Status request completed.`,
        ]);
      }

      /** Calculate total mined */
      const totalMined = results.reduce(
        (acc, result) => acc.plus(result.summary?.balance || 0),
        new Decimal(0),
      );

      /** Format total mined */
      const totalMinedFormatted = totalMined
        .toDecimalPlaces(4, Decimal.ROUND_DOWN)
        .toString();

      /** Filter withdrawable accounts */
      const withdrawableAccounts = results.filter((result) =>
        this.isWithdrawable(result.summary),
      );

      /** Calculate withdrawable amount */
      const withdrawableAmount = withdrawableAccounts.reduce(
        (acc, result) => acc.plus(result.summary?.balance || 0),
        new Decimal(0),
      );

      /** Format withdrawable amount */
      const withdrawableAmountFormatted = withdrawableAmount
        .toDecimalPlaces(4, Decimal.ROUND_DOWN)
        .toString();

      /** Notify about summary */
      await this.sendSummaryNotification(results, [
        this.formatKeyValue(
          "Total mined",
          `💰 ${totalMinedFormatted} ${this.token}`,
        ),
        this.formatKeyValue(
          "Withdrawable Amount",
          `🤑 ${withdrawableAmountFormatted} ${this.token}`,
        ),
        this.formatKeyValue(
          "Withdrawable Accounts",
          `${withdrawableAccounts.length}`,
        ),
      ]);
    } catch (e) {
      const errorMessage = e.message || "Unknown error!";

      /** Log error */
      logger.error(errorMessage);

      /** Notify about boost error */
      await this.sendNotification([
        `❌ ${this.title} - an error occurred during status request!`,
        errorMessage,
      ]);
    }
  }

  /** Get account status */
  async processStatus(account, index) {
    /** Skip if user ID is not set */
    if (!account.userId) return;

    /** Retrieve Cloud Account */
    const cloudAccount = await this.getCloudAccount(account);

    /** Skip if cloud account is missing */
    if (!cloudAccount) return;

    /** Result */
    const result = await this.getUserStatus(cloudAccount);

    /** Destructure result */
    const { status, summary, message } = result;

    /** Send Notification */
    await this.sendNotification(
      status
        ? [
            `ℹ️ User details <b>(${this.formatAccountLink(cloudAccount.id)})</b> ${this.formatAccountPosition(index)}`,
            "",
            this.formatKeyValue("Miner Level", summary.level),
            this.formatKeyValue("Holding", `${summary.holding} ${this.token}`),
            this.formatKeyValue(
              "Balance",
              `${summary.balance} ${this.token} ${this.isWithdrawable(summary) ? "🟩" : "🟧"}`,
            ),
          ]
            /** Wallet */
            .concat(
              summary.wallet
                ? [
                    this.formatKeyValue(
                      "Wallet",
                      this.formatWallet(summary.wallet),
                    ),
                  ]
                : [],
            )

            /** Risks */
            .concat(
              summary.risk?.flags?.length > 0
                ? [
                    "",
                    "<b>🟥 Risks</b>",
                    this.formatKeyValue("Risk Score", summary.risk.score),
                    this.formatKeyValue("Risk Updated", summary.risk.updatedAt),
                    this.formatKeyValue(
                      "Risk Flags",
                      summary.risk.flags.length,
                    ),
                    ...summary.risk.flags.map((flag) => `<b>- ${flag}</b>`),
                  ]
                : [],
            )
        : [
            `❌ Failed to get user details <b>(${this.formatAccountLink(cloudAccount.id)})</b> ${this.formatAccountPosition(index)}`,
            `<i>Error: ${message}</i>`,
          ],
    );

    /** Delay for seconds */
    if (!this.isLastAccount(index)) {
      await this.delayForSafeSeconds();
    }

    return result;
  }

  /** Get Status */
  async getUserStatus(cloudAccount) {
    try {
      /** Log */
      logger.info("Getting account status:", cloudAccount.id);

      /** Get runner */
      const runner = await this.getRunner(cloudAccount);

      /** Delay for 5s */
      await this.utils.delayForSeconds(5, { signal: this.signal });

      /** Claim whatever is pending so the balance is current */
      await runner.refreshAutoState();

      /** Delay for 5s */
      await this.utils.delayForSeconds(5, { signal: this.signal });

      /** Get the normalized snapshot */
      const summary = runner.getAutoSummary();

      return { status: true, summary };
    } catch (e) {
      const errorMessage = e.message || "Unknown error!";

      /** Log error */
      logger.error(errorMessage);

      return {
        status: false,
        message: errorMessage,
      };
    }
  }

  /** Resume terminated accounts back into farming batches */
  resumeTerminatedAccounts() {
    const FarmerClass = farmers[this.farmerId];
    for (const id of this.terminatedAccounts) {
      FarmerClass.resume(id);
    }
    this.terminatedAccounts.clear();
  }

  /** Cancel operation */
  cancel() {
    this.controller.abort();
  }

  static execute(options, callback) {
    if (this.instances.has(options.id)) {
      return this.instances.get(options.id).sendPendingOperationNotification();
    }
    const instance = new this(options);

    this.instances.set(options.id, instance);

    callback(instance).finally(() => {
      /** Resume terminated accounts back into farming batches */
      instance.resumeTerminatedAccounts();

      this.instances.delete(options.id);
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

  static status(options) {
    this.execute(options, (instance) => instance.status());
  }
}

export default BaseAuto;
