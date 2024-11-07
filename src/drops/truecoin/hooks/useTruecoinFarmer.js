import useDropFarmer from "@/hooks/useDropFarmer";
import { useMemo } from "react";

import TruecoinIcon from "../assets/images/icon.png?format=webp&w=80";

export default function useTruecoinFarmer() {
  return useDropFarmer(
    useMemo(
      () => ({
        id: "truecoin",
        host: "bot.true.world",
        notification: {
          icon: TruecoinIcon,
          title: "Truecoin Farmer",
        },
        domains: [],
        /**
         * @param {import("axios").AxiosInstance} api
         */
        fetchAuth(api, telegramWebApp) {
          return api
            .post(
              "https://api.true.world/api/auth/signIn",
              {
                tgWebAppStartParam: null,
                tgPlatform: telegramWebApp.platform,
                tgVersion: telegramWebApp.version,
                lang: telegramWebApp.initDataUnsafe.user.language_code,
                userId: telegramWebApp.initDataUnsafe.user.id,
              },
              {
                headers: {
                  query: telegramWebApp.initData,
                },
              }
            )
            .then((res) => res.data);
        },
        configureAuthHeaders(api, telegramWebApp, data) {
          api.defaults.headers.common[
            "Authorization"
          ] = `Bearer ${data?.["token"]}`;
        },
        autoTasks: ["lottery"],
      }),
      []
    )
  );
}
