import useDropFarmer from "@/hooks/useDropFarmer";
import { useMemo } from "react";

import GoldEagleIcon from "../assets/images/icon.png?format=webp&w=80";

export default function useGoldEagleFarmer() {
  return useDropFarmer(
    useMemo(
      () => ({
        id: "gold-eagle",
        host: "telegram.geagle.online",
        notification: {
          icon: GoldEagleIcon,
          title: "Gold Eagle Farmer",
        },
        domains: ["gold-eagle-api.fly.dev"],
      }),
      []
    )
  );
}
