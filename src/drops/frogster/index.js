import { createFarmer } from "@/lib/createFarmer";
import { createLazyElement } from "@/lib/createLazyElement";

import icon from "./assets/images/icon.png?format=webp&w=80&h=80";

export default createFarmer({
  id: "frogster",
  title: "Frogster",
  icon,
  syncToCloud: true,
  component: createLazyElement(() => import("./Frogster")),
  telegramLink: "https://t.me/FrogstersBot?startapp=775f1cc48a46ce",
  host: "frogster.app",
  netRequest: {
    origin: "https://frogster.app",
    domains: ["frogster.app"],
  },

  embedInNewWindow: true,
  cacheAuth: false,
  cacheTelegramWebApp: false,

  /**
   * Fetch Auth
   * @param {import("axios").AxiosInstance} api
   */
  fetchAuth(api, telegramWebApp) {
    return api
      .post("https://frogster.app/api/auth", {
        init_data: telegramWebApp.initData,
        ref_code: telegramWebApp.initDataUnsafe["start_param"] ?? "",
      })
      .then((res) => res.data);
  },

  /**
   * Configure Auth Headers
   * @param {import("axios").AxiosInstance} api
   */
  configureAuthHeaders(api, telegramWebApp, data) {
    api.defaults.headers.common["Authorization"] = `Bearer ${data.token}`;
  },

  tasks: {
    ["claim"]: true,
  },
});
