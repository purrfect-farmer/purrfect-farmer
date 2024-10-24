import useDropFarmer from "@/hooks/useDropFarmer";

import SlotcoinIcon from "../assets/images/icon.png?format=webp&w=80";

export default function useSlotcoinFarmer() {
  return useDropFarmer({
    id: "slotcoin",
    host: "app.slotcoin.app",
    notification: {
      icon: SlotcoinIcon,
      title: "Slotcoin Farmer",
    },
    domains: ["*.slotcoin.app"],
  });
}
