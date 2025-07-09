import { createCloudFarmer } from "@/lib/createCloudFarmer";

import icon from "./assets/images/icon.png?format=webp&w=80&h=80";

export default createCloudFarmer({
  id: "digger",
  title: "Digger",
  icon,
  telegramLink: "https://t.me/diggerton_bot/dig?startapp=bro1147265290",
  host: "diggergame.app",
  netRequest: {
    origin: "https://diggergame.app",
    domains: ["api.diggergame.app"],
  },

  /**
   * Fetch Auth
   * @param {import("axios").AxiosInstance} api
   */
  fetchAuth(api, telegramWebApp) {
    return api
      .post("https://api.diggergame.app/api/auth", {
        ["init_data"]: telegramWebApp.initData,
        ["platform"]: telegramWebApp.platform,
      })
      .then((res) => res.data.result.auth);
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
    return `https://t.me/diggerton_bot/dig?startapp=bro${telegramWebApp.initDataUnsafe.user.id}`;
  },
});
