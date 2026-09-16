import { addDays, format } from "date-fns";

import GramClient from "./GramClient.js";
import bot from "./bot.js";
import crypto from "node:crypto";
import db from "../db/models/index.js";
import logger from "./logger.js";
import updateProxies from "../actions/update-proxies.js";
import utils from "./utils.js";

/** Number of accounts to clone concurrently (kept low to respect flood limits) */
const CONCURRENCY = 5;

/** Maximum clone attempts per account */
const MAX_ATTEMPTS = 3;

/** Errors that can never succeed on a retry */
const PERMANENT_ERRORS = [
  "Source session is not authorized",
  "2FA password required but none provided",
  "2FA failed: no provided password matched",
  "AUTH_KEY_UNREGISTERED",
  "AUTH_KEY_DUPLICATED",
  "SESSION_REVOKED",
  "SESSION_EXPIRED",
  "USER_DEACTIVATED",
  "USER_DEACTIVATED_BAN",
];

/** Extract candidate 2FA passwords from the comma/space separated input */
export function parsePasswords(passwords) {
  return String(passwords || "")
    .split(/[,\s]+/)
    .map((item) => item.trim())
    .filter(Boolean);
}

/** Create or extend an active subscription for an account */
async function upsertSubscription(account, endsAt) {
  if (account.subscription) {
    await account.subscription.update({ endsAt });
  } else {
    await account.createSubscription({
      active: true,
      startsAt: new Date(),
      endsAt,
    });
  }
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

/** Labels for each per-account outcome */
const STATUS_LABELS = {
  created: "✅ Created",
  skipped: "⏭️ Skipped",
  failed: "❌ Failed",
};

/** Keep the admin posted as each account lands */
async function notifyEntryResult(
  status,
  { entry, id, message },
  counters,
  total,
) {
  const done =
    counters.created.length + counters.skipped.length + counters.failed.length;

  await bot?.sendAdminMessage([
    `<b>📥 Whiskers Import</b>`,
    `<i>${STATUS_LABELS[status]}</i>\n`,
    `<b>Account</b>: ${utils.escapeHtml(entry.title || "(untitled)")}`,
    `<b>ID</b>: ${id ?? "unknown"}`,
    ...(message ? [`<b>Error</b>: ${utils.escapeHtml(message)}`] : []),
    `\n<b>Progress</b>: ${done}/${total}`,
  ]);
}

/** Clone a single whiskers entry and onboard the account */
async function processEntry(entry, passwords, endsAt, counters, total) {
  let user;
  let status = "failed";
  let message = null;

  try {
    /** Mint a fresh independent cloud session from the imported one */
    const cloned = await cloneEntrySession(entry, passwords);
    user = cloned.user;

    const id = Number(user?.id);
    if (!id) {
      throw new Error("Could not resolve Telegram account id");
    }

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
    });

    /** Only write a session for accounts that don't already have one */
    if (!account.session) {
      const name = crypto.randomBytes(8).toString("hex");
      await GramClient.writeSession(name, cloned.session);

      await account.update({
        session: name,
        title: account.title || entry.title || `IMP-${id}`,
        user: {
          id,
          username: user.username || null,
          firstName: user.firstName || null,
          lastName: user.lastName || null,
        },
      });

      counters.created.push(id);
      status = "created";
    } else {
      counters.skipped.push(id);
      status = "skipped";
    }

    /** Always ensure the subscription reflects the requested end date */
    await upsertSubscription(account, endsAt);
  } catch (error) {
    status = "failed";
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

  await notifyEntryResult(
    status,
    { entry, id: user?.id ? Number(user.id) : null, message },
    counters,
    total,
  );
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
 */
export async function importWhiskersBackup({
  backup,
  passwords,
  subscriptionDate,
}) {
  const startDate = new Date();
  const entries = utils.whiskersToEntries(backup);
  const passwordList = parsePasswords(passwords);
  const endsAt = subscriptionDate
    ? new Date(subscriptionDate)
    : addDays(new Date(), 30);

  const counters = { created: [], skipped: [], failed: [] };

  logger.info(`Whiskers import - starting for ${entries.length} account(s)`);

  for (const chunk of utils.chunkArrayGenerator(entries, CONCURRENCY)) {
    await Promise.all(
      chunk.map((entry) =>
        processEntry(entry, passwordList, endsAt, counters, entries.length),
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

  const endDate = new Date();

  logger.success(
    `Whiskers import - completed: ${counters.created.length} created, ` +
      `${counters.skipped.length} skipped, ${counters.failed.length} failed`,
  );

  /** Notify the admin */
  await bot?.sendAdminMessage([
    `<b>📥 Whiskers Import</b>`,
    `<i>✅ Status: Completed</i>\n`,
    `<b>Total</b>: ${entries.length}`,
    `<b>Created</b>: ${counters.created.length}`,
    `<b>Skipped</b>: ${counters.skipped.length}`,
    `<b>Failed</b>: ${counters.failed.length}`,
    `\n<b>🗓️ Start</b>: ${format(startDate, "yyyy-MM-dd HH:mm:ss")}`,
    `<b>🗓️ End</b>: ${format(endDate, "yyyy-MM-dd HH:mm:ss")}`,
  ]);

  return counters;
}
