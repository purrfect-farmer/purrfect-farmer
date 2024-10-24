import useDropFarmer from "@/hooks/useDropFarmer";
import { useMemo } from "react";
import { useMultiRequestData } from "@/hooks/useMultiRequestData";

import GoatsIcon from "../assets/images/icon.png?format=webp&w=80";

export default function useGoatsFarmer() {
  const farmer = useDropFarmer(
    useMemo(
      () => ({
        id: "goats",
        host: "dev.goatsbot.xyz",
        notification: {
          icon: GoatsIcon,
          title: "Goats Farmer",
        },
        domains: ["*.goatsbot.xyz"],
      }),
      []
    )
  );

  const requests = useMultiRequestData(
    farmer.port,
    useMemo(
      () => ({
        userRequest: "https://api-me.goatsbot.xyz/users/me",
        checkInRequest: "https://api-checkin.goatsbot.xyz/checkin/user",
        missionsRequest: "https://api-mission.goatsbot.xyz/missions/user",
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
