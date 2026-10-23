import Decimal from "decimal.js";
import db from "../../db/models/index.js";
import logger from "../logger.js";
import { runDatabaseWrite } from "../db-write.js";
import {
  ASSIST_HELPED_KEY,
  ASSIST_RECORD_KEY,
  LAST_BOOST_KEY,
  LAST_FUNDER_KEY,
} from "./constants.js";
import { scanCandidates } from "./records/candidates.js";

/** Reads and writes what the drop's farmer rows remember about each account */
class AutoRecords {
  /** @param {import("./AutoContext.js").default} ctx */
  constructor(ctx) {
    this.ctx = ctx;
  }

  get farmerId() {
    return this.ctx.farmerId;
  }

  /** Write one storage key through a runner, logging instead of failing the run */
  async setOnRunner(runner, key, value, accountId, what) {
    try {
      await runner.storage.set(key, value);
    } catch (e) {
      logger.error(`Failed to ${what}:`, accountId, e.message);
    }
  }

  /** One storage key across these accounts, read without logging anyone in
   * @param {(string|number)[]} accountIds
   * @param {string} key
   * @returns {Promise<Map<string, any>>} - accountId to the stored value, when there is one
   */
  async readStorageKey(accountIds, key) {
    const values = new Map();

    if (!accountIds.length) return values;

    const rows = await db.Farmer.findAll({
      where: { farmer: this.farmerId, accountId: accountIds },
    });

    for (const row of rows) {
      const value = row.storage?.[key];

      if (value) {
        values.set(String(row.accountId), value);
      }
    }

    return values;
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

  /** Lend a summary the account's payout record, which only the stored snapshot carries otherwise */
  async withWithdrawalRecord(runner, summary) {
    if (!runner || !summary || summary.withdrawal) return summary;

    try {
      const withdrawal = await runner.readAutoWithdrawals();

      return withdrawal ? { ...summary, withdrawal } : summary;
    } catch (e) {
      /** Worth a line less, not a failed notification */
      logger.error("Failed to read the payout record:", e.message);
      return summary;
    }
  }

  /** Remember the wallet that just sent an account its tokens */
  async recordLastFunder(runner, cloudAccount, funderAddress) {
    if (!runner || !funderAddress) return;

    await this.setOnRunner(
      runner,
      LAST_FUNDER_KEY,
      { address: funderAddress, updatedAt: Date.now() },
      cloudAccount.id,
      "record the last funder",
    );
  }

  /** What last funded each of these accounts, read without logging anyone in
   * @param {object[]} accounts - vault accounts, each with a `userId`
   * @returns {Promise<Map<string, string>>} - userId to the last funder's address
   */
  async getLastFunders(accounts) {
    const lastFunders = new Map();

    try {
      const records = await this.readStorageKey(
        accounts.map((account) => account.userId).filter(Boolean),
        LAST_FUNDER_KEY,
      );

      for (const [accountId, record] of records) {
        if (record.address) lastFunders.set(accountId, record.address);
      }
    } catch (e) {
      /** Worth a line, not a failed run */
      logger.error("Failed to read the last funders:", e.message);
    }

    return lastFunders;
  }

  /** The amount a reuse should send, null when the booster should roll its own */
  boostAmountFor(cloudAccount) {
    if (!this.ctx.options.reuseLastAmount) return null;

    const stored = new Decimal(
      cloudAccount?.farmer?.storage?.[LAST_BOOST_KEY]?.amount || 0,
    );

    return stored.greaterThan(0) ? stored : null;
  }

  /** Remember what a boost sent, so a later run can send the same again */
  async recordLastBoostAmount(runner, cloudAccount, jettonAmount) {
    if (!runner || !jettonAmount) return;

    await this.setOnRunner(
      runner,
      LAST_BOOST_KEY,
      { amount: jettonAmount.toString(), updatedAt: Date.now() },
      cloudAccount.id,
      "record the last boosted amount",
    );
  }

  /** The stored amount for one account, read without a cloud account in hand */
  async readLastBoostAmount(accountId) {
    if (!this.ctx.options.reuseLastAmount || !accountId) return null;

    try {
      const dbFarmer = await db.Farmer.findOne({
        where: { farmer: this.farmerId, accountId },
      });

      const stored = new Decimal(
        dbFarmer?.storage?.[LAST_BOOST_KEY]?.amount || 0,
      );

      return stored.greaterThan(0) ? stored : null;
    } catch (e) {
      /** Worth a line, not a failed boost */
      logger.error("Failed to read the last boosted amount:", e.message);
      return null;
    }
  }

  /** Store the amount for a boost made outside a farming session, which has no runner */
  async storeLastBoostAmount(accountId, jettonAmount) {
    if (!accountId || !jettonAmount) return;

    try {
      await runDatabaseWrite(async (transaction) => {
        const dbFarmer = await db.Farmer.findOne({
          where: { farmer: this.farmerId, accountId },
          transaction,
        });

        if (!dbFarmer) return;

        await dbFarmer.update(
          {
            storage: {
              ...dbFarmer.storage,
              [LAST_BOOST_KEY]: {
                amount: jettonAmount.toString(),
                updatedAt: Date.now(),
              },
            },
          },
          { transaction },
        );
      });
    } catch (e) {
      logger.error(
        "Failed to store the last boosted amount:",
        accountId,
        e.message,
      );
    }
  }

  /** The withdrawals helpers have placed and the drop has not settled yet, read without logging anyone in */
  getOutstandingAssists(helpers) {
    return this.readStorageKey(
      helpers.map((account) => account.userId),
      ASSIST_RECORD_KEY,
    );
  }

  /** Remember the withdrawal a helper has just placed, so its settlement can be reported */
  recordAssist(runner, helper, record) {
    return this.setOnRunner(
      runner,
      ASSIST_RECORD_KEY,
      record,
      helper.userId,
      "record the assisted withdrawal",
    );
  }

  /** Keep who a helper last withdrew for, since the in-flight record is cleared on settlement */
  recordLastHelped(runner, helper, record) {
    return this.setOnRunner(
      runner,
      ASSIST_HELPED_KEY,
      record,
      helper.userId,
      "record the last assisted account",
    );
  }

  /** Forget what a helper was carrying, once the drop has settled it */
  clearAssist(runner, helper) {
    return this.setOnRunner(
      runner,
      ASSIST_RECORD_KEY,
      null,
      helper.userId,
      "clear the assisted withdrawal",
    );
  }

  /** The loaded accounts a loop may work, fullest pool first */
  scanCandidates(params) {
    return scanCandidates(this.ctx, params);
  }
}

export default AutoRecords;
