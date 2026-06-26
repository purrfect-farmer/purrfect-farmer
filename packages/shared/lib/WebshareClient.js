import axios from 'axios';

class WebshareClient {
    constructor({ apiKey, page, pageSize }) {
        this.apiKey = apiKey;
        this.page = page;
        this.pageSize = pageSize;
    }

    /* Get Proxies */
    async getProxies() {
        const response = await axios.get(
            "https://proxy.webshare.io/api/v2/proxy/list",
            {
                headers: {
                    Authorization: `Token ${this.apiKey}`,
                },
                params: {
                    ["mode"]: "direct",
                    ["valid"]: true,
                    ["page"]: this.page,
                    ["page_size"]: this.pageSize,
                },
            },
        );
        return response.data.results.map(
            (item) =>
                `${item.username}:${item.password}@${item.proxy_address}:${item.port}`,
        );
    }
}

export default WebshareClient;