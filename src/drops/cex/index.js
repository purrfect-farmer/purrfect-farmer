import { createFarmer } from "@/lib/createFarmer";
import { createLazyElement } from "@/lib/createLazyElement";

import icon from "./assets/images/icon.png?format=webp&w=80&h=80";

export default createFarmer({
  id: "cex",
  title: "CEX",
  icon,
  component: createLazyElement(() => import("./CEX")),
  telegramLink: "https://t.me/cexio_tap_bot?start=1717159919141996",
  host: "app.cexptap.com",
  netRequest: {
    origin: "https://app.cexptap.com",
    domains: ["app.cexptap.com"],
  },
  authHeaders: ["x-appl-version", "x-request-userhash"],
  embedWebPage: true,
  cacheAuth: false,

  /**
   * Fetch Auth
   * @param {import("axios").AxiosInstance} api
   */
  fetchAuth(api, telegramWebApp) {
    return { hash: telegramWebApp.initDataUnsafe["hash"] };
  },

  /**
   * Configure Auth Headers
   * @param {import("axios").AxiosInstance} api
   */
  configureAuthHeaders(api, telegramWebApp, data) {
    api.defaults.headers.common["x-appl-version"] = "0.20.7";
    api.defaults.headers.common["x-request-userhash"] = data.hash;
  },

  tasks: {
    ["tasks"]: false,
    ["cards"]: false,
  },
});
