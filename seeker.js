const { default: axios } = require("axios");
const app = require("./config/app");

if (app.seeker.enabled) {
  axios.get("https://ipwho.is", { timeout: 5000 }).then((response) => {
    const address = `http://${response.data.ip}`;
    axios.post(`${app.seeker.server}/api/servers/update`, {
      key: app.seeker.key,
      name: app.name,
      address,
    });
  });
}
