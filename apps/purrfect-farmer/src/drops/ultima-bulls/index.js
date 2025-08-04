import { createCloudFarmer } from "@/lib/createCloudFarmer";

import icon from "./assets/images/icon.png?format=webp&w=80&h=80";

export default createCloudFarmer({
  id: "ultima-bulls",
  title: "Ultima Bulls",
  icon,
  telegramLink:
    "https://t.me/UltimaBulls_com_bot/start?startapp=frndId1147265290",
  host: "ub.battle-games.com",
  netRequest: {
    origin: "https://ub.battle-games.com",
    domains: [
      "ub.battle-games.com",
      "ub-api.battle-games.com",
      "tg.battle-games.com",
    ],
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
        `https://ub-api.battle-games.com/api/v1/user?inviteCode=${telegramWebApp.initDataUnsafe["start_param"]}`
      )
      .then((res) => res.data.data);
  },

  /** Get Referral Link */
  getReferralLink(api, telegramWebApp, context) {
    return `https://t.me/UltimaBulls_com_bot/start?startapp=frndId${telegramWebApp.initDataUnsafe.user.id}`;
  },
});
