import { createFarmer } from "@/lib/createFarmer";
import { createLazyElement } from "@/lib/createLazyElement";

import icon from "./assets/images/icon.png?format=webp&w=80&h=80";

export default createFarmer({
  id: "wonton",
  title: "Wonton",
  icon,
  syncToCloud: true,
  component: createLazyElement(() => import("./Wonton")),
  telegramLink:
    "https://t.me/WontonOrgBot/gameapp?startapp=referralCode=K45JQRG7",
  host: "www.wonton.restaurant",
  netRequest: {
    origin: "https://www.wonton.restaurant",
    domains: ["wonton.food", "wonton.restaurant"],
  },
  apiDelay: 3000,
  embedWebPage: true,

  /**
   * Fetch Auth
   * @param {import("axios").AxiosInstance} api
   */
  fetchAuth(api, telegramWebApp) {
    return api
      .post("https://wonton.food/api/v1/user/auth", {
        initData: telegramWebApp.initData,
        inviteCode: "K45JQRG7",
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

  tasks: {
    ["daily-check-in"]: true,
    ["farming"]: true,
    ["use-top-shop-item"]: false,
    ["tasks"]: false,
    ["badges"]: false,
    ["game"]: false,
    ["draw-basic-box"]: true,
  },
});
