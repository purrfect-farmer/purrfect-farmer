require("dotenv/config");

const app = require("./config/app");

if (app.cron.enabled) {
  const farmers = require("./farmers");
  const expireSubscriptions = require("./cron/expireSubscriptions");
  const updateAccounts = require("./cron/updateAccounts");
  const updateProxies = require("./cron/updateProxies");
  const CronRunner = require("./lib/CronRunner");

  const runner = new CronRunner(app.cron.mode);

  // Register jobs
  runner.register("0 0 * * *", expireSubscriptions, "Expire Subscriptions");
  runner.register("*/20 * * * *", updateAccounts, "Update Accounts");
  runner.register("*/20 * * * *", updateProxies, "Update Proxies");

  // Farmers
  app.drops
    .filter((item) => item.enabled)
    .forEach((item) => {
      const FarmerClass = farmers[item.id];
      if (!FarmerClass) {
        console.warn(`⚠️ No farmer class found for "${item.id}"`);
        return;
      }
      runner.register(
        item.interval ?? "*/10 * * * *",
        () => FarmerClass.run(item),
        FarmerClass.title
      );
    });

  // Start Runner
  runner.start();
}
