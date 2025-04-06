import { createFarmer } from "@/lib/createFarmer";
import { createLazyElement } from "@/lib/createLazyElement";

import icon from "./assets/images/icon.png?format=webp&w=80&h=80";

export default createFarmer({
  id: "yescoin",
  title: "Yescoin",
  icon,
  component: createLazyElement(() => import("./Yescoin")),
  telegramLink: "https://t.me/theYescoin_bot/Yescoin?startapp=bH7bto",
  host: "www.yescoin.fun",
  embedWebPage: true,
  authHeaders: ["token"],

  /**
   * Fetch Auth
   * @param {import("axios").AxiosInstance} api
   */
  fetchAuth(api, telegramWebApp) {
    return api
      .post("https://api-backend.yescoin.fun/user/loginNew", {
        code: decodeURIComponent(telegramWebApp.initData),
      })
      .then((res) => ({ token: res.data.data.token }));
  },

  /**
   * Configure Auth Headers
   * @param {import("axios").AxiosInstance} api
   */
  configureAuthHeaders(api, telegramWebApp, data) {
    api.defaults.headers.common["token"] = data.token;
  },

  tasks: {
    ["daily-check-in"]: true,
    ["claim-special-box"]: true,
    ["tasks"]: false,
    ["missions"]: true,
    ["claim-task-bonus"]: true,
  },
});
