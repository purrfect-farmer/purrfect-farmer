import { createFarmer } from "@/lib/createFarmer";
import { createLazyElement } from "@/lib/createLazyElement";

import icon from "./assets/images/icon.png?format=webp&w=80&h=80";

export default createFarmer({
  id: "meta-lott",
  title: "Meta Lott",
  icon,
  syncToCloud: true,
  component: createLazyElement(() => import("./MetaLott")),
  telegramLink: "https://t.me/meta_lott_bot?start=51835690",
  host: "www.metalott.com",
  netRequest: {
    origin: "https://www.metalott.com",
    domains: ["www.metalott.com"],
  },
  embedWebPage: true,
  cacheAuth: false,

  apiOptions: {
    headers: {
      common: {
        Encryption: 0,
      },
    },
  },

  /**
   * Fetch Auth
   * @param {import("axios").AxiosInstance} api
   */
  fetchAuth(api, telegramWebApp) {
    const user = telegramWebApp.initDataUnsafe.user;

    return api
      .post(
        "https://www.metalott.com/core/app/auth/login",
        new URLSearchParams({
          tgUserId: user.id,
          username: user.username || "",
        })
      )
      .then((res) => res.data.result);
  },

  /**
   * Configure Auth Headers
   * @param {import("axios").AxiosInstance} api
   */
  configureAuthHeaders(api, telegramWebApp, data) {
    api.defaults.headers.common["Authorization"] = data;
    api.defaults.headers.common["X-Access-Token"] = data;
  },

  tasks: {
    ["sign-in"]: true,
  },
});
