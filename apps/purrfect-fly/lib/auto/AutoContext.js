import AutoBoostStep from "./AutoBoostStep.js";
import AutoFormatter from "./AutoFormatter.js";
import AutoHelpers from "./AutoHelpers.js";
import AutoMaster from "./AutoMaster.js";
import AutoNotifier from "./AutoNotifier.js";
import AutoRecords from "./AutoRecords.js";
import AutoWallet from "./AutoWallet.js";
import AutoWithdrawer from "./AutoWithdrawer.js";
import Encrypter from "@purrfect/shared/lib/Encrypter.js";
import db from "../../db/models/index.js";
import farmers from "../../farmers/index.js";
import logger from "../logger.js";
import utils from "../utils.js";
import { claimAccount, getClaim, releaseAccount } from "../AutoClaims.js";
import { normalizeOptions } from "./constants.js";

/** Everything one Auto run shares: who asked, what with, how to stop, and the collaborators that do the work */
class AutoContext {
  /**
   * @param {typeof import("../BaseAuto.js").default} Auto - the drop's Auto class, read for its descriptor
   * @param {object} options - the request body, plus the operator's `id`
   */
  constructor(Auto, { id, master, accounts, password, ...options }) {
    /** Drop descriptor */
    this.farmerId = Auto.farmerId;
    this.autoId = Auto.id;
    this.title = Auto.title;
    this.token = Auto.token;
    this.jettonAddress = Auto.jettonAddress;

    /** Core properties */
    this.id = id;
    this.master = master;
    this.accounts = accounts;
    this.password = password;

    /** Configurable properties */
    this.options = normalizeOptions(options);

    /** When this operation was started, reported by the loop status */
    this.startedAt = Date.now();

    /** Abort controller and signal */
    this.controller = new AbortController();
    this.signal = this.controller.signal;

    /** Accounts terminated (excluded from farming batches) by this operation */
    this.terminatedAccounts = new Set();

    /** Collaborators */
    this.fmt = new AutoFormatter(this);
    this.notify = new AutoNotifier(this);
    this.records = new AutoRecords(this);
    this.masterWallet = new AutoMaster(this);
    this.wallet = new AutoWallet(this);
    this.withdrawer = new AutoWithdrawer(this);
    this.boostStep = new AutoBoostStep(this);
    this.helpers = new AutoHelpers(this);

    this.signal.addEventListener("abort", () => this.notify.sendStopping());
  }

  /** Whether the run has been cancelled */
  get aborted() {
    return this.signal.aborted;
  }

  /** Cancel operation */
  cancel() {
    this.controller.abort();
  }

  /** Whether boosted accounts should be left frozen, which a repeating run always does */
  shouldFreezeAccounts() {
    return Boolean(this.options.repeat || this.options.freeze);
  }

  /** Wait, throwing when the run is cancelled */
  delaySeconds(seconds, options = {}) {
    return utils.delayForSeconds(seconds, { signal: this.signal, ...options });
  }

  /** Wait a minute or so between cheap requests, returning early when cancelled */
  delaySafeSeconds() {
    return utils
      .delayForSeconds(60 + Math.floor(Math.random() * 30), {
        signal: this.signal,
      })
      .catch(() => {});
  }

  /** Wait a set number of minutes, returning early when cancelled */
  delayMinutes(minutes) {
    return utils
      .delayForMinutes(minutes, {
        signal: this.signal,
        precised: true,
      })
      .catch(() => {});
  }

  /** Wait the run's delay between accounts */
  delaySafeMinutes() {
    return this.delayMinutes(this.options.delay);
  }

  /** Decrypt phrase */
  decryptPhrase(encryptedPhrase) {
    return Encrypter.decryptData({
      ...encryptedPhrase,
      password: this.password,
      asText: true,
    });
  }

  /** The farmed account behind a vault account, absent when it cannot be worked */
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

  /** A prepared farmer for the account, taken out of the farming batches until released */
  async getRunner(cloudAccount) {
    const FarmerClass = farmers[this.farmerId];

    /** Terminate (excludes the account from farming batches until resumed) */
    FarmerClass.terminate(cloudAccount.id);
    this.terminatedAccounts.add(cloudAccount.id);

    await this.delaySeconds(2);

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

    await runner.prepare();

    await this.delaySeconds(1);

    return runner;
  }

  /** Resume a single account back into farming batches, which the endless loops do for themselves */
  releaseRunner(cloudAccount) {
    farmers[this.farmerId].resume(cloudAccount.id);
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

  /** Take an account for this loop, so the other one passes over it */
  claim(userId, owner) {
    return claimAccount(this.autoId, userId, owner);
  }

  /** Hand an account back to whichever loop reaches it next */
  release(userId, owner) {
    return releaseAccount(this.autoId, userId, owner);
  }

  /** Which loop holds an account right now, if any */
  holder(userId) {
    return getClaim(this.autoId, userId);
  }

  /** Run a cycle on a timer until cancelled, reporting a failed cycle without stopping
   * @param {object} params
   * @param {string[]} params.intro - the message sent when the loop starts
   * @param {() => Promise<any>} params.cycle - one pass
   * @param {number} params.interval - minutes between passes
   * @param {string} params.errorLabel - what a failed pass is called, e.g. "an assist cycle"
   * @param {string} params.stopped - the message sent when the loop ends
   */
  async runLoop({ intro, cycle, interval, errorLabel, stopped }) {
    await this.notify.send(intro);

    while (true) {
      if (this.aborted) break;

      try {
        await cycle();
      } catch (error) {
        if (this.aborted) break;

        /** One bad cycle is not a reason to stop */
        const errorMessage = error.message || "Unknown error!";
        logger.error(errorMessage);

        await this.notify.send([
          `❌ ${this.title} - an error occurred during ${errorLabel}!`,
          errorMessage,
        ]);
      }

      if (this.aborted) break;

      await this.delayMinutes(interval);
    }

    await this.notify.send([stopped]);
  }
}

export default AutoContext;
