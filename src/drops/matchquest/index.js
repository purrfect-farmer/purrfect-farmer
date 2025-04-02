import { createLazyElement } from "@/lib/createLazyElement";

import icon from "./assets/images/icon.png?format=webp&w=80&h=80";

export default {
  id: "matchquest",
  title: "MatchQuest",
  icon,
  syncToCloud: true,
  component: createLazyElement(() => import("./MatchQuest")),
  telegramLink:
    "https://t.me/MatchQuestBot/start?startapp=775f1cc48a46ce5221f1d9476233dc33",
  host: "tgapp.matchain.io",
  domains: ["tgapp-api.matchain.io"],

  /**
   * Fetch Auth
   * @param {import("axios").AxiosInstance} api
   */
  fetchAuth(api, telegramWebApp) {
    const { initData, initDataUnsafe } = telegramWebApp;
    return api
      .post("https://tgapp-api.matchain.io/api/tgapp/v1/user/login", {
        ["tg_login_params"]: initData,
        ["uid"]: initDataUnsafe["user"]?.["id"] ?? "",
        ["first_name"]: initDataUnsafe["user"]?.["first_name"] ?? "",
        ["last_name"]: initDataUnsafe["user"]?.["last_name"] ?? "",
        ["user_name"]: initDataUnsafe["user"]?.["username"] ?? "",
      })
      .then((res) => res.data.data);
  },

  /**
   * Configure Auth Headers
   * @param {import("axios").AxiosInstance} api
   */
  configureAuthHeaders(api, telegramWebApp, data) {
    api.defaults.headers.common["Authorization"] = data.token;
  },

  tasks: {
    ["farming"]: true,
    ["tasks"]: true,
    ["daily-task-purchase"]: true,
    ["game"]: true,
  },
};
