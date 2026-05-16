import GramClient from "../lib/GramClient.js";
import app from "../config/app.js";
import bot from "../lib/bot.js";
import db from "../db/models/index.js";
import utils from "../lib/utils.js";

/** Update single account */
async function updateSingleAccount(account, index) {
  try {
    /** Delay */
    await utils.delayForSeconds(index * 2);

    /** Create and Connect Client */
    const client = await GramClient.create(account.session);
    await client.connect();

    const webview = await client.getWebview(app.farmer.botLink);
    const { initDataUnsafe } = utils.extractTgWebAppData(webview.url);
    const { user } = initDataUnsafe;

    /** Update User */
    account.user = user;

    /** Save Item */
    await account.save();

    /** Set all farmers active */
    await db.Farmer.update(
      { status: "active" },
      {
        where: {
          accountId: account.id,
          status: "inactive",
        },
      },
    );
  } catch (error) {
    /** Log Error */
    if (process.env.NODE_ENV === "development") {
      console.error("Error updating account:", error);
    }

    /** Remove Session */
    account.session = null;

    /** Save */
    await account.save();
  }
}

/** Update Accounts */
async function updateAccounts() {
  try {
    const startDate = new Date();
    const accounts = await db.Account.findAllWithActiveSubscription();
    const list = utils.shuffle(accounts.filter((account) => account.session));

    /** Update accounts in chunk */
    for (const chunk of utils.chunkArrayGenerator(list, 20)) {
      await Promise.allSettled(
        chunk.map((account, index) => updateSingleAccount(account, index)),
      );
    }

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
