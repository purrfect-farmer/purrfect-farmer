import useDropFarmer from "@/hooks/useDropFarmer";
import { useMemo } from "react";

import HorseGoIcon from "../assets/images/icon.png?format=webp&w=80";

export default function useHorseGoFarmer() {
  return useDropFarmer(
    useMemo(
      () => ({
        id: "horse-go",
        host: "horsego.vip",
        notification: {
          icon: HorseGoIcon,
          title: "HorseGo Farmer",
        },
        domains: ["api.horsego.vip"],
      }),
      []
    )
  );
}
