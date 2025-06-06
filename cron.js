require("dotenv/config");

const { CronJob } = require("cron");
const app = require("./config/app");
const db = require("./db/models");
const utils = require("./lib/utils");
const GramClient = require("./lib/GramClient");
const bot = require("./lib/bot");

const farmers = {
  ["wonton"]: require("./farmers/drops/WontonFarmer"),
  ["space-adventure"]: require("./farmers/drops/SpaceAdventureFarmer"),
};

/** Farmers */
app.drops
  .filter((item) => item.enabled)
  .forEach((item) => {
    const FarmerClass = farmers[item.id];

    if (!FarmerClass) {
      console.warn(`No farmer class found for id "${item.id}"`);
      return;
    }

    new CronJob(
      item.interval ?? "*/10 * * * *",
      () => FarmerClass.run(item),
      null,
      true
    );
  });

/** Expire Subscriptions */
new CronJob(
  "0 0 * * *",
  async () => {
    await db.Subscription.update(
      { active: false },
      {
        where: {
          [db.Sequelize.Op.lt]: {
            endsAt: new Date(),
          },
        },
      }
    );
  },
  null,
  true
);

/** Update Account User */
new CronJob(
  "*/10 * * * *",
  async () => {
    const startDate = new Date();
    const accounts = await db.Account.findAllWithActiveSubscription();

    await Promise.allSettled(
      accounts
        .filter((item) => item.session)
        .map(async (item) => {
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
  },
  null,
  true
);
