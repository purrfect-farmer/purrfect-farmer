import useDropFarmer from "@/hooks/useDropFarmer";
import { useMemo } from "react";

import DiggerIcon from "../assets/images/icon.png?format=webp&w=80";

export default function useDiggerFarmer() {
  return useDropFarmer(
    useMemo(
      () => ({
        id: "digger",
        host: "diggergame.app",
        domains: ["*.diggergame.app"],
        syncToCloud: true,

        icon: DiggerIcon,
        title: "Digger Farmer",
      }),
      []
    )
  );
}
