import { createCloudFarmer } from "@/lib/createCloudFarmer";

import icon from "./assets/images/icon.png?format=webp&w=80&h=80";

export default createCloudFarmer({
  id: "funatic",
  title: "Funatic",
  icon,
  telegramLink:
    "https://t.me/LuckyFunaticBot/lucky_funatic?startapp=1147265290",
  host: "clicker.funtico.com",
  netRequest: {
    origin: "https://clicker.funtico.com",
    domains: ["clicker.api.funtico.com", "*.funtico.com"],
  },

  cacheAuth: true,

  /**
   * Fetch Auth
   * @param {import("axios").AxiosInstance} api
   */
  fetchAuth(api, telegramWebApp) {
    return api
      .post(
        `https://api2.funtico.com/api/lucky-funatic/login?${telegramWebApp.initData}`
      )
      .then((res) => res.data.data);
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
    return `https://t.me/LuckyFunaticBot/lucky_funatic?startapp=${telegramWebApp.initDataUnsafe.user.id}`;
  },
});
