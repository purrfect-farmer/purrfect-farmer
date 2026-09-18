import db from "../db/models/index.js";
import logger from "./logger.js";
import utils from "./utils.js";

/** Maximum attempts for a write that keeps hitting a locked database */
const MAX_ATTEMPTS = 3;

/** Seconds to wait before the next attempt */
const RETRY_DELAY = 1;

/** Tail of the write chain, every queued task runs after it */
let chain = Promise.resolve();

/** Queue a task so only one database write runs at a time in this process */
export function enqueueDatabaseWrite(task) {
  const result = chain.then(task, task);

  /** Keep the chain alive even when a task rejects */
  chain = result.then(
    () => {},
    () => {},
  );

  return result;
}

/** Check if an error is SQLite refusing a concurrent write */
export function isDatabaseLockedError(error) {
  const code = error?.parent?.code || error?.original?.code || error?.code;

  if (code === "SQLITE_BUSY" || code === "SQLITE_LOCKED") {
    return true;
  }

  const message = error?.message || String(error);

  return message.includes("SQLITE_BUSY") || message.includes("SQLITE_LOCKED");
}

/**
 * Run a database write serialized against every other caller, wrapped in a
 * single transaction, retrying only when the database is locked by a writer
 * outside this queue.
 *
 * @param {(transaction: import("sequelize").Transaction) => Promise<any>} task
 */
export function runDatabaseWrite(task) {
  return enqueueDatabaseWrite(async () => {
    for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
      try {
        return await db.sequelize.transaction(task);
      } catch (error) {
        if (!isDatabaseLockedError(error) || attempt === MAX_ATTEMPTS) {
          throw error;
        }

        logger.error(
          `Database write - locked (attempt ${attempt}/${MAX_ATTEMPTS}):`,
          error?.message || error,
        );

        await utils.delayForSeconds(RETRY_DELAY);
      }
    }
  });
}

export default { enqueueDatabaseWrite, isDatabaseLockedError, runDatabaseWrite };
