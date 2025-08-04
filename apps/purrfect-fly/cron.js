require("dotenv/config");

const app = require("./config/app");

if (app.cron.enabled) {
  const farmers = require("./farmers");
  const expireSubscriptions = require("./actions/expireSubscriptions");
  const updateProxies = require("./actions/updateProxies");
  const updateAccounts = require("./actions/updateAccounts");
  const CronRunner = require("./lib/CronRunner");

  const runner = new CronRunner(app.cron.mode);

  // Register jobs
  runner.register("0 0 * * *", expireSubscriptions, "Expire Subscriptions");
  runner.register("*/15 * * * *", updateProxies, "Update Proxies");
  runner.register("*/20 * * * *", updateAccounts, "Update Accounts");

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
