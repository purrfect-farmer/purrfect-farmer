import { CgSpinner } from "react-icons/cg";
import { useEffect } from "react";
import { useRef } from "react";
import { useState } from "react";

import BlumAutoGamer from "./BlumAutoGamer";
import { getBlumGame } from "../lib/utils";

export default function BlumGamer() {
  const [loaded, setLoaded] = useState(false);
  const [game, setGame] = useState(null);
  const workerRef = useRef();

  useEffect(() => {
    (async function () {
      setGame(await getBlumGame());
    })();
  }, []);

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
}
