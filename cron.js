require("dotenv/config");

const { CronJob } = require("cron");
const app = require("./config/app");
const farmers = require("./farmers");
const expireSubscriptions = require("./cron/expireSubscriptions");
const updateAccounts = require("./cron/updateAccounts");
const updateProxies = require("./cron/updateProxies");

/** Expire Subscriptions */
new CronJob("0 0 * * *", expireSubscriptions, null, true);

/** Update Account User */
new CronJob("*/20 * * * *", updateAccounts, null, true);

/** Update Proxies */
new CronJob("*/20 * * * *", updateProxies, null, true);

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
