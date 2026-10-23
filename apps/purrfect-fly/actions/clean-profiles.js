import bot from "../lib/bot.js";
import db from "../db/models/index.js";
import { PROFILE_CLEAN_STATUS } from "../lib/clean-status.js";
import { forEachAccountSession } from "../lib/account-sessions.js";
import { stripProfileText } from "@purrfect/shared/utils/profile.js";

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

/** Run the cleanup over the accounts, then report through the bot */
async function runCleanup(accounts, { text, fields }) {
  try {
    const startDate = new Date();
    const results = await forEachAccountSession(accounts, (client) =>
      cleanSingleProfile(client, text, fields),
    );

    const report = accounts.map((account) => {
      const outcome = results.get(account);

      return {
        account,
        status: outcome?.success
          ? outcome.result
          : PROFILE_CLEAN_STATUS.FAILED,
      };
    });

    await bot.sendProfileCleanCompleteMessage({
      text,
      fields,
      report,
      startDate,
      endDate: new Date(),
    });
  } catch (error) {
    console.log("Failed to clean profiles:", error);
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
