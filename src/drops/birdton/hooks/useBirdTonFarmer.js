import useDropFarmer from "@/hooks/useDropFarmer";
import { useMemo } from "react";

import BirdTonIcon from "../assets/images/icon.png?format=webp&w=80";

export default function useBirdTonFarmer() {
  return useDropFarmer(
    useMemo(
      () => ({
        id: "birdton",
        host: "birdton.site",
        notification: {
          icon: BirdTonIcon,
          title: "BirdTon Farmer",
        },
        domains: [],
        /**
         * @param {import("axios").AxiosInstance} api
         */
        fetchAuth(api, telegramWebApp) {
          return api
            .post("https://birdton.site/auth", telegramWebApp)
            .then((res) => res.data);
        },
      }),
      []
    )
  );
}
