import FloxyClient from "@purrfect/shared/lib/proxy/FloxyClient.js";
import { PROXY_PROVIDER } from "../enums/proxy-provider.js";
import WebshareClient from "@purrfect/shared/lib/proxy/WebshareClient.js";
import app from "../config/app.js";
import axios from "axios";
import cache from "./cache.js";
import { logDevError } from "./dev-log.js";
import { mapWithConcurrency } from "@purrfect/shared/utils/core.js";
import { testProxy } from "@purrfect/shared/lib/proxy/testProxy.js";

/** Proxies tested at the same time, bounding sockets and memory on large lists */
const TEST_CONCURRENCY = 100;

const IPLOCATE_LIST_URL =
  "https://raw.githubusercontent.com/iplocate/free-proxy-list/refs/heads/main/all-proxies.txt";

/** The free iplocate HTTP proxies, as `host:port` */
async function fetchIplocateList() {
  const txt = await axios.get(IPLOCATE_LIST_URL).then((res) => res.data.trim());

  return txt
    .split("\n")
    .filter((item) => item.startsWith("http://"))
    .map((item) => item.replace("http://", ""));
}

class ProxyProvider {
  /** The cached proxy list, fetched when missing */
  async list() {
    const cached = await cache.get("proxies");
    if (cached) return cached;

    const proxies = await this.fetchList();
    await cache.set("proxies", proxies);
    return proxies;
  }

  /** Fetch the configured provider's list, empty on failure */
  async fetchList() {
    try {
      return await this.fetchListFrom(app.proxy);
    } catch (error) {
      logDevError("Error fetching proxies:", error);
      return [];
    }
  }

  /** Fetch the proxy list for a provider config */
  async fetchListFrom(config) {
    switch (config.provider) {
      case PROXY_PROVIDER.WEBSHARE:
        return new WebshareClient(config).getProxies();
      case PROXY_PROVIDER.FLOXY:
        return new FloxyClient(config).getProxies(config.planId);
      case PROXY_PROVIDER.IPLOCATE:
        return fetchIplocateList();
      default:
        return [];
    }
  }

  /** Refetch the list and replace the cached one */
  async updateList() {
    const proxies = await this.fetchList();
    await cache.set("proxies", proxies);

    return proxies;
  }

  /** Test every listed proxy */
  async testProxies() {
    const proxies = await this.list();

    return mapWithConcurrency(proxies, TEST_CONCURRENCY, async (proxy) => {
      const { error, ...result } = await testProxy(proxy);

      if (error) logDevError("Error testing proxy:", error);

      return result;
    });
  }

  /** The proxies that passed their test */
  async getWorkingProxies() {
    const results = await this.testProxies();
    return results.filter((p) => p.status);
  }
}

const proxy = new ProxyProvider();

export default proxy;
