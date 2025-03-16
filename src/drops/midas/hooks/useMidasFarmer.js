import useDropFarmer from "@/hooks/useDropFarmer";
import { useMemo } from "react";

import MidasIcon from "../assets/images/icon.png?format=webp&w=80";

export default function useMidasFarmer() {
  return useDropFarmer(
    useMemo(
      () => ({
        id: "midas",
        host: "prod-tg-app.midas.app",
        domains: ["api-tg-app.midas.app"],
        icon: MidasIcon,
        title: "Midas Farmer",

        apiDelay: 3000,
        apiOptions: {
          withCredentials: true,
        },
      }),
      []
    )
  );
}
