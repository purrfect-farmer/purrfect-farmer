import md5 from "md5";
import { createCloudFarmer } from "@/lib/createCloudFarmer";

import icon from "./assets/images/icon.png?format=webp&w=80&h=80";

export function getHrumHeaders(data, key) {
  const apiTime = Math.floor(Date.now() / 1000);
  const apiHash = md5(
    encodeURIComponent(`${apiTime}_${JSON.stringify(data || "")}`)
  );

  return {
    "Api-Key": key || "empty",
    "Api-Time": apiTime,
    "Api-Hash": apiHash,
    "Is-Beta-Server": null,
  };
}

export default createCloudFarmer({
  id: "hrum",
  title: "Hrum",
  icon,
  telegramLink: "https://t.me/hrummebot/game?startapp=ref1147265290",
  host: "game.hrum.me",
  netRequest: {
    origin: "https://game.hrum.me",
    domains: ["hrum.me"],
  },

  /**
   * Configure API
   * @param {import("axios").AxiosInstance} api
   */
  configureApi(api, telegramWebApp) {
    const interceptor = api.interceptors.request.use((config) => {
      config.data = { data: config.data };
      config.headers = {
        ...config.headers,
        ...getHrumHeaders(config.data, telegramWebApp.initDataUnsafe.hash),
      };

      return config;
    });

    return () => api.interceptors.request.eject(interceptor);
  },

  /**
   * Fetch Auth
   * @param {import("axios").AxiosInstance} api
   */
  fetchAuth(api, telegramWebApp) {
    const { platform, initData, initDataUnsafe } = telegramWebApp;

    return api
      .post("https://api.hrum.me/telegram/auth", {
        platform,
        initData,
        startParam: initDataUnsafe["start_param"] ?? "",
        photoUrl: initDataUnsafe["user"]?.["photo_url"] ?? "",
        chatId: initDataUnsafe["chat"]?.["id"] ?? "",
        chatType: initDataUnsafe["chat_type"] ?? "",
        chatInstance: initDataUnsafe["chat_instance"] ?? "",
      })
      .then((res) => res.data.data);
  },

  /** Get Referral Link */
  getReferralLink(api, telegramWebApp, context) {
    return `https://t.me/hrummebot/game?startapp=ref${telegramWebApp.initDataUnsafe.user.id}`;
  },
});
