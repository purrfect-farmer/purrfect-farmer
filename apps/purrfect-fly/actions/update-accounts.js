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

    await Promise.allSettled(
      accounts
        .filter((account) => account.session)
        .map(async (account) => {
          try {
            const startupDelay = Math.floor(account.random() * 300);

            /** Delay Startup to avoid rate limits */
            if (startupDelay) {
              await utils.delayForSeconds(startupDelay);
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
                  active: false,
                },
              }
            );
          } catch (error) {
            /** Log Error */
            console.error(error);

            /** Remove Session */
            account.session = null;

            /** Save */
            await account.save();
          }
        })
    );

    await bot.sendUserUpdateCompleteMessage({
      accounts,
      startDate,
      endDate: new Date(),
    });
  } catch (error) {
    console.log("Failed to update account user:", error);
  }
}

export default updateAccounts;
