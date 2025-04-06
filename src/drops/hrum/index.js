import { createFarmer } from "@/lib/createFarmer";
import { createLazyElement } from "@/lib/createLazyElement";

import icon from "./assets/images/icon.png?format=webp&w=80&h=80";
import { getHrumHeaders } from "./lib/utils";

export default createFarmer({
  id: "hrum",
  title: "Hrum",
  icon,
  syncToCloud: true,
  component: createLazyElement(() => import("./Hrum")),
  telegramLink: "https://t.me/hrummebot/game?startapp=ref1147265290",
  host: "game.hrum.me",
  embedWebPage: true,
  cacheAuth: false,

  /**
   * Fetch Auth
   * @param {import("axios").AxiosInstance} api
   */
  fetchAuth(api, telegramWebApp) {
    const { platform, initData, initDataUnsafe } = telegramWebApp;
    const body = {
      data: {
        platform,
        initData,
        startParam: initDataUnsafe["start_param"] ?? "",
        photoUrl: initDataUnsafe["user"]?.["photo_url"] ?? "",
        chatId: initDataUnsafe["chat"]?.["id"] ?? "",
        chatType: initDataUnsafe["chat_type"] ?? "",
        chatInstance: initDataUnsafe["chat_instance"] ?? "",
      },
    };
    return api
      .post("https://api.hrum.me/telegram/auth", body, {
        headers: getHrumHeaders(body),
      })
      .then((res) => res.data.data);
  },

  tasks: {
    ["daily.check-in"]: true,
    ["tasks"]: true,
    ["daily.riddle"]: true,
    ["daily.cookie"]: true,
  },
});
