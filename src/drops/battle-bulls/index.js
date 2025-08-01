import { createCloudFarmer } from "@/lib/createCloudFarmer";

import icon from "./assets/images/icon.png?format=webp&w=80&h=80";

export default createCloudFarmer({
  id: "battle-bulls",
  title: "Battle Bulls",
  icon,
  telegramLink:
    "https://t.me/battle_games_com_bot/start?startapp=frndId1147265290",
  host: "tg.battle-games.com",
  netRequest: {
    origin: "https://tg.battle-games.com",
    domains: ["battle-games.com"],
  },

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

  /** Get Referral Link */
  getReferralLink(api, telegramWebApp, context) {
    return `https://t.me/battle_games_com_bot/start?startapp=frndId${telegramWebApp.initDataUnsafe.user.id}`;
  },
});
