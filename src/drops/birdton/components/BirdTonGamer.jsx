import Slider from "@/components/Slider";
import toast from "react-hot-toast";
import useFarmerAutoProcess from "@/hooks/useFarmerAutoProcess";
import useFarmerContext from "@/hooks/useFarmerContext";
import useProcessLock from "@/hooks/useProcessLock";
import useSocketState from "@/hooks/useSocketState";
import useSyncedRef from "@/hooks/useSyncedRef";
import { cn, delay, delayForSeconds, extraGamePoints } from "@/lib/utils";
import { memo } from "react";
import { useCallback } from "react";
import { useEffect } from "react";
import { useMemo } from "react";
import { useState } from "react";

import useBirdTonHandlers from "../hooks/useBirdTonHandlers";
import useAppContext from "@/hooks/useAppContext";

const MIN_POINT = 80;
const INITIAL_POINT = 100;
const MAX_POINT = 200;

export default memo(function BirdTonGamer() {
  const { settings } = useAppContext();
  const process = useProcessLock("birdton.game");
  const {
    zoomies,
    sendMessage,
    user,
    queryClient,
    authQueryKey,
    refreshTasks,
  } = useFarmerContext();
  const [createGameCallback, setCreateGameCallback] = useState(null);
  const [saveGameCallback, setSaveGameCallback] = useState(null);

  const [farmingSpeed, , dispatchAndSetFarmingSpeed] = useSocketState(
    "birdton.farming-speed",
    2
  );

  /** Game Speed Ref */
  const gameSpeedRef = useSyncedRef(farmingSpeed);

  /** Game Points */
  const [points, setPoints] = useState(0);
  const [stopPoint, setStopPoint] = useState(null);

  const [gameId, setGameId] = useState(null);
  const [desiredPoint, setDesiredPoint, dispatchAndSetDesiredPoint] =
    useSocketState("birdton.game.desired-point", INITIAL_POINT);

  const perGamePoints = useMemo(
    () =>
      Math.max(
        MIN_POINT,
        Math.min(settings.uncappedPoints ? Infinity : MAX_POINT, desiredPoint)
      ),
    [desiredPoint, settings.uncappedPoints]
  );

  const energy = user?.["energy"] || 0;

  /** Reset Game */
  const reset = useCallback(() => {
    setGameId(null);
    setPoints(0);
    setStopPoint(null);
  }, [setGameId, setPoints, setStopPoint]);

  const createGame = useCallback(() => {
    return toast
      .promise(
        new Promise((resolve, reject) => {
          /** Create Game Callback */
          setCreateGameCallback(() => resolve);

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
        setCreateGameCallback(null);
        return Promise.resolve(id);
      });
  }, [sendMessage, setCreateGameCallback]);

  /** Start Game */
  const startGame = useCallback(() => {
    return createGame().then((id) => {
      setPoints(0);
      setDesiredPoint(perGamePoints);
      setStopPoint(extraGamePoints(perGamePoints));
      setGameId(id);
    });
  }, [
    createGame,
    perGamePoints,
    setGameId,
    setPoints,
    setDesiredPoint,
    setStopPoint,
  ]);

  /** Handle Game Created */
  const handleGameCreated = useCallback(
    ({ data }) => {
      if (!createGameCallback) {
        return;
      }

      createGameCallback(data);
    },
    [createGameCallback]
  );

  /** Handle Game Saved */
  const handleGameSaved = useCallback(
    async ({ data }) => {
      const result = JSON.parse(data);

      /** Set Balance */
      queryClient.setQueryData(authQueryKey, (prev) => {
        return {
          ...prev,
          energy: prev?.["energy"] - 1,
          balance: result.balance,
          high_score: result.high_score,
        };
      });

      /** Reset */
      reset();

      /** Refresh Tasks */
      await refreshTasks();

      /** Delay */
      await delay(1000);

      /** Callback */
      saveGameCallback?.(zoomies.enabled);
    },
    [
      reset,
      authQueryKey,
      refreshTasks,
      saveGameCallback,
      queryClient.setQueryData,
      zoomies.enabled,
    ]
  );

  /** Handlers */
  useBirdTonHandlers(
    useMemo(
      () => ({
        ["game_id"]: (message) => {
          handleGameCreated(message);
        },
        ["game_saved"]: (message) => {
          handleGameSaved(message);
        },
      }),
      [handleGameCreated, handleGameSaved]
    )
  );

  /** Reset */
  useEffect(() => {
    reset();
  }, [process.started, reset]);

  /** Play Game */
  useEffect(() => {
    if (!process.canExecute) {
      return;
    }

    /** Energy is low */
    if (energy < 1) {
      /** Stop the Process */
      process.stop();

      return;
    }

    /** No Game ID */
    if (!gameId) {
      startGame();
      return;
    }

    /** Execute */
    process.execute(async function () {
      /** End Game */
      const endGame = () =>
        new Promise((res) => {
          setSaveGameCallback(() => res);
          sendMessage({ event_type: "game_end", data: gameId });
        });

      /** Add Abort Listener */
      process.controller.signal.addEventListener("abort", endGame);

      for (let i = 0; i < stopPoint; i++) {
        if (process.controller.signal.aborted) {
          return;
        }

        /** Delay */
        await delayForSeconds(gameSpeedRef.current);

        if (!process.controller.signal.aborted) {
          /** Claim Point */
          sendMessage({ event_type: "рiрe", data: gameId });
          setPoints(i + 1);
        }
      }

      if (!process.controller.signal.aborted) {
        /** Delay */
        await delay(1000);

        /** End Game */
        return await endGame();
      }
    });
  }, [process, energy, gameId, startGame, reset, gameSpeedRef]);

  /** Auto-Play */
  useFarmerAutoProcess("game", true, process);

  return (
    <div className="flex flex-col gap-4">
      {gameId ? (
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
            className={cn(
              "p-2 bg-neutral-200 dark:bg-neutral-700 rounded-lg  outline-0"
            )}
          />
          <p className="text-neutral-400">Minimum Point (+extra points.)</p>
        </>
      )}

      {/* Start or Stop Button */}
      <button
        onClick={() => process.dispatchAndToggle(!process.started)}
        disabled={energy < 1}
        className={cn(
          "w-full px-4 py-2 uppercase rounded-lg font-bold disabled:opacity-50 text-white",
          !gameId ? "bg-sky-500" : "bg-red-500"
        )}
      >
        {!gameId ? "Start" : "Stop"}
      </button>

      {/* Farming Speed */}
      <div className="flex flex-col gap-1">
        {/* Speed Control */}
        <Slider
          value={[farmingSpeed]}
          min={0}
          max={5}
          step={0.5}
          onValueChange={([value]) =>
            dispatchAndSetFarmingSpeed(Math.max(0.5, value))
          }
          trackClassName="bg-sky-200"
          rangeClassName="bg-sky-500"
          thumbClassName="bg-sky-500"
        />

        {/* Speed Display */}
        <div className="text-center">
          Flying Speed: <span className="text-sky-500">{farmingSpeed}s</span>
        </div>
      </div>
    </div>
  );
});
