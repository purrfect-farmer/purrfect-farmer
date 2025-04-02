import { createLazyElement } from "@/lib/createLazyElement";

import icon from "./assets/images/icon.png?format=webp&w=80&h=80";

export default {
  id: "slotcoin",
  title: "Slotcoin",
  icon,
  syncToCloud: true,
  component: createLazyElement(() => import("./Slotcoin")),
  telegramLink:
    "https://t.me/SlotCoinApp_bot/app?startapp=eyJyZWZfY29kZSI6ImEyZGQtNjBmNyIsInV0bV9pZCI6InJlZmZlcmFsX2xpbmtfc2hhcmUifQ==",
  host: "app.slotcoin.app",
  domains: ["*.slotcoin.app"],

  /**
   * Fetch Auth
   * @param {import("axios").AxiosInstance} api
   */
  fetchAuth(api, telegramWebApp) {
    return api
      .post("https://api.slotcoin.app/v1/clicker/auth", {
        initData: telegramWebApp.initData,
        referralCode: "a2dd-60f7",
      })
      .then((res) => res.data);
  },

  /**
   * Configure Auth Headers
   * @param {import("axios").AxiosInstance} api
   */
  configureAuthHeaders(api, telegramWebApp, data) {
    api.defaults.headers.common["Authorization"] = data.accessToken;
  },

  tasks: {
    ["daily-check-in"]: true,
    ["quests"]: false,
    ["tickets"]: false,
    ["lottery"]: false,
  },
};
