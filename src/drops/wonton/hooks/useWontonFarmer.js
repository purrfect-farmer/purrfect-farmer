import useDropFarmer from "@/hooks/useDropFarmer";
import { useMemo } from "react";

import WontonIcon from "../assets/images/icon.png?format=webp&w=80";

export default function useWontonFarmer() {
  return useDropFarmer(
    useMemo(
      () => ({
        id: "wonton",
        host: "www.wonton.restaurant",
        notification: {
          icon: WontonIcon,
          title: "Wonton Farmer",
        },
        domains: ["*.wonton.food"],
        apiDelay: 3000,
        syncToCloud: true,
      }),
      []
    )
  );
}
