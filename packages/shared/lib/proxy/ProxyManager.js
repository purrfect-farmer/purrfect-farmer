import WebshareClient from "./WebshareClient.js";
import FloxyClient from "./FloxyClient.js";
import { testProxy } from "./testProxy.js";

class ProxyManager {
    constructor({ provider = "webshare", ...options }) {
        this.provider = provider;
        this.client = provider === "webshare" ?
            new WebshareClient(options) :
            new FloxyClient(options)
    }

    /* Get Proxies */
    async getProxies() {
        return await this.client.getProxies();
    }

    /* Test Proxy */
    async testProxy(proxy) {
        const { error, ...result } = await testProxy(proxy);
        return result;
    }

    /* Get Working Proxies */
    async getWorkingProxies() {
        const proxies = await this.getProxies();
        const results = await Promise.all(
            proxies.map(async (proxy) => {
                return await this.testProxy(proxy);
            }),
        );
        const workingProxies = results.sort((a, b) => a.duration - b.duration).filter(result => result.status);
        return workingProxies.map(proxy => proxy.proxy);
    }
}

export default ProxyManager;