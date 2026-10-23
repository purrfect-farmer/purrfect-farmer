import "./config/env.js";

import CronRunner from "@purrfect/shared/lib/CronRunner.js";
import app from "./config/app.js";
import expireSubscriptions from "./actions/expire-subscriptions.js";
import farmers from "./farmers/index.js";
import unfreezeFarmers from "./actions/unfreeze-farmers.js";
import updateAccounts from "./actions/update-accounts.js";
import updateProxies from "./actions/update-proxies.js";

if (app.cron.enabled) {
  const runner = new CronRunner(app.cron.mode);

  /**  Register jobs */
  runner.register("0 0 * * *", expireSubscriptions, "Expire Subscriptions");
  runner.register("*/15 * * * *", updateProxies, "Update Proxies");
  runner.register("*/20 * * * *", updateAccounts, "Update Accounts");
  runner.register("*/10 * * * *", unfreezeFarmers, "Unfreeze Farmers");

  /**  Farmers */
  const minimumRating = env("MINIMUM_FARMER_RATING", 0);

  Object.values(farmers)
    .filter((FarmerClass) => {
      return (
        FarmerClass.enabled &&
        FarmerClass.rating >= minimumRating &&
        FarmerClass.interval
      );
    })
    .forEach((FarmerClass) => {
      runner.register(
        FarmerClass.interval,
        () => FarmerClass.run({ scheduled: true }),
        FarmerClass.title,
      );
    });

  /** Start Runner */
  runner.start();
}
