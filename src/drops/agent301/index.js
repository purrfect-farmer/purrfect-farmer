import { createLazyElement } from "@/lib/createLazyElement";

import icon from "./assets/images/icon.png?format=webp&w=80&h=80";

export default {
  id: "agent301",
  title: "Agent 301",
  icon,
  component: createLazyElement(() => import("./Agent301")),
  telegramLink: "https://t.me/Agent301Bot/app?startapp=onetime1147265290",
  host: "static.agent301.org",
  alwaysFetchAuth: true,

  /**
   * Fetch Auth
   * @param {import("axios").AxiosInstance} api
   */
  fetchAuth(api, telegramWebApp) {
    return { auth: telegramWebApp.initData };
  },

  /**
   * Configure Auth Headers
   * @param {import("axios").AxiosInstance} api
   */
  configureAuthHeaders(api, telegramWebApp, data) {
    api.defaults.headers.common["Authorization"] = data.auth;
  },

  tasks: {
    ["tasks"]: false,
    ["puzzle"]: false,
    ["wheel"]: false,
    ["tickets"]: false,
  },
};
