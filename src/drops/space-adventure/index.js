import { createFarmer } from "@/lib/createFarmer";
import { createLazyElement } from "@/lib/createLazyElement";

import icon from "./assets/images/icon.png?format=webp&w=80&h=80";

export default createFarmer({
  id: "space-adventure",
  title: "Space Adventure",
  icon,
  syncToCloud: true,
  component: createLazyElement(() => import("./SpaceAdventure")),
  telegramLink: "https://t.me/spaceadv_game_bot/play?startapp=1147265290",
  host: "space-adventure.online",
  embedWebPage: true,
  cacheAuth: false,
  cacheTelegramWebApp: false,

  /**
   * Fetch Auth
   * @param {import("axios").AxiosInstance} api
   */
  fetchAuth(api, telegramWebApp) {
    return api
      .post(
        "https://space-adventure.online/api/auth/telegram",
        new URLSearchParams(telegramWebApp.initData)
      )
      .then((res) => res.data);
  },

  /**
   * Configure Auth Headers
   * @param {import("axios").AxiosInstance} api
   */
  configureAuthHeaders(api, telegramWebApp, data) {
    api.defaults.headers.common["Authorization"] = `Bearer ${data.token}`;
  },

  tasks: {
    ["skip-tutorial"]: true,
    ["read-news"]: true,
    ["daily-claim"]: true,
    ["claim-mining"]: true,
    ["spin"]: true,
    ["buy-fuel"]: true,
    ["buy-shield"]: true,
    ["buy-immunity"]: true,
    ["hourly-ads"]: true,
    ["tasks"]: true,
  },
});
