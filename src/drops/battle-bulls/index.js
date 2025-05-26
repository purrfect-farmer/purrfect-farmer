import { createFarmer } from "@/lib/createFarmer";
import { createLazyElement } from "@/lib/createLazyElement";

import icon from "./assets/images/icon.png?format=webp&w=80&h=80";

export default createFarmer({
  id: "battle-bulls",
  title: "Battle Bulls",
  icon,
  component: createLazyElement(() => import("./BattleBulls")),
  telegramLink:
    "https://t.me/battle_games_com_bot/start?startapp=frndId1147265290",
  host: "tg.battle-games.com",
  netRequest: {
    origin: "https://tg.battle-games.com",
    domains: ["battle-games.com"],
  },
  embedWebPage: true,
  cacheAuth: false,
  syncToCloud: true,

  /**
   * Fetch Auth
   * @param {import("axios").AxiosInstance} api
   */
  fetchAuth(api, telegramWebApp) {
    return { auth: telegramWebApp.initData };
  },

  /**
   * Configure Auth Headers
   * @param {import("axios").AxiosInstance} api
   */
  configureAuthHeaders(api, telegramWebApp, data) {
    api.defaults.headers.common["Authorization"] = data.auth;
  },

  /**
   * Fetch Meta
   * @param {import("axios").AxiosInstance} api
   */
  fetchMeta(api, telegramWebApp) {
    return api
      .post(
        `https://api.battle-games.com:8443/api/api/v1/user?inviteCode=${telegramWebApp.initDataUnsafe["start_param"]}`
      )
      .then((res) => res.data.data);
  },

  tasks: {
    ["daily-reward"]: true,
    ["choose-blockchain"]: true,
    ["tasks"]: false,
    ["cards"]: false,
  },
});
