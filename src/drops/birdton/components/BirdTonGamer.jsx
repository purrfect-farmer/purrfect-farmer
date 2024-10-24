import toast from "react-hot-toast";
import useFarmerContext from "@/hooks/useFarmerContext";
import useProcessLock from "@/hooks/useProcessLock";
import useSocketDispatchCallback from "@/hooks/useSocketDispatchCallback";
import useSocketHandlers from "@/hooks/useSocketHandlers";
import useSocketState from "@/hooks/useSocketState";
import { cn, delay } from "@/lib/utils";
import { useCallback } from "react";
import { useEffect } from "react";
import { useMemo } from "react";
import { useState } from "react";

import useBirdTonHandlers from "../hooks/useBirdTonHandlers";

const MIN_POINT = 1;
const INITIAL_POINT = 120;
const MAX_POINT = 280;

export default function BirdTonGamer() {
  const process = useProcessLock();
  const { sendMessage, user, setUser } = useFarmerContext();
  const [startGameCallback, setStartGameCallback] = useState(null);

  /** Game Points */
  const [points, setPoints] = useState(0);
  const [stopPoint, setStopPoint] = useState(null);

  const [gameId, setGameId] = useState(null);
  const [desiredPoint, setDesiredPoint, dispatchAndSetDesiredPoint] =
    useSocketState("birdton.game.desired-point", INITIAL_POINT);

  const perGamePoin = useMemo(
    () => Math.max(MIN_POINT, Math.min(MAX_POINT, desiredPoint)),
    [desiredPoint]
  );

  const energy = user?.["energy"] || 0;

  /** Reset Game */
  const reset = useCallback(() => {
    setGameId(null);
    setPoints(0);
    setStopPoint(null);
  }, [setGameId, setPoints, setStopPoint]);

  /** Start Game */
  const [startGame, dispatchAndStartGame] = useSocketDispatchCallback(
    /** Main */
    useCallback(() => {
      return toast
        .promise(
          new Promise((resolve, reject) => {
            /** Set Game Callback */
            setStartGameCallback(() => resolve);

            /** Emit Message */
            sendMessage({ event_type: "game_id", data: "std" });
          }),
          {
            loading: "Starting...",
            success: "Started!",
            error: "Error!",
          }
        )
        .then((id) => {
          setStartGameCallback(null);
          setPoints(0);
          setDesiredPoint(perGamePoin);
          setStopPoint(perGamePoin + Math.floor(Math.random() * 20));
          setGameId(id);
          process.start();
        });
    }, [
      perGamePoin,
      sendMessage,
      setStartGameCallback,
      setGameId,
      setPoints,
      setStopPoint,
      setDesiredPoint,
    ]),

    /** Dispatch */
    useCallback((socket) => {
      socket.dispatch({
        action: "birdton.autoplay.start",
      });
    }, [])
  );

  /** Stop Game */
  const [stopGame, dispatchAndStopGame] = useSocketDispatchCallback(
    /** Main */
    useCallback(() => {
      process.stop();
    }, [process]),

    /** Dispatch */
    useCallback((socket) => {
      socket.dispatch({
        action: "birdton.autoplay.stop",
      });
    }, [])
  );

  /** Handle Game Start */
  const handleGameStart = useCallback(
    ({ data }) => {
      if (!startGameCallback) {
        return;
      }

      startGameCallback(data);
    },
    [startGameCallback]
  );

  /** Handle Game Saved */
  const handleGameSaved = useCallback(
    ({ data }) => {
      const result = JSON.parse(data);

      setUser((prev) => {
        return {
          ...prev,
          balance: result.balance,
          high_score: result.high_score,
        };
      });
    },
    [setUser]
  );

  /** Handlers */
  useBirdTonHandlers(
    useMemo(
      () => ({
        ["game_id"]: (message) => {
          handleGameStart(message);
        },
        ["game_saved"]: (message) => {
          handleGameSaved(message);
        },
      }),
      [handleGameStart]
    )
  );

  /** Sync Handlers */
  useSocketHandlers(
    useMemo(
      () => ({
        "birdton.autoplay.start": () => {
          startGame();
        },
        "birdton.autoplay.stop": () => {
          stopGame();
        },
      }),
      [startGame, stopGame]
    )
  );

  /** Play Game */
  useEffect(() => {
    if (!process.started || process.locked) {
      return;
    }

    (async function () {
      /** Lock The Process */
      process.lock();

      /** End Game */
      const endGame = () => {
        sendMessage({ event_type: "game_end", data: gameId });
        reset();
      };

      /** Add Abort Listener */
      process.signal.addEventListener("abort", endGame);

      for (let i = 0; i < stopPoint; i++) {
        if (process.signal.aborted) {
          return;
        }

        /** Delay */
        const duration = 3 + Math.floor(Math.random() * 2);
        await delay(duration * 1000);

        if (!process.signal.aborted) {
          /** Claim Point */
          sendMessage({ event_type: "рiрe", data: gameId });
          setPoints(i + 1);
        }
      }

      /** Delay for 2 Sec */
      await delay(2000);

      /** Stop */
      process.stop();
    })();
  }, [process, reset]);

  return (
    <div className="flex flex-col gap-4">
      {process.started ? (
        <div className="flex items-center justify-center gap-2 text-3xl font-bold text-center">
          {points} <sub className="text-base"> / {stopPoint}</sub>
        </div>
      ) : (
        <>
          <input
            value={desiredPoint}
            onInput={(ev) => dispatchAndSetDesiredPoint(ev.target.value)}
            type="number"
            min={MIN_POINT}
            max={MAX_POINT}
            placeholder={`Range (${MIN_POINT} - ${MAX_POINT})`}
            className={cn("p-2 bg-neutral-200 rounded-lg  outline-0")}
          />
          <p className="text-neutral-500">
            Minimum Point (automatically adds extra 1-20 points.)
          </p>
        </>
      )}

      {/* Start or Stop Button */}
      <button
        onClick={!process.started ? dispatchAndStartGame : dispatchAndStopGame}
        disabled={energy < 1}
        className={cn(
          "w-full px-4 py-2 uppercase rounded-lg font-bold disabled:opacity-50 text-white",
          !process.started ? "bg-sky-500" : "bg-red-500"
        )}
      >
        {!process.started ? "Start" : "Stop"}
      </button>
    </div>
  );
}
