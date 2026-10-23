import axios from "axios";

/** Look up the server's public IP address */
export function getPublicIp() {
  return axios
    .get("https://api.ipify.org?format=json", { timeout: 5000 })
    .then((response) => response.data.ip);
}

/** Report this server's name and address to a Seeker server */
export function reportToSeeker(server, payload, { timeout = 5000 } = {}) {
  return axios.post(`${server}/api/servers/update`, payload, { timeout });
}
