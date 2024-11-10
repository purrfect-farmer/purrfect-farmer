import useDropFarmer from "@/hooks/useDropFarmer";
import { useMemo } from "react";

import GoatsIcon from "../assets/images/icon.png?format=webp&w=80";

export default function useGoatsFarmer() {
  return useDropFarmer(
    useMemo(
      () => ({
        id: "goats",
        host: "dev.goatsbot.xyz",
        notification: {
          icon: GoatsIcon,
          title: "Goats Farmer",
        },
        domains: ["*.goatsbot.xyz"],
        apiDelay: 5000,
        tasks: ["missions"],
      }),
      []
    )
  );
}
