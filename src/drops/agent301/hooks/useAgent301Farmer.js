import useDropFarmer from "@/hooks/useDropFarmer";
import { useMemo } from "react";

import Agent301Icon from "../assets/images/icon.png?format=webp&w=80";

export default function useAgent301Farmer() {
  return useDropFarmer(
    useMemo(
      () => ({
        id: "agent301",
        host: "static.agent301.org",
        icon: Agent301Icon,
        title: "Agent301 Farmer",
        domains: ["*.agent301.org"],
      }),
      []
    )
  );
}
