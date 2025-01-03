import useDropFarmer from "@/hooks/useDropFarmer";
import { useMemo } from "react";

import YescoinIcon from "../assets/images/icon.png?format=webp&w=80";

export default function useYescoinFarmer() {
  return useDropFarmer(
    useMemo(
      () => ({
        id: "yescoin",
        host: "www.yescoin.gold",
        notification: {
          icon: YescoinIcon,
          title: "Yescoin Farmer",
        },
        domains: ["*.yescoin.gold"],
        authHeaders: ["token"],
      }),
      []
    )
  );
}
