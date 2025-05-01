import { createFarmer } from "@/lib/createFarmer";
import { createLazyElement } from "@/lib/createLazyElement";

import icon from "./assets/images/icon.png?format=webp&w=80&h=80";

export default createFarmer({
  id: "money-bux",
  title: "Money Bux",
  icon,
  component: createLazyElement(() => import("./MoneyBux")),
  telegramLink: "https://t.me/moneybux_bot/app?startapp=r_1147265290",
  host: "moneybux.xyz",
  netRequest: {
    origin: "https://moneybux.xyz",
    domains: ["moneybux.xyz"],
  },
  embedWebPage: true,
  apiOptions: {
    withCredentials: true,
  },
  cacheAuth: false,

  /**
   * Fetch Auth
   * @param {import("axios").AxiosInstance} api
   */
  fetchAuth(api, telegramWebApp) {
    return api
      .post(
        "https://moneybux.xyz/authorization",
        new URLSearchParams({
          initData: telegramWebApp.initData,
          tgUplineId: telegramWebApp.initDataUnsafe["start_param"],
        })
      )
      .then((res) => res.data);
  },

  tasks: {
    ["tasks"]: false,
    ["refill-spins"]: false,
    ["wheel"]: false,
    ["tickets"]: false,
  },
});
