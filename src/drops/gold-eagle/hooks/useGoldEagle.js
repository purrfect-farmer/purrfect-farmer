import useValuesMemo from "@/hooks/useValuesMemo";
import { logNicely } from "@/lib/utils";
import { useEffect } from "react";
import { useState } from "react";

import { getGoldEagleGame } from "../lib/utils";

export default function useGoldEagle(farmer) {
  const [game, setGame] = useState(null);

  /** Get Game */
  useEffect(() => {
    (async function () {
      if (farmer.auth) {
        const game = await getGoldEagleGame();

        /** Log it */
        logNicely("GOLD-EAGLE", game);

        /** Set Result */
        setGame(game);
      }
    })();
  }, [farmer.auth]);

  return useValuesMemo({
    ...farmer,
    game,
  });
}
