import { createFarmer } from "@/lib/createFarmer";
import { createLazyElement } from "@/lib/createLazyElement";

import icon from "./assets/images/icon.png?format=webp&w=80&h=80";

export default createFarmer({
  id: "blum",
  title: "Blum",
  icon,
  component: createLazyElement(() => import("./Blum")),
  telegramLink: "https://t.me/BlumCryptoBot/app?startapp=ref_3AIqvLlFFK",
  host: "telegram.blum.codes",
  netRequest: {
    origin: "https://telegram.blum.codes",
    domains: ["blum.codes"],
  },
  embedWebPage: true,

  /**
   * Fetch Auth
   * @param {import("axios").AxiosInstance} api
   */
  fetchAuth(api, telegramWebApp) {
    return api
      .post("https://auth-domain.blum.codes/api/v1/auth", {
        provider: "TELEGRAM",
        strategy: "TELEGRAM",
        payload: {
          initData: telegramWebApp.initData,
        },
        referralToken: telegramWebApp.initDataUnsafe["start_param"].replace(
          /^ref_/,
          ""
        ),
      })
      .then((res) => res.data.token);
  },

  /**
   * Configure Auth Headers
   * @param {import("axios").AxiosInstance} api
   */
  configureAuthHeaders(api, telegramWebApp, data) {
    api.defaults.headers.common["Authorization"] = `Bearer ${data.access}`;
  },

  tasks: {
    ["daily-check-in"]: true,
    ["friends-reward"]: true,
    ["farming"]: true,
    ["tasks"]: false,
    ["game"]: false,
  },
});
