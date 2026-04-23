import GramClient from "../lib/GramClient.js";
import app from "../config/app.js";
import bot from "../lib/bot.js";
import db from "../db/models/index.js";
import utils from "../lib/utils.js";

/** Update Accounts */
async function updateAccounts() {
  try {
    const startDate = new Date();
    const accounts = await db.Account.findAllWithActiveSubscription();
    const list = utils.shuffle(accounts.filter((account) => account.session));

    for (const account of list) {
      try {
        const waitSeconds = 10 + Math.floor(Math.random() * 60);
        /** Wait to avoid rate limits */
        if (waitSeconds) {
          await utils.delayForSeconds(waitSeconds);
        }

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
          { active: true },
          {
            where: {
              accountId: account.id,
              isBanned: false,
              active: false,
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
