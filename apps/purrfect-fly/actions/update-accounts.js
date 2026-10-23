import GramClient from "../lib/telegram/GramClient.js";
import app from "../config/app.js";
import bot from "../lib/bot.js";
import db from "../db/models/index.js";
import { forEachAccountSession } from "../lib/account-sessions.js";
import { runDatabaseWrite, saveSerialized } from "../lib/db-write.js";
import utils from "../lib/utils.js";
import { deleteSessionFile } from "../lib/telegram/session-store.js";

/** Save the account user and reactivate its farmers */
async function updateSingleAccount(client, account) {
  const webview = await client.getWebview(app.farmer.botLink);
  const { initDataUnsafe } = utils.extractTgWebAppData(webview.url);
  const { user } = initDataUnsafe;

  /** Update User */
  account.user = user;

  /** Save Item and set all farmers active, serialized for SQLite */
  await runDatabaseWrite(async (transaction) => {
    await account.save({ transaction });

    await db.Farmer.update(
      { status: "active" },
      {
        where: {
          accountId: account.id,
          status: "inactive",
        },
        transaction,
      },
    );
  });
}

/** Drop a session that keeps failing */
async function removeSession(account) {
  /** Delete Session File */
  await deleteSessionFile(account.session).catch(() => {});

  /** Remove Session */
  account.session = null;

  /** Save */
  await saveSerialized(account);
}

/** Update Accounts */
async function updateAccounts() {
  try {
    const startDate = new Date();
    const accounts = await db.Account.findAllWithActiveSubscription();
    const list = utils.shuffle(accounts.filter((account) => account.session));

    /** Update accounts in chunk */
    await forEachAccountSession(list, updateSingleAccount, {
      onFailure: removeSession,
    });

    /** Send message */
    await bot.sendUserUpdateCompleteMessage({
      accounts,
      startDate,
      endDate: new Date(),
    });
  } catch (error) {
    console.log("Failed to update accounts:", error);
  }
}

export default updateAccounts;
