import useDropFarmer from "@/hooks/useDropFarmer";
import { useMemo } from "react";

import BlumIcon from "../assets/images/icon.png?format=webp&w=80";

export default function useBlumFarmer() {
  return useDropFarmer(
    useMemo(
      () => ({
        id: "blum",
        host: "telegram.blum.codes",
        icon: BlumIcon,
        title: "Blum Farmer",

        domains: ["*.blum.codes"],
      }),
      []
    )
  );
}
