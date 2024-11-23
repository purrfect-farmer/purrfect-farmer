import useValuesMemo from "@/hooks/useValuesMemo";
import { logNicely } from "@/lib/utils";
import { useEffect } from "react";
import { useState } from "react";

import { getTomarketGame } from "../lib/utils";

export default function useTomarket(farmer) {
  const [tomarket, setTomarket] = useState(null);

  /** Get Tomarket ID */
  useEffect(() => {
    (async function () {
      if (farmer.auth) {
        const game = await getTomarketGame();

        /** Log it */
        logNicely("TOMARKET", game);

        /** Set Result */
        setTomarket(game);
      }
    })();
  }, [farmer.auth]);

  return useValuesMemo({
    ...farmer,
    tomarket,
  });
}
