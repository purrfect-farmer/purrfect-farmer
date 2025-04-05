import { createLazyElement } from "@/lib/createLazyElement";

import icon from "./assets/images/icon.png?format=webp&w=80&h=80";
import { getTsubasaHeaders } from "./lib/utils";

export default {
  id: "tsubasa",
  title: "Tsubasa",
  icon,
  syncToCloud: true,
  component: createLazyElement(() => import("./Tsubasa")),
  telegramLink:
    "https://t.me/TsubasaRivalsBot/start?startapp=inviter_id-1147265290",
  host: "web.app.ton.tsubasa-rivals.com",
  embedWebPage: true,
  cacheAuth: false,

  /**
   * @param {import("axios").AxiosInstance} api
   */
  fetchAuth(api, telegramWebApp) {
    return api
      .post(
        "https://api.app.ton.tsubasa-rivals.com/api/start",
        {
          ["initData"]: telegramWebApp.initData,
          ["lang_code"]: telegramWebApp.initDataUnsafe.user["language_code"],
        },
        {
          headers: getTsubasaHeaders(telegramWebApp.initDataUnsafe.user.id),
        }
      )
      .then((res) => res.data);
  },
  tasks: {
    ["daily-reward"]: true,
    ["tasks"]: false,
    ["cards"]: false,
  },
};
