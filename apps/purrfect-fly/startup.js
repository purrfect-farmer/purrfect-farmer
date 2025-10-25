import axios from "axios";

import app from "./config/app.js";
import bot from "./lib/bot.js";
import cleanDatabase from "./actions/clean-database.js";

if (app.seeker.enabled || app.startup.sendServerAddress) {
  axios
    .get("http://checkip.amazonaws.com", { timeout: 5000 })
    .then((response) => {
      const address = `http://${String(response.data).trim()}`;

      /** Post to Seeker Server */
      if (app.seeker.enabled) {
        axios
          .post(
            `${app.seeker.server}/api/servers/update`,
            {
              key: app.seeker.key,
              name: app.name,
              address,
            },
            { timeout: 5000 }
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
    })
    .catch((error) => console.error("Failed to get IP Address:", error));
}

/** Remove old farmers */
await cleanDatabase();
