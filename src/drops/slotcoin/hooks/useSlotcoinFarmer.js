import useDropFarmer from "@/hooks/useDropFarmer";
import { useMemo } from "react";
import { useMultiRequestData } from "@/hooks/useMultiRequestData";

import SlotcoinIcon from "../assets/images/icon.png?format=webp&w=80";

export default function useSlotcoinFarmer() {
  const farmer = useDropFarmer(
    useMemo(
      () => ({
        id: "slotcoin",
        host: "app.slotcoin.app",
        notification: {
          icon: SlotcoinIcon,
          title: "Slotcoin Farmer",
        },
        domains: ["*.slotcoin.app"],
      }),
      []
    )
  );

  const requests = useMultiRequestData(
    farmer.port,
    useMemo(
      () => ({
        infoRequest: "https://api.slotcoin.app/v1/clicker/api/info",
        checkInInfoRequest: "https://api.slotcoin.app/v1/clicker/check-in/info",
      }),
      []
    )
  );

  return useMemo(
    () => ({
      ...farmer,
      ...requests,
    }),
    [farmer, requests]
  );
}
