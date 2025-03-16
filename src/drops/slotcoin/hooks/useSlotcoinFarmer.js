import useDropFarmer from "@/hooks/useDropFarmer";
import { useMemo } from "react";

import SlotcoinIcon from "../assets/images/icon.png?format=webp&w=80";

export default function useSlotcoinFarmer() {
  return useDropFarmer(
    useMemo(
      () => ({
        id: "slotcoin",
        host: "app.slotcoin.app",
        icon: SlotcoinIcon,
        title: "Slotcoin Farmer",

        domains: ["*.slotcoin.app"],
        syncToCloud: true,
      }),
      []
    )
  );
}
