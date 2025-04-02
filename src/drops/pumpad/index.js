import md5 from "md5";
import { createLazyElement } from "@/lib/createLazyElement";

import icon from "./assets/images/icon.png?format=webp&w=80&h=80";

export default {
  id: "pumpad",
  title: "Pumpad",
  icon,
  component: createLazyElement(() => import("./Pumpad")),
  telegramLink: "https://t.me/Pumpad_Bot/Lucky?startapp=52458255372295027",
  host: "tg-home.pumpad.io",
  domains: ["tg.pumpad.io"],

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
    api.defaults.headers.common["Authorization"] = `tma ${data.auth}`;
  },

  /**
   * Fetch Meta
   * @param {import("axios").AxiosInstance} api
   */
  fetchMeta(api, telegramWebApp) {
    return api
      .post("https://tg.pumpad.io/referral/api/v1/tg/invitation", {
        ["code"]: "52458255372295027",
        ["device_id"]: md5(telegramWebApp.initDataUnsafe["user"]["id"]),
        ["platform"]: telegramWebApp.platform,
      })
      .then((res) => res.data)
      .catch(() => null);
  },

  tasks: {
    ["daily-check-in"]: true,
    ["points"]: false,
    ["missions"]: false,
    ["tickets"]: false,
    ["lottery"]: false,
  },
};
