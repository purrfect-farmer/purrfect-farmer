import { CgSpinner } from "react-icons/cg";
import { memo } from "react";
import { useEffect } from "react";
import { useRef } from "react";
import { useState } from "react";

import BlumAutoGamer from "./BlumAutoGamer";
import { getBlumGame } from "../lib/utils";

export default memo(function BlumGamer() {
  const [loaded, setLoaded] = useState(false);
  const [game, setGame] = useState(null);
  const workerRef = useRef();

  /** Get Blum Game */
  useEffect(() => {
    (async function () {
      setGame(await getBlumGame());
    })();
  }, []);

  /** Get Worker */
  useEffect(() => {
    if (game) {
      workerRef.current = new Worker(game.workerBlobURL);

      setLoaded(true);
    }

    return () => {
      workerRef.current?.terminate();
      workerRef.current = null;
      setLoaded(false);
    };
  }, [game]);

  return loaded ? (
    <BlumAutoGamer workerRef={workerRef} />
  ) : (
    <CgSpinner className="w-5 h-5 mx-auto animate-spin" />
  );
});
