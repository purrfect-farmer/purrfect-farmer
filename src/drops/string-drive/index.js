import { createCloudFarmer } from "@/lib/createCloudFarmer";

import icon from "./assets/images/icon.png?format=webp&w=80&h=80";

export default createCloudFarmer({
  id: "string-drive",
  title: "String Drive",
  icon,
  telegramLink: "https://t.me/stringdrive_bot/startapp?startapp=1147265290",
  host: "st-fr-drive.stringdrive.io",
  netRequest: {
    origin: "https://st-fr-drive.stringdrive.io",
    domains: ["st-ba-drive.stringdrive.io", "st-fr-drive.stringdrive.io"],
  },

  /**
   * Fetch Auth
   * @param {import("axios").AxiosInstance} api
   */
  fetchAuth(api, telegramWebApp) {
    const initDataUnsafe = telegramWebApp.initDataUnsafe;

    return api
      .post("https://st-ba-drive.stringdrive.io/api/auth/userlogin", {
        chatId: initDataUnsafe?.["user"]?.["id"],
        username: initDataUnsafe?.["user"]?.["first_name"] ?? "",
        profilepic: initDataUnsafe?.["user"]?.["photo_url"] ?? "",
        referalId: initDataUnsafe?.["start_param"] ?? "",
      })
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
    return `https://t.me/stringdrive_bot/startapp?startapp=${telegramWebApp.initDataUnsafe.user.id}`;
  },
});
