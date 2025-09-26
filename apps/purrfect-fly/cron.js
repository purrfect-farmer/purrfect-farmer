import "./config/env.js";

import path from "node:path";
import { fileURLToPath } from "node:url";

import CronRunner from "@purrfect/shared/lib/CronRunner.js";
import app from "./config/app.js";
import expireSubscriptions from "./actions/expireSubscriptions.js";
import farmers from "./farmers/index.js";
import updateAccounts from "./actions/updateAccounts.js";
import updateProxies from "./actions/updateProxies.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

if (app.cron.enabled) {
  const runner = new CronRunner(app.cron.mode);

  // Register jobs
  runner.register("0 0 * * *", expireSubscriptions, "Expire Subscriptions");
  runner.register("*/15 * * * *", updateProxies, "Update Proxies");
  runner.register("*/20 * * * *", updateAccounts, "Update Accounts");

  // Farmers
  Object.values(farmers)
    .filter((FarmerClass) => FarmerClass.enabled)
    .forEach((FarmerClass) => {
      runner.register(
        FarmerClass.interval ?? "*/10 * * * *",
        () => FarmerClass.run(),
        FarmerClass.title
      );
    });

  // Start Runner
  runner.start();
}
