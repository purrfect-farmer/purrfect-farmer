import { PROXY_PROVIDER } from "../../enums/proxy-provider.js";
import { check } from "./check.js";
import proxy from "../../lib/proxy.js";

/** Check the proxy provider returns a list */
export default async function testProxy(values, results) {
  await check(results, "Proxy list", async () => {
    const list = await proxy.fetchListFrom({
      provider: values.PROXY_PROVIDER || PROXY_PROVIDER.WEBSHARE,
      apiKey: values.PROXY_API_KEY || "",
      planId: values.PROXY_PLAN_ID || "",
      page: Number(values.PROXY_PAGE) || 1,
      pageSize: Number(values.PROXY_PAGE_SIZE) || 100,
    });

    if (!list.length) throw new Error("Provider returned no proxies.");
    return `${list.length} proxies found`;
  });
}
