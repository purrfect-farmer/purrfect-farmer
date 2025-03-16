import useDropFarmer from "@/hooks/useDropFarmer";
import { customLogger } from "@/lib/utils";
import { useMemo } from "react";

import TomarketIcon from "../assets/images/icon.png?format=webp&w=80";
import { getTomarketGame } from "../lib/utils";

export default function useTomarketFarmer() {
  return useDropFarmer(
    useMemo(
      () => ({
        id: "tomarket",
        host: "mini-app.tomarket.ai",
        icon: TomarketIcon,
        title: "Tomarket Farmer",

        domains: ["*.tomarket.ai"],
        apiDelay: 500,

        /** Fetch Meta */
        async fetchMeta() {
          const game = await getTomarketGame();

          /** Log it */
          customLogger("TOMARKET", game);

          /** Throw Error */
          if (!game) {
            throw new Error("Unable to setup Tomarket");
          }

          return game;
        },
      }),
      []
    )
  );
}
