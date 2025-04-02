import { createLazyElement } from "@/lib/createLazyElement";
import { customLogger } from "@/lib/utils";

import icon from "./assets/images/icon.png?format=webp&w=80&h=80";
import { getGoldEagleGame } from "./lib/utils";

export default {
  id: "gold-eagle",
  title: "Gold Eagle",
  icon,
  syncToCloud: true,
  component: createLazyElement(() => import("./GoldEagle")),
  telegramLink: "https://t.me/gold_eagle_coin_bot/main?startapp=r_ubdOBYN6KX",
  host: "telegram.geagle.online",
  domains: ["gold-eagle-api.fly.dev"],

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

  /** Fetch Meta */
  async fetchMeta() {
    const game = await getGoldEagleGame();

    /** Log it */
    customLogger("GOLD-EAGLE", game);

    /** Throw Error */
    if (!game) {
      throw new Error("Unable to setup Gold Eagle");
    }

    return game;
  },
  tasks: {
    ["game"]: true,
  },
};
