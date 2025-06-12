import { createFarmer } from "@/lib/createFarmer";
import { createLazyElement } from "@/lib/createLazyElement";

import icon from "./assets/images/icon.png?format=webp&w=80&h=80";

export default createFarmer({
  id: "neubeat",
  title: "Neubeat",
  icon,
  syncToCloud: true,
  component: createLazyElement(() => import("./Neubeat")),
  telegramLink: "https://t.me/NeubeatBot/beat?startapp=invite_1147265290",
  host: "tg.audiera.fi",
  netRequest: {
    origin: "https://tg.audiera.fi",
    domains: ["tg.audiera.fi"],
  },
  embedWebPage: true,

  /**
   * Fetch Auth
   * @param {import("axios").AxiosInstance} api
   */
  fetchAuth(api, telegramWebApp) {
    return api
      .post(
        "https://tg.audiera.fi/api/auth/telegram",
        new URLSearchParams(telegramWebApp.initData)
      )
      .then((res) => res.data);
  },

  /**
   * Configure Auth Headers
   * @param {import("axios").AxiosInstance} api
   */
  configureAuthHeaders(api, telegramWebApp, data) {
    api.defaults.headers.common["Authorization"] = `Bearer ${data.token}`;
  },

  tasks: {},
});
