const axios = require("axios");
const app = require("../config/app");
const cache = require("./cache");
const db = require("../db/models");
const utils = require("./utils");
const { HttpProxyAgent, HttpsProxyAgent } = require("hpagent");

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
        }
      );

      return response.data.results.map(
        (item) =>
          `${item.username}:${item.password}@${item.proxy_address}:${item.port}`
      );
    } catch (error) {
      console.error("Fetching Proxies", { error: error.message });
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
            .get("https://ipwho.is", {
              httpAgent: new HttpProxyAgent({ proxy: `http://${proxy}` }),
              httpsAgent: new HttpsProxyAgent({ proxy: `http://${proxy}` }),
              timeout: 5000,
              validateStatus: () => true,
            })
            .then((res) => res.data.ip);
        } catch (error) {
          console.error(error.message);
          status = false;
        }

        const duration = (Date.now() - start) / 1000;
        return { status, proxy, ip, duration };
      })
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

module.exports = proxy;
