import useDropFarmer from "@/hooks/useDropFarmer";
import { useMemo } from "react";

import PumpadIcon from "../assets/images/icon.png?format=webp&w=80";

export default function usePumpadFarmer() {
  return useDropFarmer(
    useMemo(
      () => ({
        id: "pumpad",
        host: "tg-home.pumpad.io",
        notification: {
          icon: PumpadIcon,
          title: "Pumpad Farmer",
        },
        domains: ["tg.pumpad.io"],
      }),
      []
    )
  );
}
