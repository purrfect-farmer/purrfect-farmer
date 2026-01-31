import GramClient from "./lib/GramClient.js";
import app from "./config/app.js";
import axios from "axios";
import bot from "./lib/bot.js";
import cleanDatabase from "./actions/clean-database.js";

if (app.seeker.enabled || app.startup.sendServerAddress) {
  /** Fetch and send server address */
  const fetchAndSendServerAddress = async () => {
    try {
      const address = await axios
        .get("http://checkip.amazonaws.com", { timeout: 5000 })
        .then((response) => `http://${String(response.data).trim()}`);

      /** Post to Seeker Server */
      if (app.seeker.enabled) {
        await axios
          .post(
            `${app.seeker.server}/api/servers/update`,
            {
              key: app.seeker.key,
              name: app.name,
              address,
            },
            { timeout: 5000 },
          )
          .catch((error) => {
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
  fetchAndSendServerAddress();
}

/** Remove old farmers */
try {
  await cleanDatabase();
} catch (e) {
  console.error("Error while cleaning database:", e);
}

/** Handle Graceful Shutdown */
process.on("SIGINT", async () => {
  console.log("Gracefully shutting down...");
  await Promise.allSettled(
    [...GramClient.instances.values()].map((c) => c.destroy()),
  );
  process.exit(0);
});
