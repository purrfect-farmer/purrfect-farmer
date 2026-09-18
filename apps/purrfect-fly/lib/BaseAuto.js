import AutoBooster from "./AutoBooster.js";
import AutoWalletTransfer from "./AutoWalletTransfer.js";
import Decimal from "decimal.js";
import Encrypter from "@purrfect/shared/lib/Encrypter.js";
import app from "../config/app.js";
import bot from "./bot.js";
import db from "../db/models/index.js";
import farmers from "../farmers/index.js";
import logger from "./logger.js";
import { claimAccount, getClaim, releaseAccount } from "./AutoClaims.js";
import { generateMnemonicPhrase } from "@purrfect/shared/lib/auto/wallet.js";
import { getVault, setVault, summarizeVault } from "./AutoVault.js";
import { prepareMaster } from "@purrfect/shared/lib/auto/transactions.js";
import utils from "./utils.js";

/** How many queued accounts a cycle lists, to stay under Telegram's limit */
const ASSIST_QUEUE_PREVIEW = 100;

/** Where a helper records the withdrawal it last placed for someone else */
const ASSIST_RECORD_KEY = "assistLastWithdrawal";

/** Where a helper keeps the last withdrawal it saw settled for someone else */
const ASSIST_HELPED_KEY = "assistLastHelped";

/** The loop an account is claimed by, so the two never work the same one */
const ASSIST_OWNER = "assist";
const CULTIVATE_OWNER = "cultivate";

/** Shared by every sender, since none of these messages wants a preview */
const NOTIFICATION_OPTIONS = {
  ["link_preview_options"]: {
    ["is_disabled"]: true,
  },
};

/** BaseAuto */
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

  /** @type {Map<number, BaseAuto>} redeclared per subclass so drops run concurrently for one user */
  static instances = new Map();

  /** @type {Map<string, BaseAuto>} the assist loop, keyed by drop and kept out of the single-flight slot */
  static assistInstances = new Map();

  /** @type {Map<string, BaseAuto>} the cultivate loop, keyed by drop and running alongside the assist one */
  static cultivateInstances = new Map();

  constructor({
    id,
    master,
    accounts,
    password,
    amount = "",
    delay = 0,
    difference = 0,
    freeze = false,
    includeFrozen = false,
    includeRevoked = false,
    withdrawAfterBoost = false,
    runFarmer = true,
    repeat = false,
    repeatInterval = 15,
    assistInterval = 10,
    cultivateInterval = 10,
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
    this.includeFrozen = includeFrozen;
    this.includeRevoked = includeRevoked;
    this.withdrawAfterBoost = withdrawAfterBoost;
    this.runFarmer = runFarmer;
    this.repeat = repeat;
    this.repeatInterval = Number(repeatInterval);
    this.assistInterval = Number(assistInterval);
    this.cultivateInterval = Number(cultivateInterval);

    /** When this operation was started, reported by the assist status */
    this.startedAt = Date.now();
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

  /** Format a summary's wallet, which carries no version when the drop links by raw address */
  formatWallet(wallet) {
    const link = this.formatAddressLink(wallet.address);
    return wallet.version ? `(${wallet.version.toUpperCase()}) ${link}` : link;
  }

  /** Format a unix timestamp for a notification */
  formatTimestamp(seconds) {
    return new Date(seconds * 1000).toUTCString();
  }

  /** Format a span of seconds as its largest parts, e.g. "3d 1h 45m" */
  formatDurationParts(seconds) {
    return this.utils.formatDurationParts(seconds);
  }

  /** Format how long is left until a unix timestamp, e.g. "3d 1h 45m" */
  formatCountdown(seconds) {
    return this.formatDurationParts(seconds - Date.now() / 1000);
  }

  /** Format how long has passed since a millisecond timestamp, e.g. "2h 15m" */
  formatElapsed(since) {
    if (!since) return "an unknown time";

    return this.formatDurationParts((Date.now() - Number(since)) / 1000);
  }

  /** Format when an account's mining freezes, empty for drops that report no mining window */
  formatMiningFreeze(summary) {
    const mining = summary?.mining;

    if (mining?.frozen) {
      return "🧊 Mining is <b>frozen</b>";
    }

    const freezesAt = Number(mining?.freezesAt) || 0;

    if (!freezesAt) return "";

    return `❄️ Freezes <i>${this.formatTimestamp(freezesAt)}</i> - in <i>${this.formatCountdown(freezesAt)}</i>`;
  }

  /** Format an account snapshot as notification detail lines, shared by every single-account notification */
  formatSummaryDetails(summary) {
    const freeze = this.formatMiningFreeze(summary);

    return (
      [
        this.formatKeyValue("Miner Level", summary.level),
        this.formatKeyValue("Holding", `${summary.holding} ${this.token}`),
        this.formatKeyValue(
          "Pool Balance",
          `${summary.balance} ${this.token} ${this.isWithdrawable(summary) ? "🟩" : "🟧"}`,
        ),
        this.formatKeyValue("Verified", summary.verified ? "✅" : "❌"),
      ]
        /** Buyer protection, absent on drops that do not report it */
        .concat(
          summary.protection
            ? [
                this.formatKeyValue(
                  "Buyer Protection",
                  summary.protection.revoked ? "🚫 Revoked" : "✅ Active",
                ),
                this.formatKeyValue(
                  "DEX Buyer",
                  summary.protection.dexBuyer ? "✅" : "❌",
                ),
              ]
            : [],
        )

        /** Wallet */
        .concat(
          summary.wallet
            ? [this.formatKeyValue("Wallet", this.formatWallet(summary.wallet))]
            : [],
        )

        /** Mining freeze */
        .concat(freeze ? [freeze] : [])

        /** Ban */
        .concat(
          summary.banned
            ? [
                "",
                "<b>🚫 Banned</b>",
                this.formatKeyValue("Reason", summary.banReason || "Unknown"),
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
                this.formatKeyValue("Risk Flags", summary.risk.flags.length),
                ...summary.risk.flags.map((flag) => `<b>- ${flag}</b>`),
              ]
            : [],
        )
    );
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

  /** Whether boosted accounts should be left frozen, which a repeating run always does */
  shouldFreezeAccounts() {
    return Boolean(this.repeat || this.freeze);
  }

  /** Format the include-frozen setting */
  formatIncludeFrozen() {
    return this.formatKeyValue(
      "Include frozen",
      this.includeFrozen ? "Enabled" : "Disabled",
    );
  }

  /** Format the include-revoked setting */
  formatIncludeRevoked() {
    return this.formatKeyValue(
      "Include revoked",
      this.includeRevoked ? "Enabled" : "Disabled",
    );
  }

  /** Format the withdraw-after-boost setting */
  formatWithdrawAfterBoost() {
    return this.formatKeyValue(
      "Withdraw after boost",
      this.withdrawAfterBoost ? "Enabled" : "Disabled",
    );
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

  /** Format the assist interval */
  formatAssistInterval() {
    return this.formatKeyValue("Assist Interval", `${this.assistInterval}m`);
  }

  /** Format the cultivate interval */
  formatCultivateInterval() {
    return this.formatKeyValue(
      "Cultivate Interval",
      `${this.cultivateInterval}m`,
    );
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
  async sendNotification(messages) {
    await bot.sendPrivateMessage(this.id, messages, NOTIFICATION_OPTIONS);
    await bot.sendOperationMessage(messages, NOTIFICATION_OPTIONS);
  }

  /** Send a notification that also reaches the server admin, who is not always the operator */
  async sendAdminNotification(messages) {
    await this.sendNotification(messages);

    /** The operator has already had it in their own chat */
    if (String(app.admin.telegramId) === String(this.id)) return;

    await bot.sendAdminMessage(messages, NOTIFICATION_OPTIONS);
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

  /** Send Boost Summary Notification */
  sendBoostSummaryNotification(results) {
    /** What actually left the master, so a run that only connected wallets reads as zero */
    const boostedAccounts = results.filter((result) =>
      new Decimal(result.boosted || 0).greaterThan(0),
    );

    const totalBoosted = boostedAccounts.reduce(
      (acc, result) => acc.plus(result.boosted),
      new Decimal(0),
    );

    /** Only the requests the drop took, since a refusal moved nothing */
    const withdrawals = results
      .map((result) => result.withdrawal)
      .filter((withdrawal) => withdrawal?.status);

    const totalWithdrawn = withdrawals.reduce(
      (acc, withdrawal) => acc.plus(withdrawal.amount || 0),
      new Decimal(0),
    );

    const format = (amount) =>
      amount.toDecimalPlaces(4, Decimal.ROUND_DOWN).toString();

    return this.sendSummaryNotification(results, [
      this.formatKeyValue(
        "Total boosted",
        `⚡ ${format(totalBoosted)} ${this.token}`,
      ),
      this.formatKeyValue("Boosted Accounts", `${boostedAccounts.length}`),
      ...(this.withdrawAfterBoost
        ? [
            this.formatKeyValue(
              "Total withdrawn",
              `🤑 ${format(totalWithdrawn)} ${this.token}`,
            ),
            this.formatKeyValue("Withdrawn Accounts", `${withdrawals.length}`),
          ]
        : []),
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

    /** Hand the runner this operation's signal, so cancelling the operation cancels the runner too */
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

    /** Only a boosted wallet needs the drop to re-read it */
    const boosted = new Decimal(jettonAmount || 0).greaterThan(0);

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
        const { status, summary, message } = await runner.connectAutoWallet({
          phrase: walletAccount.phrase,
          address: walletAccount.address,
          version: walletAccount.version,
          refresh: boosted,
        });

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
            summary,
            jettonAmount,
          });

        /** Put the holding to work */
        const minedSummary = await this.startMining(
          runner,
          cloudAccount,
          settledSummary,
        );

        try {
          /** Set farmer status */
          if (runner.farmer) {
            const freeze = this.shouldFreezeAccounts();

            /** The drop reports when mining freezes, which is when the account is due back */
            const freezesAt = Number(minedSummary?.mining?.freezesAt) || 0;

            runner.farmer.status = freeze ? "frozen" : "active";

            /** No reported window means the freeze stays indefinite */
            runner.farmer.frozenUntil =
              freeze && freezesAt ? new Date(freezesAt * 1000) : null;

            await runner.farmer.save();
          }

          /** Execute runner, skipped when the run is only meant to register wallets */
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

        return { status: true, summary: minedSummary, settled, runner };
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

  /** Start mining at the holding the account is now on, once the boost has settled */
  async startMining(runner, cloudAccount, summary) {
    try {
      logger.info("Starting mining:", cloudAccount.id);

      const mined = await runner.startAutoMining();

      logger.success("Started mining:", cloudAccount.id);

      return mined || summary;
    } catch (e) {
      logger.error("Failed to start mining:", cloudAccount.id, e.message);
      return summary;
    }
  }

  /** Re-read the account until the drop sees the tokens the boost sent */
  async syncBoostedHolding({ runner, cloudAccount, summary, jettonAmount }) {
    /** Seconds of delay between re-syncs */
    const RETRY_SECONDS = 5;

    /** Maximum re-syncs, i.e. how long the transfer is given to land */
    const MAX_ATTEMPTS = 20;

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

      try {
        current = await runner.refreshAutoSummary();
      } catch (e) {
        /** Keep the last summary and try again */
        logger.error("Failed to refresh account:", cloudAccount.id, e.message);
      }
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
    /** An account that never reaches the drop counts as skipped rather than failed */

    /** Skip if user ID is not set */
    if (!account.userId) return { status: false, skipped: true };

    /** Retrieve Cloud Account */
    const cloudAccount = await this.getCloudAccount(account, true);

    /** Skip if cloud account is missing */
    if (!cloudAccount) return { status: false, skipped: true };

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

    /** Boost - skipped when the master has nothing to send */
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
    const { status, message, summary, settled, runner } =
      await this.connectWallet({
        cloudAccount,
        walletAccount,
        jettonAmount,
      });

    /** Send Boost Notification */
    const link = this.formatAccountLink(cloudAccount.id);
    const position = this.formatAccountPosition(index);
    const action = skipped ? "connect" : "boost";

    /** The full snapshot is reported on every success, so the freeze is visible before it bites */
    await this.sendNotification(
      status
        ? [
            skipped
              ? `🔗 Connected <b>(${link})</b> - no ${this.token} in master to boost with ${position}`
              : settled
                ? `⚡ Boosted <b>(${link})</b> with <i>${jettonAmount} ${this.token}</i> ${position}`
                : `⏳ Boosted <b>(${link})</b> with <i>${jettonAmount} ${this.token}</i>, but the drop hasn't settled it yet ${position}`,
            "",
            ...this.formatSummaryDetails(summary),
          ]
        : [
            `❌ Failed to ${action} <b>(${link})</b>${skipped ? "" : ` with <i>${jettonAmount} ${this.token}</i>`} ${position}`,
            `<i>Error: ${message || "Unknown error!"}</i>`,
          ],
    );

    /** Withdraw what the account has now */
    let withdrawal = null;

    if (this.withdrawAfterBoost && status && settled) {
      withdrawal = await this.processBoostWithdrawal({
        cloudAccount,
        runner,
        summary,
        index,
      });
    }

    /** Snapshot the account */
    if (runner) {
      await this.storeSnapshot(runner, cloudAccount);
    }

    /** Delay for 2s */
    await this.utils.delayForSeconds(2, { signal: this.signal });

    /** Apply mode: rolling needs tokens to send, while collecting guards itself and still runs */
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

    return {
      status,
      skipped: false,
      settled: Boolean(settled),
      /** What left the master, which is nothing when it had nothing to send */
      boosted: skipped ? new Decimal(0) : jettonAmount,
      withdrawal,
    };
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
          this.formatWithdrawAfterBoost(),
          this.formatFreeze(),
          this.formatRunFarmer(),
          this.formatRepeat(),
          this.formatRepeatInterval(),
        ]);

        /** Prepare initial master data */
        await this.prepareInitialMasterData();

        /** An empty master still connects every wallet, which is what registers the account with the drop */
        if (this.prepared.jettonBalance.lessThanOrEqualTo(0)) {
          await this.sendNotification([
            `<i>🟡 ${this.title} - Master has no ${this.token}. Connecting wallets without boosting...</i>`,
          ]);
        }

        /** Results, rebuilt on every repeated pass */
        const results = [];

        /** Loop through accounts and boost */
        for (const [index, account] of this.accounts.entries()) {
          if (this.signal.aborted) {
            break;
          }

          try {
            /** Process boost */
            const result = await this.processBoost(account, index);

            /** Add result to results */
            if (result) results.push(result);
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
        }

        /** Notify about summary, which reports what a cancelled pass did get through */
        await this.sendBoostSummaryNotification(results);

        /** A cancelled pass does not repeat: the check at the top breaks the loop */
        if (this.signal.aborted) continue;

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
        ? `⏩ Skipped <b>(${this.formatAddressLink(account.address)})</b> ${this.formatAccountPosition(index)}`
        : status
          ? `💰 Collected <b>(${this.formatAddressLink(account.address)})</b> - <i>${collected?.toString()} ${this.token}</i> ${this.formatAccountPosition(index)}`
          : `❌ Failed to collect <b>(${this.formatAddressLink(account.address)})</b> ${this.formatAccountPosition(index)}\n<i>Error: ${error?.message || "Unknown error!"}</i>`,
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

  /** Record what an account looks like right now */
  async storeSnapshot(runner, cloudAccount) {
    try {
      return await runner.storeAutoSnapshot();
    } catch (e) {
      logger.error(
        "Failed to store the account snapshot:",
        cloudAccount.id,
        e.message,
      );
    }
  }

  /** Hand an account back to farming, since reading a frozen account is also what releases it */
  async activateFarmer(runner, cloudAccount) {
    try {
      if (runner.farmer && runner.farmer.status !== "active") {
        runner.farmer.status = "active";
        runner.farmer.errorCount = 0;
        runner.farmer.frozenUntil = null;
        await runner.farmer.save();
      }
    } catch (e) {
      logger.error(
        "Failed to activate the farmer:",
        cloudAccount.id,
        e.message,
      );
    }
  }

  /** Re-read an account the drop has just paid out */
  async refreshWithdrawnSummary(runner, cloudAccount) {
    /** Give the drop a moment to record the withdrawal */
    await this.utils.delayForSeconds(5, { signal: this.signal });

    try {
      return await runner.refreshAutoSummary();
    } catch (e) {
      logger.error(
        "Failed to refresh withdrawn account:",
        cloudAccount.id,
        e.message,
      );

      /** Stale in the flags, but still truthful about the new balance */
      return runner.getAutoSummary();
    }
  }

  /** Withdraw an account in the middle of a boost run */
  async processBoostWithdrawal({ cloudAccount, runner, summary, index }) {
    if (this.signal.aborted) return null;

    const link = this.formatAccountLink(cloudAccount.id);
    const position = this.formatAccountPosition(index);

    /** Nothing to withdraw, so the history is not worth a request */
    if (!this.isWithdrawable(summary)) {
      return null;
    }

    try {
      /** Both gates come from a single read of the withdraw history */
      const { pending, flagged } = await runner.getWithdrawalGuard();

      /** An account with a withdrawal in flight must not place another */
      if (pending) {
        await this.sendNotification([
          `⏩ Skipped <b>(${link})</b> - a withdrawal is still pending ${position}`,
        ]);
        return { status: false, skipped: true, amount: "0" };
      }

      /** A flagged history is the drop disputing a payout - leave it alone */
      if (flagged) {
        await this.sendNotification([
          `⏩ Skipped <b>(${link})</b> - it has a flagged withdrawal ${position}`,
        ]);
        return { status: false, skipped: true, amount: "0" };
      }

      /** The boost may have cost the account its standing, so this is read after it, not before */
      const protection = summary?.protection;

      if (protection && (protection.revoked || !protection.dexBuyer)) {
        const reason = protection.revoked
          ? "its buyer protection has been revoked"
          : "the drop counts no qualified DEX buy";

        await this.sendNotification([
          `⏩ Skipped <b>(${link})</b> - ${reason} ${position}`,
        ]);
        return { status: false, skipped: true, amount: "0" };
      }

      logger.info("Withdrawing boosted account:", cloudAccount.id);

      /** The whole balance, unrandomized */
      const { status, skipped, message, amount } = await runner.withdraw({
        force: true,
        difference: 0,
      });

      logger.success(
        "Completed boost withdrawal:",
        cloudAccount.id,
        status,
        skipped,
        message,
        amount,
      );

      /** Refresh the summary to reflect the updated balance and any flags */
      const updatedSummary = status
        ? await this.refreshWithdrawnSummary(runner, cloudAccount)
        : null;

      await this.sendNotification(
        [
          skipped
            ? `⏩ Skipped <b>(${link})</b> - <i>${amount} ${this.token}</i> ${position}\n<i>Reason: ${message}</i>`
            : status
              ? `🤑 Withdrawn <b>(${link})</b> - <i>${amount} ${this.token}</i> ${position}\n<i>Message: ${message}</i>`
              : `❌ Failed to withdraw <b>(${link})</b> - <i>${amount} ${this.token}</i> ${position}\n<i>Reason: ${message}</i>`,
        ].concat(
          updatedSummary
            ? ["", ...this.formatSummaryDetails(updatedSummary)]
            : [],
        ),
      );

      return { status, skipped, message, amount };
    } catch (e) {
      if (this.signal.aborted) return null;

      const errorMessage = e.message || "Unknown error!";

      logger.error("Failed to withdraw boosted account:", errorMessage);

      await this.sendNotification([
        `❌ Failed to withdraw <b>(${link})</b> ${position}`,
        `<i>Error: ${errorMessage}</i>`,
      ]);

      return {
        status: false,
        skipped: false,
        message: errorMessage,
        amount: "0",
      };
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

      /** Re-read and record the account to reflect the updated balance and any flags */
      await this.refreshWithdrawnSummary(runner, cloudAccount);
      await this.storeSnapshot(runner, cloudAccount);

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
        this.formatIncludeFrozen(),
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
    const cloudAccount = await this.getCloudAccount(
      account,
      this.includeFrozen,
    );

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
            ...this.formatSummaryDetails(summary),
          ]
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

      /** Delay for 2s */
      await this.utils.delayForSeconds(2, { signal: this.signal });

      /** Claim whatever is pending so the balance is current */
      await runner.refreshAutoState();

      /** Delay for 2s */
      await this.utils.delayForSeconds(2, { signal: this.signal });

      /** Re-read the account so the snapshot carries the current holding */
      const summary = await runner.refreshAutoSummary();

      /** Record it */
      await this.storeSnapshot(runner, cloudAccount);

      /** A read account goes back to farming */
      await this.activateFarmer(runner, cloudAccount);

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

  /* --------------------------------------------------------------------- */
  /* Load and assisted withdrawals                                         */
  /*                                                                       */
  /* Some drops only settle a withdrawal placed by a verified account, so   */
  /* a verified account withdraws on an ordinary one's behalf by adopting   */
  /* its wallet for the length of one withdrawal. `Load` hands this server  */
  /* the wallets, and `assist` runs that exchange on a timer.               */
  /* --------------------------------------------------------------------- */

  /** Take an account's wallets, and act on nothing */
  async load() {
    const accepted = [];
    const rejected = [];

    for (const account of this.accounts) {
      if (this.signal.aborted) break;

      if (!account.userId) {
        rejected.push([account.title || account.address, "no Telegram user"]);
        continue;
      }

      /** A wallet is only useful alongside the session that owns it, so another server's account cannot be helped */
      const cloudAccount = await this.getCloudAccount(account, true);

      if (!cloudAccount) {
        rejected.push([
          this.formatAccountLink(account.userId),
          "not farmed by this server",
        ]);
        continue;
      }

      accepted.push(account);
    }

    setVault(this.constructor.id, {
      password: this.password,
      accounts: accepted,
    });

    const verified = accepted.filter((account) => account.verified);

    await this.sendNotification([
      `📥 ${this.title} - Wallets loaded.`,
      this.formatKeyValue("Loaded", `${accepted.length}`),
      this.formatKeyValue("Verified", `${verified.length}`),
      ...verified.map((account) =>
        this.formatKeyValue(
          "✅",
          `${this.formatAccountLink(account.userId)} ${this.formatAddressLink(account.address)}`,
        ),
      ),
      ...rejected.map(([label, reason]) =>
        this.formatKeyValue("⏩", `${label} - <i>${reason}</i>`),
      ),
      `<i>Wallets are held in memory only and are lost when the server restarts.</i>`,
    ]);

    return { accepted: accepted.length, rejected: rejected.length };
  }

  /** Build a prepared runner for a loaded account, if this server owns it */
  async getAssistRunner(account) {
    const cloudAccount = await this.getCloudAccount(account, true);

    if (!cloudAccount) return null;

    const runner = await this.getRunner(cloudAccount);

    return { runner, cloudAccount };
  }

  /** Whether the drop still has this account on the wallet it was loaded with */
  holdsOwnWallet(runner, account) {
    const wallet = runner.getAutoSummary()?.wallet;

    return Boolean(wallet && wallet.address === account.address);
  }

  /** The loaded accounts that have reached the minimum, fullest pool first, read from the stored snapshots */
  async getAssistCandidates(vault, helperIds) {
    const rows = await db.Farmer.findAll({
      where: { farmer: this.farmerId },
      include: [{ required: true, association: "account" }],
    });

    const candidates = [];

    /** Why each account was passed over, so an empty cycle can say so */
    const skipped = {};
    const skip = (reason) => {
      skipped[reason] = (skipped[reason] || 0) + 1;
    };

    for (const row of rows) {
      const userId = String(row.account.id);

      /** Restoring an account's own wallet afterwards needs its phrase */
      const account = vault.accounts.get(userId);

      if (!account) {
        skip("not loaded");
        continue;
      }

      /** A verified account does not queue behind itself */
      if (helperIds.has(userId)) continue;

      /** Frozen is the operator saying to leave this account alone */
      if (["banned", "frozen"].includes(row.status)) {
        skip(row.status);
        continue;
      }

      /** An account that no longer farms has no fresh snapshot to trust */
      if (!row.account.farmingEnabled) {
        skip("farming off");
        continue;
      }

      const snapshot = row.storage?.["autoSnapshot"];

      if (!snapshot) {
        skip("never farmed");
        continue;
      }

      if (snapshot.banned) {
        skip("banned by the drop");
        continue;
      }

      if (!this.isWithdrawable(snapshot)) {
        skip("below the minimum");
        continue;
      }

      candidates.push({ account, snapshot });
    }

    logger.info(
      `${this.title} - ${candidates.length} candidate(s) of ${rows.length}`,
      Object.entries(skipped)
        .map(([reason, count]) => `${count} ${reason}`)
        .join(", ") || "",
    );

    return candidates.sort((a, b) =>
      new Decimal(b.snapshot.balance || 0).comparedTo(a.snapshot.balance || 0),
    );
  }

  /** Withdraw a requester's pool through a verified account, passing the wallet along and putting it back */
  async assistWithdrawal({ requester, requesterRunner, helper, helperRunner }) {
    /** Never take a wallet from an account that is already mid-exchange */
    if (!this.holdsOwnWallet(requesterRunner, requester)) {
      return {
        status: false,
        skipped: true,
        amount: "0",
        message: "Not on its own wallet - is it loaded on another server?",
      };
    }

    const connect = async (runner, phrase, version, label) => {
      const result = await runner.connectAutoWallet({ phrase, version });

      if (!result.status) {
        throw new Error(result.message || `${label} failed`);
      }

      return result;
    };

    /** Both phrases are decrypted up front, because a rollback needs them and nothing has moved yet */
    const requesterPhrase = await this.decryptPhrase(requester.encryptedPhrase);
    const helperPhrase = await this.decryptPhrase(helper.encryptedPhrase);
    const temporaryPhrase = await generateMnemonicPhrase();

    let requesterMoved = false;
    let helperMoved = false;

    /** Best-effort return of both accounts to their own wallets */
    const rollback = async () => {
      if (helperMoved) {
        try {
          await connect(
            helperRunner,
            helperPhrase,
            helper.version,
            "helper restore",
          );
          helperMoved = false;
        } catch (error) {
          logger.error("Failed to restore helper wallet:", error.message);
        }
      }

      if (requesterMoved) {
        try {
          await connect(
            requesterRunner,
            requesterPhrase,
            requester.version,
            "requester restore",
          );
          requesterMoved = false;
        } catch (error) {
          logger.error("Failed to restore requester wallet:", error.message);
        }
      }

      return { requesterMoved, helperMoved };
    };

    try {
      /** The requester releases its wallet */
      await connect(
        requesterRunner,
        temporaryPhrase,
        requester.version,
        "requester park",
      );
      requesterMoved = true;

      /** The verified account picks it up */
      await connect(
        helperRunner,
        requesterPhrase,
        requester.version,
        "helper adopt",
      );
      helperMoved = true;

      /** A refusal here is an outcome, not a fault: restore both wallets the ordinary way and report it */
      const withdrawal = await helperRunner.withdraw({
        force: true,
        difference: 0,
      });

      await connect(
        helperRunner,
        helperPhrase,
        helper.version,
        "helper restore",
      );
      helperMoved = false;

      await connect(
        requesterRunner,
        requesterPhrase,
        requester.version,
        "requester restore",
      );
      requesterMoved = false;

      /** Keep the next cycle from re-picking an account just drained */
      await requesterRunner.storeAutoSnapshot();

      return withdrawal;
    } catch (error) {
      const stranded = await rollback();

      if (stranded.requesterMoved || stranded.helperMoved) {
        await this.sendNotification([
          `🚨 ${this.title} - a wallet could not be restored!`,
          this.formatKeyValue(
            "Requester",
            `${this.formatAccountLink(requester.userId)}${stranded.requesterMoved ? " - <b>on a throwaway wallet</b>" : ""}`,
          ),
          this.formatKeyValue(
            "Verified",
            `${this.formatAccountLink(helper.userId)}${stranded.helperMoved ? " - <b>holding the requester's wallet</b>" : ""}`,
          ),
          `<i>Reconnect it by hand before running anything else on it.</i>`,
        ]);
      }

      throw error;
    }
  }

  /** The withdrawals helpers have placed and the drop has not settled yet, read without logging anyone in */
  async getOutstandingAssists(helpers) {
    const ids = helpers.map((account) => account.userId);

    const outstanding = new Map();

    if (!ids.length) return outstanding;

    const rows = await db.Farmer.findAll({
      where: { farmer: this.farmerId, accountId: ids },
    });

    for (const row of rows) {
      const record = row.storage?.[ASSIST_RECORD_KEY];

      if (record) {
        outstanding.set(String(row.accountId), record);
      }
    }

    return outstanding;
  }

  /** Remember the withdrawal a helper has just placed, so its settlement can be reported */
  async recordAssistWithdrawal(runner, helper, record) {
    try {
      await runner.storage.set(ASSIST_RECORD_KEY, record);
    } catch (error) {
      logger.error(
        "Failed to record the assisted withdrawal:",
        helper.userId,
        error.message,
      );
    }
  }

  /** Keep who a helper last withdrew for, since the in-flight record is cleared on settlement */
  async recordLastHelped(runner, helper, record) {
    try {
      await runner.storage.set(ASSIST_HELPED_KEY, record);
    } catch (error) {
      logger.error(
        "Failed to record the last assisted account:",
        helper.userId,
        error.message,
      );
    }
  }

  /** Forget what a helper was carrying, once the drop has settled it */
  async clearAssistWithdrawal(runner, helper) {
    try {
      await runner.storage.set(ASSIST_RECORD_KEY, null);
    } catch (error) {
      logger.error(
        "Failed to clear the assisted withdrawal:",
        helper.userId,
        error.message,
      );
    }
  }

  /** Tell the admin the withdrawal a helper placed has been settled */
  async announceAssistSettlement(helper, record) {
    await this.sendAdminNotification([
      `✅ ${this.title} - ${this.formatAccountLink(helper.userId)} is free again. The withdrawal it placed has settled.`,
      this.formatKeyValue(
        "Requester",
        this.formatAccountLink(record.requesterId),
      ),
      this.formatKeyValue("Amount", `${record.amount} ${this.token}`),
      this.formatKeyValue(
        "Placed",
        this.formatTimestamp(Number(record.placedAt) / 1000),
      ),
      this.formatKeyValue("Settled after", this.formatElapsed(record.placedAt)),
    ]);
  }

  /** The verified accounts that can take work right now */
  async getAvailableHelpers(helpers, runners, outstanding = new Map()) {
    const available = [];

    for (const helper of helpers) {
      if (this.signal.aborted) break;

      const label = this.formatAccountLink(helper.userId);
      const entry = await this.getAssistRunner(helper);

      if (!entry) {
        await this.sendNotification([
          `⏩ Skipped <b>(${label})</b> - not farmed by this server.`,
        ]);
        continue;
      }

      runners.set(String(helper.userId), entry);

      /** What this account was last asked to withdraw for someone else */
      const record = outstanding.get(String(helper.userId));

      /** An account with a withdrawal in flight must not place another */
      if (await entry.runner.hasPendingWithdrawal()) {
        await this.sendNotification([
          record
            ? `⏩ Skipped <b>(${label})</b> - still waiting on the <i>${record.amount} ${this.token}</i> it withdrew for ${this.formatAccountLink(record.requesterId)}, placed ${this.formatElapsed(record.placedAt)} ago.`
            : `⏩ Skipped <b>(${label})</b> - a withdrawal is still pending.`,
        ]);
        continue;
      }

      /** Free again, so whatever it was carrying has been settled */
      if (record) {
        await this.announceAssistSettlement(helper, record);
        await this.recordLastHelped(entry.runner, helper, {
          ...record,
          settledAt: Date.now(),
        });
        await this.clearAssistWithdrawal(entry.runner, helper);
      }

      if (!this.holdsOwnWallet(entry.runner, helper)) {
        await this.sendNotification([
          `⚠️ Skipped <b>(${label})</b> - it is not on its own wallet. Is it loaded on another server?`,
        ]);
        continue;
      }

      /** The cultivate loop may already be boosting this account */
      if (!this.claim(helper.userId, ASSIST_OWNER)) {
        await this.sendNotification([
          `⏩ Skipped <b>(${label})</b> - it is being ${getClaim(this.constructor.id, helper.userId)}ed right now.`,
        ]);
        continue;
      }

      available.push(helper);
    }

    return available;
  }

  /** One pass over everyone waiting to be withdrawn for */
  async runAssistCycle() {
    const vault = getVault(this.constructor.id);

    if (!vault) {
      await this.sendNotification([
        `⚠️ ${this.title} - no wallets are loaded on this server. Run Load first.`,
      ]);
      return [];
    }

    const helpers = [...vault.accounts.values()].filter(
      (account) => account.verified,
    );

    if (!helpers.length) {
      await this.sendNotification([
        `⚠️ ${this.title} - none of the loaded accounts is verified.`,
      ]);
      return [];
    }

    const helperIds = new Set(helpers.map((account) => String(account.userId)));

    /** Withdrawals already in flight, which are worth a cycle even when nothing else is */
    const outstanding = await this.getOutstandingAssists(helpers);
    const candidates = await this.getAssistCandidates(vault, helperIds);

    /** Nothing has reached the minimum and nothing is owed: wait for the next cycle quietly */
    if (!candidates.length && !outstanding.size) {
      await this.sendNotification([
        `⏩ ${this.title} - no account has reached the minimum.`,
      ]);
      return [];
    }

    /** Runners are kept for the whole cycle so each helper logs in once */
    const runners = new Map();
    const results = [];

    try {
      /** Reading the helpers is also what reports a settled withdrawal */
      const available = await this.getAvailableHelpers(
        helpers,
        runners,
        outstanding,
      );

      /** Nothing has reached the minimum, so reconciling was this cycle's only job */
      if (!candidates.length) {
        await this.sendNotification([
          `⏩ ${this.title} - no account has reached the minimum.`,
        ]);
        return results;
      }

      /** The order they will be worked through, the richest pool first */
      await this.sendNotification([
        `📋 ${this.title} - Queue:`,
        ...candidates
          .slice(0, ASSIST_QUEUE_PREVIEW)
          .map((candidate, position) =>
            this.formatKeyValue(
              `${position + 1}. ${this.formatAccountLink(candidate.account.userId)}`,
              `${new Decimal(candidate.snapshot.balance || 0)} ${this.token}`,
            ),
          ),
        ...(candidates.length > ASSIST_QUEUE_PREVIEW
          ? [`<i>...and ${candidates.length - ASSIST_QUEUE_PREVIEW} more.</i>`]
          : []),
      ]);

      if (!available.length) {
        await this.sendNotification([
          `⏩ ${this.title} - no verified account is free this cycle. ${candidates.length} account(s) waiting.`,
        ]);
        return results;
      }

      await this.sendNotification([
        `⏳ ${this.title} - Assisting ${candidates.length} account(s) through ${available.length} verified account(s)...`,
      ]);

      /** The drop allows one withdrawal per account, so a verified account is spent once its request goes through */
      const pool = [...available];
      let turn = 0;

      for (const [index, candidate] of candidates.entries()) {
        if (this.signal.aborted) break;

        if (!pool.length) {
          await this.sendNotification([
            `⏩ ${this.title} - every verified account has a withdrawal in flight. ${candidates.length - index} account(s) left for the next cycle.`,
          ]);
          break;
        }

        const helper = pool[turn % pool.length];
        const helperEntry = runners.get(String(helper.userId));
        const label = this.formatAccountLink(candidate.account.userId);

        /** The cultivate loop may already be boosting this account */
        if (!this.claim(candidate.account.userId, ASSIST_OWNER)) continue;

        const requesterEntry = await this.getAssistRunner(candidate.account);

        if (!requesterEntry) {
          this.release(candidate.account.userId, ASSIST_OWNER);
          continue;
        }

        /** Whether this verified account is still free after the attempt */
        let spent = false;

        /** Kept out of the attempt, since the record written below outlives it */
        let amount = "0";
        let message = "";

        try {
          const { status, skipped, ...withdrawal } =
            await this.assistWithdrawal({
              requester: candidate.account,
              requesterRunner: requesterEntry.runner,
              helper,
              helperRunner: helperEntry.runner,
            });

          amount = withdrawal.amount ?? "0";
          message = withdrawal.message ?? "";

          results.push({ status, skipped, amount, message });

          /** A placed request occupies the account until the drop settles it */
          spent = status && !skipped;

          await this.sendAdminNotification([
            skipped
              ? `⏩ Skipped <b>(${label})</b> - <i>${message}</i>`
              : status
                ? `🤑 Withdrawn <b>(${label})</b> - <i>${amount} ${this.token}</i> through ${this.formatAccountLink(helper.userId)}`
                : `❌ Failed to withdraw <b>(${label})</b>\n<i>Reason: ${message}</i>`,
          ]);
        } catch (error) {
          if (this.signal.aborted) break;

          const errorMessage = error.message || "Unknown error!";
          logger.error(errorMessage);

          message = errorMessage;

          results.push({
            status: false,
            skipped: false,
            amount: "0",
            message: errorMessage,
          });

          await this.sendNotification([
            `❌ Failed to withdraw <b>(${label})</b>\n<i>Reason: ${errorMessage}</i>`,
          ]);
        } finally {
          /** Back into the farming batches while the next account is handled */
          this.releaseRunner(requesterEntry.cloudAccount);
          this.release(candidate.account.userId, ASSIST_OWNER);
        }

        /** A failure can still have left a request behind, so ask the drop rather than trust the outcome */
        if (!spent) {
          spent = await helperEntry.runner
            .hasPendingWithdrawal()
            .catch(() => false);
        }

        if (spent) {
          pool.splice(pool.indexOf(helper), 1);

          /** Remember who it went through, so the settlement can be reported when it lands */
          await this.recordAssistWithdrawal(helperEntry.runner, helper, {
            requesterId: String(candidate.account.userId),
            amount,
            message,
            placedAt: Date.now(),
          });

          await this.sendNotification([
            `⏳ ${this.formatAccountLink(helper.userId)} has a withdrawal in flight - resting it for the rest of this cycle.`,
          ]);
        } else {
          turn += 1;
        }

        if (index < candidates.length - 1 && pool.length) {
          await this.delayForSafeMinutes();
        }
      }
    } finally {
      for (const entry of runners.values()) {
        this.releaseRunner(entry.cloudAccount);
      }

      /** Helpers are held for the whole cycle, so they are freed together */
      for (const helper of helpers) {
        this.release(helper.userId, ASSIST_OWNER);
      }
    }

    return results;
  }

  /** Assist on a timer until cancelled */
  async assist() {
    await this.sendNotification([
      `⏳ ${this.title} - Assisted withdrawals started...`,
      this.formatAssistInterval(),
      this.formatDelay(),
      summarizeVault(this.constructor.id).loaded
        ? this.formatKeyValue(
            "Loaded wallets",
            `${summarizeVault(this.constructor.id).accounts}`,
          )
        : this.formatKeyValue("Loaded wallets", "(none)"),
    ]);

    while (true) {
      if (this.signal.aborted) break;

      try {
        await this.runAssistCycle();
      } catch (error) {
        if (this.signal.aborted) break;

        /** One bad cycle is not a reason to stop assisting */
        const errorMessage = error.message || "Unknown error!";
        logger.error(errorMessage);

        await this.sendNotification([
          `❌ ${this.title} - an error occurred during an assist cycle!`,
          errorMessage,
        ]);
      }

      if (this.signal.aborted) break;

      await this.utils
        .delayForMinutes(this.assistInterval, {
          signal: this.signal,
          precised: true,
        })
        .catch((error) => {});
    }

    await this.sendNotification([
      `🛑 ${this.title} - Assisted withdrawals stopped.`,
    ]);
  }

  /** The loaded accounts a cultivate cycle may boost, read from the stored snapshots */
  async getCultivateCandidates(vault, helperIds) {
    const rows = await db.Farmer.findAll({
      where: { farmer: this.farmerId },
      include: [{ required: true, association: "account" }],
    });

    const candidates = [];

    /** Why each account was passed over, so an empty cycle can say so */
    const skipped = {};
    const skip = (reason) => {
      skipped[reason] = (skipped[reason] || 0) + 1;
    };

    for (const row of rows) {
      const userId = String(row.account.id);

      /** Boosting an account needs its phrase, both to send and to reconnect */
      const account = vault.accounts.get(userId);

      if (!account) {
        skip("not loaded");
        continue;
      }

      /** Verified accounts are kept free to withdraw for everyone else */
      if (helperIds.has(userId)) continue;

      if (row.status === "banned") {
        skip("banned");
        continue;
      }

      /** Frozen is the operator saying to leave this account alone */
      if (row.status === "frozen" && !this.includeFrozen) {
        skip("frozen");
        continue;
      }

      /** An account that no longer farms has no fresh snapshot to trust */
      if (!row.account.farmingEnabled) {
        skip("farming off");
        continue;
      }

      const snapshot = row.storage?.["autoSnapshot"];

      if (!snapshot) {
        skip("never farmed");
        continue;
      }

      if (snapshot.banned) {
        skip("banned by the drop");
        continue;
      }

      /** An account the drop has stripped of buyer protection is not worth boosting */
      if (snapshot.protection?.revoked && !this.includeRevoked) {
        skip("protection revoked");
        continue;
      }

      /** Stale by definition, so this only spares a login when a helper is plainly mid-exchange */
      if (snapshot.wallet?.address !== account.address) {
        skip("not on its own wallet");
        continue;
      }

      /** The assist loop is already working this account */
      const holder = getClaim(this.constructor.id, userId);

      if (holder) {
        skip(`${holder}ing`);
        continue;
      }

      candidates.push({ account, snapshot });
    }

    logger.info(
      `${this.title} - ${candidates.length} candidate(s) of ${rows.length}`,
      Object.entries(skipped)
        .map(([reason, count]) => `${count} ${reason}`)
        .join(", ") || "",
    );

    return candidates.sort((a, b) =>
      new Decimal(b.snapshot.balance || 0).comparedTo(a.snapshot.balance || 0),
    );
  }

  /** Boost one account, then withdraw it once the drop has settled the boost */
  async processCultivate(candidate, index, total) {
    const { account } = candidate;

    const cloudAccount = await this.getCloudAccount(
      account,
      this.includeFrozen,
    );

    if (!cloudAccount) return null;

    const link = this.formatAccountLink(account.userId);
    const position = `(${index + 1}/${total})`;

    /** A leaked runner would keep the account out of farming until the loop stops */
    try {
      return await this.cultivateAccount({
        account,
        cloudAccount,
        link,
        position,
        index,
      });
    } finally {
      this.releaseRunner(cloudAccount);
    }
  }

  /** Boost, settle and withdraw one account, with its runner released by the caller */
  async cultivateAccount({ account, cloudAccount, link, position, index }) {
    /** Decrypt phrase */
    logger.info("Decrypting wallet phrase:", account.address);
    const phrase = await this.decryptPhrase(account.encryptedPhrase);
    logger.success("Successfully decrypted wallet phrase:", account.address);

    const walletAccount = { ...account, phrase };

    const booster = new AutoBooster(
      this.masterData,
      walletAccount,
      this.prepared,
    );

    /** Boost - skipped when the master has nothing to send */
    logger.info("Boosting account:", cloudAccount.id, account.address);
    const { jettonAmount, skipped } = await booster.boost({
      difference: this.difference,
    });

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

    /** Connecting is also what waits the boost out and starts mining on it */
    const { status, message, summary, settled, runner } =
      await this.connectWallet({
        cloudAccount,
        walletAccount,
        jettonAmount,
      });

    const action = skipped ? "connect" : "boost";

    await this.sendNotification(
      status
        ? [
            skipped
              ? `🔗 Connected <b>(${link})</b> - no ${this.token} in master to boost with ${position}`
              : settled
                ? `⚡ Boosted <b>(${link})</b> with <i>${jettonAmount} ${this.token}</i> ${position}`
                : `⏳ Boosted <b>(${link})</b> with <i>${jettonAmount} ${this.token}</i>, but the drop hasn't settled it yet ${position}`,
            "",
            ...this.formatSummaryDetails(summary),
          ]
        : [
            `❌ Failed to ${action} <b>(${link})</b>${skipped ? "" : ` with <i>${jettonAmount} ${this.token}</i>`} ${position}`,
            `<i>Error: ${message || "Unknown error!"}</i>`,
          ],
    );

    /** An unsettled boost is left for the next cycle rather than withdrawn */
    let withdrawal = null;

    if (status && settled) {
      withdrawal = await this.processBoostWithdrawal({
        cloudAccount,
        runner,
        summary,
        index,
      });

      /** The withdrawal path stays quiet about this, but a cycle should say so */
      if (!withdrawal) {
        await this.sendNotification([
          `⏩ Skipped <b>(${link})</b> - below the minimum ${position}`,
        ]);
      }
    }

    if (runner) {
      await this.storeSnapshot(runner, cloudAccount);
    }

    /** Delay for 2s */
    await this.utils.delayForSeconds(2, { signal: this.signal });

    /** Rolling needs tokens to send, while collecting guards itself and still runs */
    if (!skipped || this.mode !== "roll") {
      await this.applyMode(account, phrase, booster);
    }

    return {
      status,
      skipped: false,
      settled: Boolean(settled),
      /** What left the master, which is nothing when it had nothing to send */
      boosted: skipped ? new Decimal(0) : jettonAmount,
      withdrawal,
    };
  }

  /** One pass over everyone worth boosting and withdrawing */
  async runCultivateCycle() {
    const vault = getVault(this.constructor.id);

    if (!vault) {
      await this.sendNotification([
        `⚠️ ${this.title} - no wallets are loaded on this server. Run Load first.`,
      ]);
      return [];
    }

    const helperIds = new Set(
      [...vault.accounts.values()]
        .filter((account) => account.verified)
        .map((account) => String(account.userId)),
    );

    const candidates = await this.getCultivateCandidates(vault, helperIds);

    if (!candidates.length) {
      await this.sendNotification([
        `⏩ ${this.title} - no account is free to be boosted.`,
      ]);
      return [];
    }

    /** The master rolls forward through the accounts, so it is re-read every cycle */
    await this.prepareInitialMasterData();

    /** An empty master still connects every wallet, which is what re-reads the account */
    if (this.prepared.jettonBalance.lessThanOrEqualTo(0)) {
      await this.sendNotification([
        `<i>🟡 ${this.title} - Master has no ${this.token}. Connecting wallets without boosting...</i>`,
      ]);
    }

    await this.sendNotification([
      `📋 ${this.title} - Queue:`,
      ...candidates
        .slice(0, ASSIST_QUEUE_PREVIEW)
        .map((candidate, position) =>
          this.formatKeyValue(
            `${position + 1}. ${this.formatAccountLink(candidate.account.userId)}`,
            `${new Decimal(candidate.snapshot.balance || 0)} ${this.token}`,
          ),
        ),
      ...(candidates.length > ASSIST_QUEUE_PREVIEW
        ? [`<i>...and ${candidates.length - ASSIST_QUEUE_PREVIEW} more.</i>`]
        : []),
    ]);

    const results = [];

    try {
      for (const [index, candidate] of candidates.entries()) {
        if (this.signal.aborted) break;

        const { userId } = candidate.account;
        const label = this.formatAccountLink(userId);

        /** The assist loop may have taken this account since the queue was built */
        if (!this.claim(userId, CULTIVATE_OWNER)) continue;

        try {
          const result = await this.processCultivate(
            candidate,
            index,
            candidates.length,
          );

          if (result) results.push(result);
        } catch (error) {
          if (this.signal.aborted) break;

          const errorMessage = error.message || "Unknown error!";
          logger.error(errorMessage);

          results.push({
            status: false,
            skipped: false,
            settled: false,
            boosted: new Decimal(0),
            withdrawal: null,
          });

          await this.sendNotification([
            `❌ Failed to cultivate <b>(${label})</b>`,
            `<i>Error: ${errorMessage}</i>`,
          ]);
        } finally {
          this.release(userId, CULTIVATE_OWNER);
        }

        if (index < candidates.length - 1) {
          await this.delayForSafeMinutes();
        }
      }
    } finally {
      /** Rolling leaves the balance on the last account, so it is walked back */
      if (this.masterData) {
        await this.returnFundsToMaster().catch((error) =>
          logger.error(
            "Failed to return funds to master:",
            error.message || "Unknown error!",
          ),
        );
      }
    }

    await this.sendBoostSummaryNotification(results);

    return results;
  }

  /** Boost and withdraw on a timer until cancelled */
  async cultivate() {
    await this.sendNotification([
      `⏳ ${this.title} - Cultivation started...`,
      this.formatCultivateInterval(),
      this.formatDelay(),
      this.formatDifference(),
      this.formatIncludeFrozen(),
      this.formatIncludeRevoked(),
      this.formatFreeze(),
      this.formatRunFarmer(),
      summarizeVault(this.constructor.id).loaded
        ? this.formatKeyValue(
            "Loaded wallets",
            `${summarizeVault(this.constructor.id).accounts}`,
          )
        : this.formatKeyValue("Loaded wallets", "(none)"),
    ]);

    while (true) {
      if (this.signal.aborted) break;

      try {
        await this.runCultivateCycle();
      } catch (error) {
        if (this.signal.aborted) break;

        /** One bad cycle is not a reason to stop cultivating */
        const errorMessage = error.message || "Unknown error!";
        logger.error(errorMessage);

        await this.sendNotification([
          `❌ ${this.title} - an error occurred during a cultivate cycle!`,
          errorMessage,
        ]);
      }

      if (this.signal.aborted) break;

      await this.utils
        .delayForMinutes(this.cultivateInterval, {
          signal: this.signal,
          precised: true,
        })
        .catch((error) => {});
    }

    await this.sendNotification([`🛑 ${this.title} - Cultivation stopped.`]);
  }

  /** Take an account for this loop, so the other one passes over it */
  claim(userId, owner) {
    return claimAccount(this.constructor.id, userId, owner);
  }

  /** Hand an account back to whichever loop reaches it next */
  release(userId, owner) {
    return releaseAccount(this.constructor.id, userId, owner);
  }

  /** Resume a single account back into farming batches, which the endless assist loop does for itself */
  releaseRunner(cloudAccount) {
    const FarmerClass = farmers[this.farmerId];

    FarmerClass.resume(cloudAccount.id);
    this.terminatedAccounts.delete(cloudAccount.id);
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

  static load(options) {
    this.execute(options, (instance) => instance.load());
  }

  /** Start the assist loop for this drop, keyed by drop and outside the slot `execute` reserves */
  static assist(options) {
    if (this.assistInstances.has(this.id)) {
      return this.assistInstances
        .get(this.id)
        .sendPendingOperationNotification();
    }

    const instance = new this(options);

    this.assistInstances.set(this.id, instance);

    instance
      .assist()
      .catch((error) => logger.error(error.message || "Unknown error!"))
      .finally(() => {
        instance.resumeTerminatedAccounts();
        this.assistInstances.delete(this.id);
      });
  }

  static cancelAssist() {
    const instance = this.assistInstances.get(this.id);

    if (instance) {
      instance.cancel();
    }

    return Boolean(instance);
  }

  static assistStatus() {
    const instance = this.assistInstances.get(this.id);

    return {
      running: Boolean(instance),
      startedAt: instance?.startedAt || null,
      interval: instance?.assistInterval || null,
      vault: summarizeVault(this.id),
    };
  }

  /** Start the cultivate loop for this drop, keyed by drop and outside the slot `execute` reserves */
  static cultivate(options) {
    if (this.cultivateInstances.has(this.id)) {
      return this.cultivateInstances
        .get(this.id)
        .sendPendingOperationNotification();
    }

    const instance = new this(options);

    this.cultivateInstances.set(this.id, instance);

    instance
      .cultivate()
      .catch((error) => logger.error(error.message || "Unknown error!"))
      .finally(() => {
        instance.resumeTerminatedAccounts();
        this.cultivateInstances.delete(this.id);
      });
  }

  static cancelCultivate() {
    const instance = this.cultivateInstances.get(this.id);

    if (instance) {
      instance.cancel();
    }

    return Boolean(instance);
  }

  static cultivateStatus() {
    const instance = this.cultivateInstances.get(this.id);

    return {
      running: Boolean(instance),
      startedAt: instance?.startedAt || null,
      interval: instance?.cultivateInterval || null,
      vault: summarizeVault(this.id),
    };
  }

  /** What every account this server farms for the drop last looked like, from the stored snapshots */
  static async snapshots() {
    const rows = await db.Farmer.findAll({
      where: { farmer: this.farmerId },
      attributes: [
        "id",
        "accountId",
        "status",
        "frozenUntil",
        "errorCount",
        "storage",
      ],
      include: [
        {
          required: true,
          association: "account",
          attributes: ["id", "options"],
        },
      ],
    });

    return rows.map((row) => ({
      /** A string, since the UI holds the Telegram id as one */
      id: String(row.account.id),
      status: row.status,
      frozenUntil: row.frozenUntil,
      errorCount: row.errorCount,
      farming: row.account.farmingEnabled,
      snapshot: row.storage?.["autoSnapshot"] || null,

      /** What it is carrying now, and who it last withdrew for */
      assist: {
        pending: row.storage?.[ASSIST_RECORD_KEY] || null,
        last: row.storage?.[ASSIST_HELPED_KEY] || null,
      },
    }));
  }
}

export default BaseAuto;
