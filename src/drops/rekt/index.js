import { createLazyElement } from "@/lib/createLazyElement";

import icon from "./assets/images/icon.png?format=webp&w=80&h=80";

export const DOCUMENT_TYPES = ["TERMS_OF_CONDITIONS", "PRIVACY_POLICY"];

export default {
  id: "rekt",
  title: "Rekt.me",
  icon,
  component: createLazyElement(() => import("./Rekt")),
  telegramLink: "https://t.me/rektme_bot/rektapp?startapp=UJ740H",
  host: "rekt-mini-app.vercel.app",
  authHeaders: ["auth-token"],
  domains: ["rekt-mini-app.vercel.app"],

  /**
   * Fetch Auth
   * @param {import("axios").AxiosInstance} api
   */
  fetchAuth(api, telegramWebApp) {
    return { auth: telegramWebApp.initData };
  },

  /**
   * Configure Auth Headers
   * @param {import("axios").AxiosInstance} api
   */
  configureAuthHeaders(api, telegramWebApp, data) {
    api.defaults.headers.common["auth-token"] = data.auth;
  },

  /**
   * Fetch Meta
   * @param {import("axios").AxiosInstance} api
   */
  fetchMeta(api) {
    return Promise.all(
      DOCUMENT_TYPES.map((type) =>
        api
          .post(
            `https://rekt-mini-app.vercel.app/api/user/accept?documentType=${type}`,
            null
          )
          .then((res) => res.data)
      )
    );
  },

  tasks: {
    ["daily-check-in"]: true,
    ["farming"]: true,
    ["boost-farming"]: true,
    ["claim-referrals"]: true,
    ["quests"]: false,
    ["game"]: false,
  },
};
