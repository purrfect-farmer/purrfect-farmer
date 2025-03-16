import useDropFarmer from "@/hooks/useDropFarmer";
import { useMemo } from "react";

import HorseGoIcon from "../assets/images/icon.png?format=webp&w=80";

export default function useHorseGoFarmer() {
  return useDropFarmer(
    useMemo(
      () => ({
        id: "horse-go",
        host: "horsego.vip",
        icon: HorseGoIcon,
        title: "HorseGo Farmer",

        /**
         * @param {import("axios").AxiosInstance} api
         */
        fetchAuth(api, telegramWebApp) {
          return api
            .post(
              `https://api.horsego.vip/user_api/login?authString=${encodeURIComponent(
                telegramWebApp.initData
              )}`
            )
            .then((res) => res.data.data);
        },

        /**
         * @param {import("axios").AxiosInstance} api
         */
        configureAuthHeaders(api, telegramWebApp, data) {
          api.defaults.headers.common[
            "Authorization"
          ] = `Bearer ${data?.authToken}`;
        },
      }),
      []
    )
  );
}
