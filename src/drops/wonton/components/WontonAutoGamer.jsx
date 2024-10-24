import Countdown from "react-countdown";
import useProcessLock from "@/hooks/useProcessLock";
import useSocketDispatchCallback from "@/hooks/useSocketDispatchCallback";
import useSocketHandlers from "@/hooks/useSocketHandlers";
import useSocketState from "@/hooks/useSocketState";
import { delay } from "@/lib/utils";
import { useCallback } from "react";
import { useEffect } from "react";
import { useMemo } from "react";
import { useState } from "react";

import WontonButton from "./WontonButton";
import WontonInput from "./WontonInput";
import useWontonClaimGameMutation from "../hooks/useWontonClaimGameMutation";
import useWontonStartGameMutation from "../hooks/useWontonStartGameMutation";
import useWontonUserQuery from "../hooks/useWontonUserQuery";

const GAME_DURATION = 15_000;
const EXTRA_DELAY = 3_000;
const MIN_POINT = 100;
const INITIAL_POINT = 220;
const MAX_POINT = 380;

export default function Wonton() {
  const query = useWontonUserQuery();

  const process = useProcessLock();

  const [countdown, setCountdown] = useState(null);
  const [desiredPoint, setDesiredPoint, dispatchAndSetDesiredPoint] =
    useSocketState("wonton.game.desired-point", INITIAL_POINT);

  const tickets = query.data?.ticketCount || 0;
  const points = useMemo(
    () => Math.max(MIN_POINT, Math.min(MAX_POINT, desiredPoint)),
    [desiredPoint]
  );

  const startGameMutation = useWontonStartGameMutation();
  const claimGameMutation = useWontonClaimGameMutation(points);

  /** Countdown renderer */
  const countdownRenderer = useCallback(
    ({ seconds }) => <span className="text-xl font-bold">{seconds}</span>,
    []
  );

  /** Handle start button click */
  const [startPlaying, dispatchAndStartPlaying] = useSocketDispatchCallback(
    /** Main */
    useCallback(() => {
      setDesiredPoint(points);
      process.start();
    }, [points, setDesiredPoint, process]),

    /** Dispatch */
    useCallback((socket) => {
      socket.dispatch({
        action: "wonton.autoplay.start",
      });
    }, [])
  );

  /** Handle stop button click */
  const [stopPlaying, dispatchAndStopPlaying] = useSocketDispatchCallback(
    /** Main */
    useCallback(() => {
      setDesiredPoint(points);
      process.stop();
    }, [points, setDesiredPoint, process]),

    /** Dispatch */
    useCallback((socket) => {
      socket.dispatch({
        action: "wonton.autoplay.stop",
      });
    }, [])
  );

  /** Handlers */
  useSocketHandlers(
    useMemo(
      () => ({
        "wonton.autoplay.start": () => {
          startPlaying();
        },
        "wonton.autoplay.stop": () => {
          stopPlaying();
        },
      }),
      [startPlaying, stopPlaying]
    )
  );

  useEffect(() => {
    if (!process.canExecute) {
      return;
    }

    if (tickets < 1) {
      process.stop();
      return;
    }

    (async function () {
      /** Lock Process */
      process.lock();

      try {
        const { bonusRound, amountPerSize } =
          await startGameMutation.mutateAsync();

        /** Wait for countdown */

        const stopTime = GAME_DURATION + Math.floor(Math.random() * 5);

        setCountdown(Date.now() + stopTime);
        await delay(stopTime);

        /** Reset countdown */
        setCountdown(null);

        /** Claim Game */
        await claimGameMutation.mutateAsync(bonusRound);
      } catch {}

      /** Add a little delay */
      await delay(EXTRA_DELAY);

      /** Reset Mutation */
      try {
        await query.refetch();
      } catch {}

      /** Release Lock */
      process.unlock();
    })();
  }, [tickets, process]);

  return (
    <div className="flex flex-col gap-2">
      {tickets > 0 ? (
        <>
          <WontonInput
            disabled={process.started || tickets < 1}
            value={desiredPoint}
            onInput={(ev) => dispatchAndSetDesiredPoint(ev.target.value)}
            type="number"
            min={MIN_POINT}
            max={MAX_POINT}
            placeholder={`Range (${MIN_POINT} - ${MAX_POINT})`}
          />
          <p className="text-center text-gray-500">
            Minimum Point (automatically adds extra 1-20 points.)
          </p>
        </>
      ) : null}

      {/* Start or Stop Button  */}
      <WontonButton
        color={process.started ? "danger" : "primary"}
        disabled={tickets < 1}
        onClick={
          !process.started ? dispatchAndStartPlaying : dispatchAndStopPlaying
        }
      >
        {process.started ? "Stop" : "Start"}
      </WontonButton>

      {process.started ? (
        <div className="flex flex-col gap-2 p-4 text-white rounded-lg bg-wonton-green-800">
          {/* Game Start */}
          {startGameMutation.isPending ? (
            <p className="font-bold text-yellow-500">Starting Game...</p>
          ) : startGameMutation.isError ? (
            <p className="font-bold text-red-500">Failed to start game...</p>
          ) : startGameMutation.isSuccess ? (
            <>
              <p className="font-bold text-green-500">Playing Game</p>
              <p>
                {countdown ? (
                  <Countdown
                    key={countdown}
                    date={countdown}
                    renderer={countdownRenderer}
                  />
                ) : claimGameMutation.isPending ? (
                  <span className="text-yellow-500">Claiming points...</span>
                ) : claimGameMutation.isError ? (
                  <span className="text-red-500">
                    Failed to claim points...
                  </span>
                ) : claimGameMutation.isSuccess ? (
                  <span className="font-bold text-wonton-green-500">
                    Points claimed. (Refreshing...)
                  </span>
                ) : null}
              </p>
            </>
          ) : (
            <p className="text-gray-400">Loading...</p>
          )}
        </div>
      ) : null}
    </div>
  );
}
