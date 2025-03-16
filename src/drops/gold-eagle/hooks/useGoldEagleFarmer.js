import useDropFarmer from "@/hooks/useDropFarmer";
import { customLogger } from "@/lib/utils";
import { useMemo } from "react";

import GoldEagleIcon from "../assets/images/icon.png?format=webp&w=80";
import { getGoldEagleGame } from "../lib/utils";

export default function useGoldEagleFarmer() {
  return useDropFarmer(
    useMemo(
      () => ({
        id: "gold-eagle",
        host: "telegram.geagle.online",
        title: "Gold Eagle Farmer",
        icon: GoldEagleIcon,
        domains: ["gold-eagle-api.fly.dev"],
        syncToCloud: true,
        async fetchMeta() {
          const game = await getGoldEagleGame();

          /** Log it */
          customLogger("GOLD-EAGLE", game);

          /** Throw Error */
          if (!game) {
            throw new Error("Unable to setup Gold Eagle");
          }

          return game;
        },
      }),
      []
    )
  );
}
