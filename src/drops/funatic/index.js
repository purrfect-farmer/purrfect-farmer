import { createLazyElement } from "@/lib/createLazyElement";

import icon from "./assets/images/icon.png?format=webp&w=80&h=80";

export default {
  id: "funatic",
  title: "Funatic",
  icon,
  syncToCloud: true,
  component: createLazyElement(() => import("./Funatic")),
  telegramLink:
    "https://t.me/LuckyFunaticBot/lucky_funatic?startapp=1147265290",
  host: "clicker.funtico.com",

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

  /** Extract Auth Headers */
  extractAuthHeaders(headers) {
    return headers.filter(
      (header) =>
        header.name.toLowerCase() === "authorization" &&
        header.value !== "Bearer undefined"
    );
  },
  apiDelay: 200,
  tasks: {
    ["set-exchange"]: true,
    ["daily-bonus"]: true,
    ["boosters"]: false,
    ["quests"]: false,
    ["game"]: false,
    ["cards"]: false,
  },
};
