import useDropFarmer from "@/hooks/useDropFarmer";
import { useMemo } from "react";
import { useMultiRequestData } from "@/hooks/useMultiRequestData";

import HrumIcon from "../assets/images/icon.png?format=webp&w=80";

export default function useHrumFarmer() {
  const farmer = useDropFarmer(
    useMemo(
      () => ({
        id: "hrum",
        host: "game.hrum.me",
        notification: {
          icon: HrumIcon,
          title: "Hrum Farmer",
        },
        domains: ["*.hrum.me"],
        extractAuthHeaders(headers) {
          return headers.filter(
            (header) =>
              header.name.toLowerCase() === "api-key" &&
              header.value !== "empty"
          );
        },
      }),
      []
    )
  );

  const requests = useMultiRequestData(
    farmer.port,
    useMemo(
      () => ({
        allDataRequest: "https://api.hrum.me/user/data/all",
        afterDataRequest: "https://api.hrum.me/user/data/after",
        dailyQuestsRequest: "https://api.hrum.me/quests/daily",
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
