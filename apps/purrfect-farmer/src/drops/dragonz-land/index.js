import { createCloudFarmer } from "@/lib/createCloudFarmer";

import icon from "./assets/images/icon.png?format=webp&w=80&h=80";

export default createCloudFarmer({
  id: "dragonz-land",
  title: "Dragonz Land",
  icon,
  telegramLink:
    "https://t.me/dragonz_land_bot/app?startapp=ref-6850578f6a48d249772e2f35",
  host: "app.dragonz.land",
  netRequest: {
    origin: "https://app.dragonz.land",
    domains: ["app.dragonz.land"],
  },

  /**
   * Fetch Auth
   * @param {import("axios").AxiosInstance} api
   */
  fetchAuth(api, telegramWebApp) {
    return api
      .post("https://app.dragonz.land/api/auth/telegram", {
        initData: telegramWebApp.initData,
      })
      .then((res) => res.data);
  },

  /**
   * Configure Auth Headers
   * @param {import("axios").AxiosInstance} api
   */
  configureAuthHeaders(api, telegramWebApp, data) {
    api.defaults.headers.common["Authorization"] = `Bearer ${data.accessToken}`;
  },

  /** Get Referral Link */
  getReferralLink(api, telegramWebApp, context) {
    return api
      .get("https://app.dragonz.land/api/me")
      .then(
        (res) =>
          `https://t.me/dragonz_land_bot/app?startapp=ref-${res.data.referralCode}`
      );
  },
});
