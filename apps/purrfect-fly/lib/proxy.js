import { HttpProxyAgent, HttpsProxyAgent } from "hpagent";

import app from "../config/app.js";
import axios from "axios";
import cache from "./cache.js";
import db from "../db/models/index.js";
import utils from "./utils.js";

class ProxyProvider {
  /**
   * Get List
   */
  async list() {
    const cached = await cache.get("proxies");
    if (cached) return cached;

    const proxies = await this.fetchList();
    await cache.set("proxies", proxies);
    return proxies;
  }

  /**
   * Get Random Unused Proxy
   */
  async getRandomUnused() {
    const proxies = await db.Account.findAllWithActiveSubscription();
    const available = await this.getAvailable(proxies);
    return available.length > 0 ? utils.randomItem(available) : null;
  }

  /**
   * Get Available Proxies
   */
  async getAvailable(usedProxies) {
    const list = await this.list();
    return list.filter((proxy) => !usedProxies.includes(proxy));
  }

  /**
   * Fetch Proxy List from Webshare API
   */
  async fetchList() {
    try {
      if (app.proxy.provider === "webshare") {
        const response = await axios.get(
          "https://proxy.webshare.io/api/v2/proxy/list",
          {
            headers: {
              Authorization: `Token ${app.proxy.apiKey}`,
            },
            params: {
              ["mode"]: "direct",
              ["valid"]: true,
              ["page"]: app.proxy.page,
              ["page_size"]: app.proxy.pageSize,
            },
          },
        );

        return response.data.results.map(
          (item) =>
            `${item.username}:${item.password}@${item.proxy_address}:${item.port}`,
        );
      } else if (app.proxy.provider === "iplocate") {
        const txt = await axios
          .get(
            "https://raw.githubusercontent.com/iplocate/free-proxy-list/refs/heads/main/all-proxies.txt",
          )
          .then((res) => res.data.trim());
        const list = txt
          .split("\n")
          .filter((item) => item.startsWith("http://"))
          .map((item) => item.replace("http://", ""));

        return list;
      } else {
        return [];
      }
    } catch (error) {
      console.error("Fetching Proxies", error);
      return [];
    }
  }

  /**
   * Force Update Proxy List
   */
  async updateList() {
    const proxies = await this.fetchList();
    await cache.set("proxies", proxies);

    return proxies;
  }

  /**
   * Test Proxies
   */
  async testProxies() {
    const proxies = await this.list();

    const results = await Promise.all(
      proxies.map(async (proxy) => {
        const start = Date.now();
        let status = true;
        let ip;

        try {
          ip = await axios
            .get("http://checkip.amazonaws.com", {
              httpAgent: new HttpProxyAgent({ proxy: `http://${proxy}` }),
              httpsAgent: new HttpsProxyAgent({ proxy: `http://${proxy}` }),
              timeout: 5000,
              validateStatus: () => true,
            })
            .then((res) => String(res.data).trim());
        } catch (error) {
          console.error(error);
          status = false;
        }

        const duration = (Date.now() - start) / 1000;
        return { status, proxy, ip, duration };
      }),
    );

    return results;
  }

  /**
   * Get Only Working Proxies
   */
  async getWorkingProxies() {
    const results = await this.testProxies();
    return results.filter((p) => p.status);
  }
}

const proxy = new ProxyProvider();

export default proxy;
