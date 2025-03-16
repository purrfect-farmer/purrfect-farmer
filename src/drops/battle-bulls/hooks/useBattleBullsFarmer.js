import useDropFarmer from "@/hooks/useDropFarmer";
import { useMemo } from "react";

import BattleBullsIcon from "../assets/images/icon.png?format=webp&w=80";

export default function useBattleBullsFarmer() {
  return useDropFarmer(
    useMemo(
      () => ({
        id: "battle-bulls",
        host: "tg.battle-games.com",
        icon: BattleBullsIcon,
        title: "BattleBulls Farmer",

        domains: ["*.battle-games.com"],
      }),
      []
    )
  );
}
