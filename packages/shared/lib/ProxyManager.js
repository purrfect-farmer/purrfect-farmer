import axios from "axios";
import { HttpProxyAgent, HttpsProxyAgent } from "hpagent";
import WebshareClient from "./WebshareClient.js";
import FloxyClient from "./FloxyClient.js";

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
        const start = Date.now();
        const agentTimeout = 5000;
        const proxyUrl = `http://${proxy}`;

        const httpAgent = new HttpProxyAgent({
            proxy: proxyUrl,
            timeout: agentTimeout,
        });

        const httpsAgent = new HttpsProxyAgent({
            proxy: proxyUrl,
            timeout: agentTimeout,
        });

        let status = true;
        let ip;

        try {
            const data = await axios
                .get("https://api.ipify.org?format=json", {
                    httpAgent,
                    httpsAgent,
                    timeout: 7000,
                    validateStatus: () => true,
                })
                .then((res) => res.data);

            ip = data.ip;
        } catch (error) {
            status = false;
        }

        const duration = (Date.now() - start) / 1000;
        return { status, proxy, ip, duration };
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