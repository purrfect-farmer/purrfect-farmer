import useDropFarmer from "@/hooks/useDropFarmer";
import { useMemo } from "react";

import DreamCoinIcon from "../assets/images/icon.png?format=webp&w=80";

export default function useDreamCoinFarmer() {
  return useDropFarmer(
    useMemo(
      () => ({
        id: "dreamcoin",
        host: "dreamcoin.ai",
        notification: {
          icon: DreamCoinIcon,
          title: "DreamCoin Farmer",
        },
        authHeaders: ["authorization", "baggage", "sentry-trace"],
        domains: ["*.dreamcoin.ai"],
        syncToCloud: true,
      }),
      []
    )
  );
}
