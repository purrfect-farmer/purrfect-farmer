import useDropFarmer from "@/hooks/useDropFarmer";
import { useMemo } from "react";

import TsubasaIcon from "../assets/images/icon.png?format=webp&w=80";
import { getTsubasaHeaders } from "../lib/utils";

export default function useTsubasaFarmer() {
  return useDropFarmer(
    useMemo(
      () => ({
        id: "tsubasa",
        host: "web.app.ton.tsubasa-rivals.com",
        notification: {
          icon: TsubasaIcon,
          title: "Tsubasa Farmer",
        },
        domains: [],
        /**
         * @param {import("axios").AxiosInstance} api
         */
        fetchAuth(api, telegramWebApp) {
          return api
            .post(
              "https://api.app.ton.tsubasa-rivals.com/api/start",
              {
                ["initData"]: telegramWebApp.initData,
                ["lang_code"]:
                  telegramWebApp.initDataUnsafe.user["language_code"],
              },
              {
                headers: getTsubasaHeaders(
                  telegramWebApp.initDataUnsafe.user.id
                ),
              }
            )
            .then((res) => res.data);
        },
      }),
      []
    )
  );
}
