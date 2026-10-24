import {
  PROFILE_CLEAN_ICONS,
  PROFILE_CLEAN_LABELS,
  PROFILE_CLEAN_STATUS,
} from "../enums/profile-clean-status.js";

import JobNotifier from "../lib/bot/JobNotifier.js";
import bot from "../lib/bot.js";
import db from "../db/models/index.js";
import { forEachAccountSession } from "../lib/account-sessions.js";
import { stripProfileText } from "@purrfect/shared/utils/profile.js";
import utils from "../lib/utils.js";

/** Whether a cleanup is running */
let running = false;

/** Strip the text from one account, updating only what changed */
async function cleanSingleProfile(client, text, fields) {
  const profile = await client.getFullProfile();
  let changes, changed;

  /** A name made only of the text can't be emptied, so it is left alone */
  try {
    ({ changes, changed } = stripProfileText(profile, text, fields));
  } catch {
    return PROFILE_CLEAN_STATUS.SKIPPED;
  }

  if (!changed) return PROFILE_CLEAN_STATUS.UNCHANGED;

  await client.updateProfile(changes);

  return PROFILE_CLEAN_STATUS.CLEANED;
}

/** Status of one account's settled cleanup */
const getCleanStatus = (outcome) =>
  outcome?.success ? outcome.result : PROFILE_CLEAN_STATUS.FAILED;

/** Progress message lines for one account */
function describeAccount(account, outcome) {
  const lines = [
    `<b>Account</b>: ${utils.escapeHtml(account.title || "(untitled)")}`,
    `<b>ID</b>: <code>${account.id}</code>`,
  ];

  if (outcome?.error) {
    const reason = outcome.error.message || String(outcome.error);

    lines.push(`<b>Error</b>: ${utils.escapeHtml(reason)}`);
  }

  return lines;
}

/** Run the cleanup over the accounts, reporting each one, then the full report */
async function runCleanup(accounts, { text, fields }) {
  const notifier = new JobNotifier({
    title: "🧹 Profile Cleanup",
    total: accounts.length,
  });

  try {
    const startDate = new Date();

    notifier.start([
      `<b>Text</b>: <code>${utils.escapeHtml(text)}</code>`,
      `<b>Fields</b>: ${fields.join(", ")}`,
    ]);

    const results = await forEachAccountSession(
      accounts,
      (client) => cleanSingleProfile(client, text, fields),
      {
        onResult: (account, outcome) => {
          const status = getCleanStatus(outcome);

          notifier.step({
            icon: PROFILE_CLEAN_ICONS[status],
            label: PROFILE_CLEAN_LABELS[status],
            lines: describeAccount(account, outcome),
          });
        },
      },
    );

    const report = accounts.map((account) => ({
      account,
      status: getCleanStatus(results.get(account)),
    }));

    /** The step messages go out before the full report */
    await notifier.flush();

    await bot?.sendProfileCleanCompleteMessage({
      text,
      fields,
      report,
      startDate,
      endDate: new Date(),
    });
  } catch (error) {
    console.log("Failed to clean profiles:", error);
    notifier.fail(utils.escapeHtml(error?.message || String(error)));
  } finally {
    running = false;
  }
}

/** Start cleaning every account with a session, returning how many will run */
export default async function cleanProfiles({ text, fields }) {
  if (running) return null;

  running = true;

  try {
    const accounts = await db.Account.findAll();
    const list = accounts.filter((account) => account.session);

    runCleanup(list, { text, fields });

    return list.length;
  } catch (error) {
    running = false;
    throw error;
  }
}
