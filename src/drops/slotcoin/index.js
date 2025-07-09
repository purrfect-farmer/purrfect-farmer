import { createCloudFarmer } from "@/lib/createCloudFarmer";

import icon from "./assets/images/icon.png?format=webp&w=80&h=80";

export default createCloudFarmer({
  id: "slotcoin",
  title: "Slotcoin",
  icon,
  telegramLink:
    "https://t.me/SlotCoinApp_bot/app?startapp=eyJyZWZfY29kZSI6ImEyZGQtNjBmNyIsInV0bV9pZCI6InJlZmZlcmFsX2xpbmtfc2hhcmUifQ==",
  host: "app.slotcoin.app",
  netRequest: {
    origin: "https://app.slotcoin.app",
    domains: ["slotcoin.app"],
  },

  /**
   * Fetch Auth
   * @param {import("axios").AxiosInstance} api
   */
  fetchAuth(api, telegramWebApp) {
    return api
      .post("https://api.slotcoin.app/v1/clicker/auth", {
        initData: telegramWebApp.initData,
        referralCode: telegramWebApp.initDataUnsafe["start_param"]
          ? JSON.parse(atob(telegramWebApp.initDataUnsafe["start_param"]))[
              "ref_code"
            ]
          : "",
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

  /** Get Referral Link */
  getReferralLink(api, telegramWebApp, context) {
    return api
      .post("https://api.slotcoin.app/v1/clicker/api/info", null)
      .then((res) => {
        return `https://t.me/SlotCoinApp_bot/app?startapp=${btoa(
          JSON.stringify({
            ["ref_code"]: res.data["referral_code"],
            ["utm_id"]: "refferal_link_share",
          })
        )}`;
      });
  },
});
