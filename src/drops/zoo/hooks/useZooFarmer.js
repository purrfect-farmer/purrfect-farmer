import useDropFarmer from "@/hooks/useDropFarmer";
import { useMemo } from "react";

import ZooIcon from "../assets/images/icon.png?format=webp&w=80";

export default function useZooFarmer() {
  return useDropFarmer(
    useMemo(
      () => ({
        id: "zoo",
        host: "game.zoo.team",
        notification: {
          icon: ZooIcon,
          title: "Zoo Farmer",
        },
        domains: ["*.zoo.team"],
        extractAuthHeaders(headers) {
          return headers.filter(
            (header) =>
              header.name.toLowerCase() === "api-key" &&
              header.value !== "empty"
          );
        },
        syncToCloud: true,
      }),
      []
    )
  );
}
