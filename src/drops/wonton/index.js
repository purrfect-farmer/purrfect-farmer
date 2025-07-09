import { createCloudFarmer } from "@/lib/createCloudFarmer";

import icon from "./assets/images/icon.png?format=webp&w=80&h=80";

export default createCloudFarmer({
  id: "wonton",
  title: "Wonton",
  icon,
  telegramLink:
    "https://t.me/WontonOrgBot/gameapp?startapp=referralCode=K45JQRG7",
  host: "www.wonton.restaurant",
  netRequest: {
    origin: "https://www.wonton.restaurant",
    domains: ["wonton.food", "wonton.restaurant"],
  },
  apiDelay: 3000,

  /**
   * Fetch Auth
   * @param {import("axios").AxiosInstance} api
   */
  fetchAuth(api, telegramWebApp) {
    return api
      .post("https://wonton.food/api/v1/user/auth", {
        initData: telegramWebApp.initData,
        inviteCode: telegramWebApp.initDataUnsafe["start_param"].replace(
          /^referralCode=/,
          ""
        ),
        newUserPromoteCode: "",
      })
      .then((res) => res.data.tokens);
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
    return api.get("https://wonton.food/api/v1/user").then((res) => {
      return `https://t.me/WontonOrgBot/gameapp?startapp=referralCode=${res.data["inviteCode"]}`;
    });
  },
});
