import { createFarmer } from "@/lib/createFarmer";
import { createLazyElement } from "@/lib/createLazyElement";

import icon from "./assets/images/icon.png?format=webp&w=80&h=80";

export default createFarmer({
  id: "truecoin",
  title: "Truecoin",
  icon,
  component: createLazyElement(() => import("./Truecoin")),
  telegramLink: "https://t.me/true_coin_bot?start=1147265290",
  host: "bot.true.world",
  netRequest: {
    origin: "https://bot.true.world",
    domains: ["true.world"],
  },

  cacheAuth: false,

  /**
   * @param {import("axios").AxiosInstance} api
   */
  fetchAuth(api, telegramWebApp) {
    return api
      .post(
        "https://api.true.world/api/auth/signIn",
        {
          tgWebAppStartParam: null,
          tgPlatform: telegramWebApp.platform,
          tgVersion: telegramWebApp.version,
          lang: telegramWebApp.initDataUnsafe.user.language_code,
          userId: telegramWebApp.initDataUnsafe.user.id,
        },
        {
          headers: {
            query: telegramWebApp.initData,
          },
        }
      )
      .then((res) => res.data);
  },
  configureAuthHeaders(api, telegramWebApp, data) {
    api.defaults.headers.common["Authorization"] = `Bearer ${data?.["token"]}`;
  },
  tasks: {
    ["daily-check-in"]: true,
    ["tasks"]: false,
    ["lottery.claim-all-50-boost"]: true,
    ["lottery"]: false,
  },
});
