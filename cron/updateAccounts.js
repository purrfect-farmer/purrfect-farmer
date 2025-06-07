const app = require("../config/app");
const db = require("../db/models");
const utils = require("../lib/utils");
const bot = require("../lib/bot");
const GramClient = require("../lib/GramClient");

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
            /** Create and Connect Client */
            const client = await GramClient.create(account.session);
            await client.connect();

            const webview = await client.webview(app.farmerBotLink);
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

module.exports = updateAccounts;
