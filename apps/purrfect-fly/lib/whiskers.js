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

/** Clone a single whiskers session and onboard the account */
async function processSession(sessionString, passwords, endsAt, counters) {
  let user;

  try {
    /** Mint a fresh independent cloud session from the imported one */
    const cloned = await GramClient.cloneSession(sessionString, { passwords });
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

      const fullName = [user.firstName, user.lastName]
        .filter(Boolean)
        .join(" ")
        .trim();

      await account.update({
        session: name,
        title: account.title || `IMP-${id}`,
        user: {
          id,
          username: user.username || null,
          firstName: user.firstName || null,
          lastName: user.lastName || null,
        },
      });

      counters.created.push(id);
    } else {
      counters.skipped.push(id);
    }

    /** Always ensure the subscription reflects the requested end date */
    await upsertSubscription(account, endsAt);
  } catch (error) {
    logger.error(
      "Whiskers import - failed account:",
      user?.id ?? "(unknown)",
      error?.message || error,
    );
    counters.failed.push({
      id: user?.id ? Number(user.id) : null,
      message: error?.message || String(error),
    });
  }
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
  const sessions = utils.whiskersToSessions(backup);
  const passwordList = parsePasswords(passwords);
  const endsAt = subscriptionDate
    ? new Date(subscriptionDate)
    : addDays(new Date(), 30);

  const counters = { created: [], skipped: [], failed: [] };

  logger.info(`Whiskers import - starting for ${sessions.length} session(s)`);

  for (const chunk of utils.chunkArrayGenerator(sessions, CONCURRENCY)) {
    await Promise.all(
      chunk.map((sessionString) =>
        processSession(sessionString, passwordList, endsAt, counters),
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
    `<b>Total</b>: ${sessions.length}`,
    `<b>Created</b>: ${counters.created.length}`,
    `<b>Skipped</b>: ${counters.skipped.length}`,
    `<b>Failed</b>: ${counters.failed.length}`,
    `\n<b>🗓️ Start</b>: ${format(startDate, "yyyy-MM-dd HH:mm:ss")}`,
    `<b>🗓️ End</b>: ${format(endDate, "yyyy-MM-dd HH:mm:ss")}`,
  ]);

  return counters;
}
