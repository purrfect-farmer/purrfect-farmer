import { createLazyElement } from "@/lib/createLazyElement";

import icon from "./assets/images/icon.png?format=webp&w=80&h=80";

export default {
  id: "horse-go",
  title: "HorseGo",
  icon,
  component: createLazyElement(() => import("./HorseGo")),
  telegramLink: "https://t.me/HorseGo_bot/HorseFever?startapp=code_G6ZAC6",
  host: "horsego.vip",
  embedWebPage: true,
  cacheAuth: false,

  /**
   * @param {import("axios").AxiosInstance} api
   */
  fetchAuth(api, telegramWebApp) {
    return api
      .post(
        `https://api.horsego.vip/user_api/login?authString=${encodeURIComponent(
          telegramWebApp.initData
        )}`
      )
      .then((res) => res.data.data);
  },

  /**
   * @param {import("axios").AxiosInstance} api
   */
  configureAuthHeaders(api, telegramWebApp, data) {
    api.defaults.headers.common["Authorization"] = `Bearer ${data?.authToken}`;
  },
  tasks: {
    ["daily-sign-in"]: true,
    ["complete-tasks"]: true,
    ["game"]: false,
  },
};
