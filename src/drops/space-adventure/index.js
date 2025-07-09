import { createCloudFarmer } from "@/lib/createCloudFarmer";

import icon from "./assets/images/icon.png?format=webp&w=80&h=80";
import { getSpaceAdventureHeaders } from "./lib/utils";

export default createCloudFarmer({
  id: "space-adventure",
  title: "Space Adventure",
  icon,
  telegramLink: "https://t.me/spaceadv_game_bot/play?startapp=1147265290",
  host: "space-adventure.online",
  netRequest: {
    origin: "https://space-adventure.online",
    domains: ["space-adventure.online"],
    requestHeaders: [
      {
        header: "origins",
        operation: "set",
        value: "https://space-adventure.online",
      },
    ],
  },

  apiOptions: {
    withCredentials: true,
    withXSRFToken: true,
  },

  embedInNewWindow: true,

  /**
   * Fetch Auth
   * @param {import("axios").AxiosInstance} api
   */
  async fetchAuth(api, telegramWebApp) {
    await api.get("https://space-adventure.online/sanctum/csrf-cookie");

    return api
      .post(
        "https://space-adventure.online/api/auth/telegram",
        new URLSearchParams(telegramWebApp.initData),
        {
          headers: await getSpaceAdventureHeaders({
            authId: telegramWebApp.initDataUnsafe.user.id,
          }),
        }
      )
      .then((res) => res.data);
  },

  /**
   * Configure Auth Headers
   * @param {import("axios").AxiosInstance} api
   */
  configureAuthHeaders(api, telegramWebApp, data) {
    api.defaults.headers.common["Authorization"] = `Bearer ${data.token}`;
  },

  /** Get Referral Link */
  getReferralLink(api, telegramWebApp, context) {
    return `https://t.me/spaceadv_game_bot/play?startapp=${telegramWebApp.initDataUnsafe.user.id}`;
  },
});
