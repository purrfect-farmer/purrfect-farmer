import { createLazyElement } from "@/lib/createLazyElement";

import icon from "./assets/images/icon.png?format=webp&w=80&h=80";

export default {
  id: "digger",
  title: "Digger",
  icon,
  syncToCloud: true,
  component: createLazyElement(() => import("./Digger")),
  telegramLink: "https://t.me/diggerton_bot/dig?startapp=bro1147265290",
  host: "diggergame.app",
  domains: ["*.diggergame.app"],

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

  tasks: {
    ["dig"]: true,
    ["tasks"]: false,
    ["chests"]: false,
    ["game"]: false,
    ["cards"]: false,
  },
};
