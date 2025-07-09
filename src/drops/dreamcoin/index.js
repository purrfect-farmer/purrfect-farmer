import { createCloudFarmer } from "@/lib/createCloudFarmer";

import icon from "./assets/images/icon.png?format=webp&w=80&h=80";

export default createCloudFarmer({
  id: "dreamcoin",
  title: "DreamCoin",
  icon,
  telegramLink: "https://t.me/DreamCoinOfficial_bot?start=1147265290",
  host: "dreamcoin.ai",
  netRequest: {
    origin: "https://dreamcoin.ai",
    domains: ["dreamcoin.ai"],
  },

  /**
   * Fetch Auth
   * @param {import("axios").AxiosInstance} api
   */
  fetchAuth(api, telegramWebApp) {
    const { initData, initDataUnsafe } = telegramWebApp;
    return api
      .post("https://api.dreamcoin.ai/Auth/telegram", {
        auth_date: initDataUnsafe["auth_date"],
        raw_init_data: initData,
        hash: initDataUnsafe["hash"],
        id: initDataUnsafe["user"]["id"],
        first_name: initDataUnsafe["user"]?.["first_name"] ?? "",
        last_name: initDataUnsafe["user"]?.["last_name"] ?? "",
        username: initDataUnsafe["user"]?.["username"] ?? "",
        photo_url: initDataUnsafe["user"]?.["photo_url"] ?? "",
      })
      .then((res) => ({ token: res.data.token }));
  },

  /**
   * Configure Auth Headers
   * @param {import("axios").AxiosInstance} api
   */
  configureAuthHeaders(api, telegramWebApp, data) {
    api.defaults.headers.common["Authorization"] = `Bearer ${data.token}`;
  },

  /** Get Referral Link */
  getReferralLink(api, telegramWebApp, context) {
    return `https://t.me/DreamCoinOfficial_bot?start=${telegramWebApp.initDataUnsafe.user.id}`;
  },
});
