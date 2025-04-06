import { createFarmer } from "@/lib/createFarmer";
import { createLazyElement } from "@/lib/createLazyElement";

import icon from "./assets/images/icon.png?format=webp&w=80&h=80";

export default createFarmer({
  id: "midas",
  title: "Midas",
  icon,
  component: createLazyElement(() => import("./Midas")),
  telegramLink:
    "https://t.me/MidasRWA_bot/app?startapp=ref_746a3d4f-5108-4931-af18-5589b9a07af9",
  host: "prod-tg-app.midas.app",
  apiDelay: 3000,
  apiOptions: {
    withCredentials: true,
  },
  embedWebPage: true,

  /**
   * Fetch Auth
   * @param {import("axios").AxiosInstance} api
   */
  fetchAuth(api, telegramWebApp) {
    return api
      .post("https://api-tg-app.midas.app/api/auth/register", {
        initData: telegramWebApp.initData,
        source: "ref_746a3d4f-5108-4931-af18-5589b9a07af9",
      })
      .then((res) => ({ token: res.data }));
  },

  /**
   * Configure Auth Headers
   * @param {import("axios").AxiosInstance} api
   */
  configureAuthHeaders(api, telegramWebApp, data) {
    api.defaults.headers.common["Authorization"] = `Bearer ${data.token}`;
  },

  tasks: {
    ["visit"]: true,
    ["daily-check-in"]: true,
    ["claim-referral-rewards"]: true,
    ["tasks"]: false,
    ["game"]: false,
  },
});
