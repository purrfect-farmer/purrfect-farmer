import { createFarmer } from "@/lib/createFarmer";
import { createLazyElement } from "@/lib/createLazyElement";

import icon from "./assets/images/icon.png?format=webp&w=80&h=80";

export default createFarmer({
  id: "dreamcoin",
  title: "DreamCoin",
  icon,
  syncToCloud: true,
  component: createLazyElement(() => import("./DreamCoin")),
  telegramLink: "https://t.me/DreamCoinOfficial_bot?start=1147265290",
  host: "dreamcoin.ai",
  netRequest: {
    origin: "https://dreamcoin.ai",
    domains: ["dreamcoin.ai"],
  },
  authHeaders: ["authorization", "baggage", "sentry-trace"],
  embedWebPage: true,

  /**
   * Fetch Auth
   * @param {import("axios").AxiosInstance} api
   */
  fetchAuth(api, telegramWebApp) {
    const { initData, initDataUnsafe } = telegramWebApp;
    return api
      .post("https://api.dreamcoin.ai/Auth/telegram", {
        auth_date: initDataUnsafe["auth_date"],
        raw_init_data: initData,
        hash: initDataUnsafe["hash"],
        id: initDataUnsafe["user"]["id"],
        first_name: initDataUnsafe["user"]?.["first_name"] ?? "",
        last_name: initDataUnsafe["user"]?.["last_name"] ?? "",
        username: initDataUnsafe["user"]?.["username"] ?? "",
        photo_url: initDataUnsafe["user"]?.["photo_url"] ?? "",
      })
      .then((res) => ({ token: res.data.token }));
  },

  /**
   * Configure Auth Headers
   * @param {import("axios").AxiosInstance} api
   */
  configureAuthHeaders(api, telegramWebApp, data) {
    api.defaults.headers.common["Authorization"] = `Bearer ${data.token}`;
  },

  tasks: {
    ["daily-reward"]: true,
    ["open-free-case"]: true,
    ["collect-clicker-reward"]: true,
    ["rewards"]: true,
    ["lottery"]: false,
    ["upgrade-all-level"]: false,
  },
});
