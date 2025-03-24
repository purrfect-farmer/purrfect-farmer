import useDropFarmer from "@/hooks/useDropFarmer";
import { useMemo } from "react";

import MatchQuestIcon from "../assets/images/icon.png?format=webp&w=80";

export default function useMatchQuestFarmer() {
  return useDropFarmer(
    useMemo(
      () => ({
        id: "matchquest",
        host: "tgapp.matchain.io",
        icon: MatchQuestIcon,
        title: "MatchQuest Farmer",

        domains: ["tgapp-api.matchain.io"],
        syncToCloud: true,
      }),
      []
    )
  );
}
