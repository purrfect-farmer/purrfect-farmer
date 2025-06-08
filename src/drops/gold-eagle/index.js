import { createFarmer } from "@/lib/createFarmer";
import { createLazyElement } from "@/lib/createLazyElement";

import icon from "./assets/images/icon.png?format=webp&w=80&h=80";

export default createFarmer({
  id: "gold-eagle",
  title: "Gold Eagle",
  icon,
  syncToCloud: true,
  component: createLazyElement(() => import("./GoldEagle")),
  telegramLink: "https://t.me/gold_eagle_coin_bot/main?startapp=r_ubdOBYN6KX",
  host: "telegram.geagle.online",
  netRequest: {
    origin: "https://telegram.geagle.online",
    domains: ["telegram.geagle.online", "gold-eagle-api.fly.dev"],
  },
  embedWebPage: true,

  /**
   * Fetch Auth
   * @param {import("axios").AxiosInstance} api
   */
  fetchAuth(api, telegramWebApp) {
    const params = new URLSearchParams({
      tgWebAppData: telegramWebApp.initData,
      tgWebAppPlatform: telegramWebApp.platform,
      tgWebAppVersion: telegramWebApp.version,
    });

    return api
      .post("https://gold-eagle-api.fly.dev/login/telegram", {
        ["init_data_raw"]: `https://telegram.geagle.online/?tgWebAppStartParam=r_ubdOBYN6KX#${params.toString()}`,
      })
      .then((res) => res.data);
  },

  /**
   * Configure Auth Headers
   * @param {import("axios").AxiosInstance} api
   */
  configureAuthHeaders(api, telegramWebApp, data) {
    api.defaults.headers.common[
      "Authorization"
    ] = `Bearer ${data["access_token"]}`;
  },

  tasks: {
    ["refill"]: true,
  },
});
