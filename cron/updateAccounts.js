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
        .filter((item) => item.session)
        .map(async (item) => {
          /** Set all farmers active */
          await db.Farmer.update(
            { active: true },
            {
              where: {
                accountId: item.id,
                active: false,
              },
            }
          );

          const {
            entity: bot,
            shortName,
            startParam,
          } = utils.parseTelegramLink(app.farmerBotLink);

          /** Create and Connect Client */
          const client = await GramClient.create(item.session);
          await client.connect();

          const webview = await client.webview({
            bot,
            shortName,
            startParam,
          });
          const { initDataUnsafe } = utils.extractTgWebAppData(webview.url);
          const { user } = initDataUnsafe;

          item.user = user;
          await item.save();
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
