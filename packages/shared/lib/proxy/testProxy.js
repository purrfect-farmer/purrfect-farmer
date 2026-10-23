import { HttpProxyAgent, HttpsProxyAgent } from "hpagent";

import axios from "axios";

/** Agent connect timeout for a proxy test */
const AGENT_TIMEOUT = 5000;

/** Request timeout for a proxy test */
const REQUEST_TIMEOUT = 7000;

/** Check a `user:pass@host:port` proxy by fetching the public IP through it */
export async function testProxy(proxy) {
  const start = Date.now();
  const proxyUrl = `http://${proxy}`;

  const httpAgent = new HttpProxyAgent({
    proxy: proxyUrl,
    timeout: AGENT_TIMEOUT,
  });

  const httpsAgent = new HttpsProxyAgent({
    proxy: proxyUrl,
    timeout: AGENT_TIMEOUT,
  });

  let status = true;
  let ip;
  let error = null;

  try {
    const data = await axios
      .get("https://api.ipify.org?format=json", {
        httpAgent,
        httpsAgent,
        timeout: REQUEST_TIMEOUT,
        validateStatus: () => true,
      })
      .then((res) => res.data);

    ip = data.ip;
  } catch (e) {
    error = e;
    status = false;
  }

  const duration = (Date.now() - start) / 1000;
  return { status, proxy, ip, duration, error };
}
