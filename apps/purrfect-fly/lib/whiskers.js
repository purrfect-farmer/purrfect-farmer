import { addDays } from "date-fns";
import {
  DEACTIVATED_ERRORS,
  LOGGED_OUT_ERRORS,
} from "@purrfect/shared/utils/sessionStatus.js";

import GramClient from "./telegram/GramClient.js";
import JobNotifier from "./bot/JobNotifier.js";
import db from "../db/models/index.js";
import logger from "./logger.js";
import { runDatabaseWrite } from "./db-write.js";
import updateProxies from "../actions/update-proxies.js";
import utils from "./utils.js";
import { IMPORT_OUTCOME } from "../enums/import-outcome.js";
import {
  DEFAULT_SUBSCRIPTION_DAYS,
  upsertSubscription,
} from "../services/subscriptions.js";
import { createSessionId } from "../services/telegram-session.js";
import { deleteSessionFile, writeSession } from "./telegram/session-store.js";

/** Number of accounts to clone concurrently (kept low to respect flood limits) */
const CONCURRENCY = 5;

/** Maximum clone attempts per account */
const MAX_ATTEMPTS = 3;

/** Errors that can never succeed on a retry */
const PERMANENT_ERRORS = [
  "Source session is not authorized",
  "2FA password required but none provided",
  "2FA failed: no provided password matched",
  ...LOGGED_OUT_ERRORS,
  ...DEACTIVATED_ERRORS,
];

/** Extract candidate 2FA passwords from the comma/space separated input */
export function parsePasswords(passwords) {
  return String(passwords || "")
    .split(/[,\s]+/)
    .map((item) => item.trim())
    .filter(Boolean);
}

/** Check if an error is worth retrying */
function isPermanentError(error) {
  const message = error?.errorMessage || error?.message || String(error);

  return PERMANENT_ERRORS.some((item) => message.includes(item));
}

/** Mint a fresh cloud session, retrying transient failures */
async function cloneEntrySession(entry, passwords) {
  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    try {
      return await GramClient.cloneSession(entry.session, { passwords });
    } catch (error) {
      logger.error(
        `Whiskers import - clone failed (attempt ${attempt}/${MAX_ATTEMPTS}):`,
        entry.title || "(untitled)",
        error?.message || error,
      );

      /** Give up early on errors a retry cannot fix */
      if (isPermanentError(error) || attempt === MAX_ATTEMPTS) {
        throw error;
      }

      /** Backoff before the next attempt */
      await utils.delayForSeconds(attempt * 5);
    }
  }
}

/** Icon and label for each per-account outcome */
const STATUS_STEPS = {
  [IMPORT_OUTCOME.CREATED]: { icon: "✅", label: "Created" },
  [IMPORT_OUTCOME.SKIPPED]: { icon: "⏭️", label: "Skipped" },
  [IMPORT_OUTCOME.FAILED]: { icon: "❌", label: "Failed" },
};

/** Report one account as it lands */
function notifyEntryResult(notifier, status, { entry, id, message }) {
  notifier.step({
    ...STATUS_STEPS[status],
    lines: [
      `<b>Account</b>: ${utils.escapeHtml(entry.title || "(untitled)")}`,
      `<b>ID</b>: ${id ?? "unknown"}`,
      ...(message ? [`<b>Error</b>: ${utils.escapeHtml(message)}`] : []),
    ],
  });
}

/** Clone a single whiskers entry and onboard the account */
async function processEntry(
  entry,
  passwords,
  endsAt,
  farming,
  counters,
  notifier,
) {
  let user;
  let status = IMPORT_OUTCOME.FAILED;
  let message = null;

  try {
    /** Mint a fresh independent cloud session from the imported one */
    const cloned = await cloneEntrySession(entry, passwords);
    user = cloned.user;

    const id = Number(user?.id);
    if (!id) {
      throw new Error("Could not resolve Telegram account id");
    }

    /** Pick the session name upfront so a retried write reuses the same file */
    const name = createSessionId();
    let wroteSessionFile = false;
    let outcome;

    /** Serialize the database phase, SQLite cannot take concurrent writes */
    try {
      await runDatabaseWrite(async (transaction) => {
        /** Find or create the account (with any active subscription eager-loaded) */
        const [account] = await db.Account.findOrCreate({
          where: { id },
          include: [
            {
              required: false,
              association: "subscriptions",
              where: { active: true },
            },
          ],
          transaction,
        });

        /** Only write a session for accounts that don't already have one */
        if (!account.session) {
          /** Write the file before the commit, a stored name must resolve */
          if (!wroteSessionFile) {
            await writeSession(name, cloned.session);
            wroteSessionFile = true;
          }

          await account.update(
            {
              session: name,
              title: account.title || entry.title || `IMP-${id}`,
              user: {
                id,
                username: user.username || null,
                firstName: user.firstName || null,
                lastName: user.lastName || null,
              },
              options: { ...(account.options || {}), farming },
            },
            { transaction },
          );

          outcome = IMPORT_OUTCOME.CREATED;
        } else {
          outcome = IMPORT_OUTCOME.SKIPPED;
        }

        /** Always ensure the subscription reflects the requested end date */
        await upsertSubscription(account, endsAt, transaction);
      });
    } catch (error) {
      /** Drop the orphaned session file so a re-import can mint cleanly */
      if (wroteSessionFile) {
        await deleteSessionFile(name).catch(() => {});
      }

      throw error;
    }

    /** Count only once the transaction committed */
    counters[outcome].push(id);
    status = outcome;
  } catch (error) {
    status = IMPORT_OUTCOME.FAILED;
    message = error?.message || String(error);

    logger.error(
      "Whiskers import - failed account:",
      user?.id ?? "(unknown)",
      message,
    );
    counters.failed.push({
      id: user?.id ? Number(user.id) : null,
      title: entry.title ?? null,
      message,
    });
  }

  notifyEntryResult(notifier, status, {
    entry,
    id: user?.id ? Number(user.id) : null,
    message,
  });
}

/**
 * Import a purrfect-whiskers backup: for each account, mint an independent
 * cloud Telegram session, create the Account + active Subscription, then DM
 * the server admin a completion summary.
 *
 * Runs to completion in the background; the caller should not await it.
 *
 * @param {object} params
 * @param {object} params.backup - Parsed whiskers backup
 * @param {string} [params.passwords] - Comma/space separated 2FA passwords
 * @param {string} [params.subscriptionDate] - Subscription end date (ISO)
 * @param {boolean} [params.farming] - Whether newly created accounts farm
 */
export async function importWhiskersBackup({
  backup,
  passwords,
  subscriptionDate,
  farming = true,
}) {
  const entries = utils.whiskersToEntries(backup);
  const passwordList = parsePasswords(passwords);
  const endsAt = subscriptionDate
    ? new Date(subscriptionDate)
    : addDays(new Date(), DEFAULT_SUBSCRIPTION_DAYS);

  const counters = { created: [], skipped: [], failed: [] };
  const notifier = new JobNotifier({
    title: "📥 Whiskers Import",
    total: entries.length,
  });

  notifier.start();

  logger.info(`Whiskers import - starting for ${entries.length} account(s)`);

  for (const chunk of utils.chunkArrayGenerator(entries, CONCURRENCY)) {
    await Promise.all(
      chunk.map((entry) =>
        processEntry(entry, passwordList, endsAt, farming, counters, notifier),
      ),
    );

    /** Brief pause between batches */
    await utils.delayForSeconds(2);
  }

  /** Assign proxies to any newly created accounts */
  try {
    await updateProxies();
  } catch (error) {
    logger.error(
      "Whiskers import - failed to update proxies:",
      error?.message || error,
    );
  }

  logger.success(
    `Whiskers import - completed: ${counters.created.length} created, ` +
      `${counters.skipped.length} skipped, ${counters.failed.length} failed`,
  );

  await notifier.complete([
    `<b>Total</b>: ${entries.length}`,
    `<b>Created</b>: ${counters.created.length}`,
    `<b>Skipped</b>: ${counters.skipped.length}`,
    `<b>Failed</b>: ${counters.failed.length}`,
  ]);

  return counters;
}
