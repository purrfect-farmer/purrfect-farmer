import "./config/env.js";

import CronRunner from "@purrfect/shared/lib/CronRunner.js";
import path from "node:path";
import { fileURLToPath } from "node:url";

import app from "./config/app.js";
import expireSubscriptions from "./actions/expire-subscriptions.js";
import farmers from "./farmers/index.js";
import updateAccounts from "./actions/update-accounts.js";
import updateProxies from "./actions/update-proxies.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

if (app.cron.enabled) {
  const runner = new CronRunner(app.cron.mode);

  // Register jobs
  runner.register("0 0 * * *", expireSubscriptions, "Expire Subscriptions");
  runner.register("*/15 * * * *", updateProxies, "Update Proxies");
  runner.register("*/20 * * * *", updateAccounts, "Update Accounts");

  // Farmers
  const minimumRating = env("MINIMUM_FARMER_RATING", 0);

  Object.values(farmers)
    .filter(
      (FarmerClass) =>
        FarmerClass.enabled && FarmerClass.rating >= minimumRating,
    )
    .forEach((FarmerClass) => {
      runner.register(
        FarmerClass.interval || "*/10 * * * *",
        () => FarmerClass.run(),
        FarmerClass.title,
      );
    });

  // Start Runner
  runner.start();
}
