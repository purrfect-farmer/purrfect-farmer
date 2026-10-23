import GramClient from "./lib/GramClient.js";
import app from "./config/app.js";
import bot from "./lib/bot.js";
import cleanDatabase from "./actions/clean-database.js";
import updateProxies from "./actions/update-proxies.js";
import { getPublicIp, reportToSeeker } from "./services/server-address.js";

/** Handle Graceful Shutdown */
process.on("SIGINT", async () => {
  console.log("Gracefully shutting down...");
  await Promise.allSettled(
    [...GramClient.instances.values()].map((c) => c.destroy()),
  );
  process.exit(0);
});

/** Remove old farmers */
try {
  await cleanDatabase();
} catch (e) {
  console.error("Error while cleaning database:", e);
}

/** Update account proxies */
try {
  if (process.env.NODE_ENV === "production") {
    await updateProxies();
  }
} catch (e) {
  console.error("Error while updating account proxies:", e);
}

if (app.seeker.enabled || app.startup.sendServerAddress) {
  /** Fetch and send server address */
  const fetchAndSendServerAddress = async () => {
    try {
      const address = await getPublicIp();

      /** Post to Seeker Server */
      if (app.seeker.enabled) {
        await reportToSeeker(app.seeker.server, {
          key: app.seeker.key,
          name: app.name,
          address,
        }).catch((error) => {
          console.error("Failed to Update Seeker:", error);
        });
      }

      /** Send to Group */
      if (app.startup.sendServerAddress) {
        try {
          bot?.sendServerAddress(address);
        } catch (error) {
          console.error("Failed Send IP Address Notification:", error);
        }
      }
    } catch (e) {
      console.error("Error while retrieving and sending server address:", e);
    }
  };

  /** Fetch and send server address */
  await fetchAndSendServerAddress();
}
