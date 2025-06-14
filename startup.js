const { default: axios } = require("axios");
const app = require("./config/app");
const bot = require("./lib/bot");

axios
  .get("http://checkip.amazonaws.com", { timeout: 5000 })
  .then((response) => {
    const address = `http://${String(response.data).trim()}`;

    /** Post to Seeker Server */
    if (app.seeker.enabled) {
      axios.post(
        `${app.seeker.server}/api/servers/update`,
        {
          key: app.seeker.key,
          name: app.name,
          address,
        },
        { timeout: 5000 }
      );
    }

    /** Send to Group */
    if (app.startup.sendServerAddress) {
      bot.sendServerAddress(address);
    }
  });
