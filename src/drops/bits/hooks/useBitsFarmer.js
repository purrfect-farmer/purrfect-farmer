import useDropFarmer from "@/hooks/useDropFarmer";
import { useMemo } from "react";

import BitsIcon from "../assets/images/icon.png?format=webp&w=80";

export default function useBitsFarmer() {
  return useDropFarmer(
    useMemo(
      () => ({
        id: "bits",
        host: "bits.apps-tonbox.me",
        notification: {
          icon: BitsIcon,
          title: "Bits Farmer",
        },
        domains: [],
        /**
         * @param {import("axios").AxiosInstance} api
         */
        fetchAuth(api, telegramWebApp) {
          return api
            .post("https://api-bits.apps-tonbox.me/api/v1/auth", {
              data: telegramWebApp.initData,
              device: "Android",
            })
            .then((res) => res.data);
        },
        autoTasks: ["tasks"],
      }),
      []
    )
  );
}
