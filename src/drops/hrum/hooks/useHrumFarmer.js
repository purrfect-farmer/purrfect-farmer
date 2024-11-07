import useDropFarmer from "@/hooks/useDropFarmer";
import { useMemo } from "react";

import HrumIcon from "../assets/images/icon.png?format=webp&w=80";

export default function useHrumFarmer() {
  return useDropFarmer(
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
        autoTasks: ["tasks", "daily.riddle", "daily.cookie"],
      }),
      []
    )
  );
}
