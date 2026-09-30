import Decimal from "decimal.js";
import db from "../../db/models/index.js";
import logger from "../logger.js";
import { runDatabaseWrite } from "../db-write.js";
import {
  ASSIST_HELPED_KEY,
  ASSIST_RECORD_KEY,
  LAST_BOOST_KEY,
  LAST_FUNDER_KEY,
  SNAPSHOT_KEY,
} from "./constants.js";
import { byBalanceDescending } from "./summary.js";

/** What every account this server farms for the drop last looked like, from the stored snapshots */
export async function readSnapshots(farmerId) {
  const rows = await db.Farmer.findAll({
    where: { farmer: farmerId },
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
    snapshot: row.storage?.[SNAPSHOT_KEY] || null,

    /** What the last boost sent it, which a reuse would send again */
    lastBoost: row.storage?.[LAST_BOOST_KEY] || null,

    /** What it is carrying now, and who it last withdrew for */
    assist: {
      pending: row.storage?.[ASSIST_RECORD_KEY] || null,
      last: row.storage?.[ASSIST_HELPED_KEY] || null,
    },
  }));
}

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

  /** The loaded accounts a loop may work, read from the stored snapshots, fullest pool first
   * @param {object} params
   * @param {{ accounts: Map<string, object> }} params.vault - the loaded wallets
   * @param {Set<string>} params.excludeIds - accounts passed over without counting, e.g. the helpers
   * @param {boolean} params.allowFrozen - whether a frozen farmer may still be worked
   * @param {(entry: { row: object, account: object, snapshot: object }) => string | object} params.accept -
   *   returns a skip reason, or the candidate to queue
   */
  async scanCandidates({ vault, excludeIds, allowFrozen, accept }) {
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

      /** Working an account needs its phrase, both to send and to reconnect */
      const account = vault.accounts.get(userId);

      if (!account) {
        skip("not loaded");
        continue;
      }

      /** Verified accounts are kept free to withdraw for everyone else */
      if (excludeIds.has(userId)) continue;

      if (row.status === "banned") {
        skip("banned");
        continue;
      }

      /** Frozen is the operator saying to leave this account alone */
      if (row.status === "frozen" && !allowFrozen) {
        skip("frozen");
        continue;
      }

      /** An account that no longer farms has no fresh snapshot to trust */
      if (!row.account.farmingEnabled) {
        skip("farming off");
        continue;
      }

      const snapshot = row.storage?.[SNAPSHOT_KEY];

      if (!snapshot) {
        skip("never farmed");
        continue;
      }

      if (snapshot.banned) {
        skip("banned by the drop");
        continue;
      }

      const accepted = accept({ row, account, snapshot });

      if (typeof accepted === "string") {
        skip(accepted);
        continue;
      }

      candidates.push(accepted);
    }

    logger.info(
      `${this.ctx.title} - ${candidates.length} candidate(s) of ${rows.length}`,
      Object.entries(skipped)
        .map(([reason, count]) => `${count} ${reason}`)
        .join(", ") || "",
    );

    return candidates.sort(byBalanceDescending);
  }
}

export default AutoRecords;
