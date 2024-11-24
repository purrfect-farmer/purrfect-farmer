import Countdown from "react-countdown";
import toast from "react-hot-toast";
import useFarmerAutoProcess from "@/hooks/useFarmerAutoProcess";
import useProcessLock from "@/hooks/useProcessLock";
import useSocketState from "@/hooks/useSocketState";
import { delay } from "@/lib/utils";
import { useCallback, useEffect, useMemo } from "react";
import { useState } from "react";

import TomarketButton from "./TomarketButton";
import TomarketInput from "./TomarketInput";
import useTomarketBalanceQuery from "../hooks/useTomarketBalanceQuery";
import useTomarketClaimGameMutation from "../hooks/useTomarketClaimGameMutation";
import useTomarketStartGameMutation from "../hooks/useTomarketStartGameMutation";

const GAME_DURATION = 30_000;
const EXTRA_DELAY = 3_000;
const MIN_POINT = 100;
const INITIAL_POINT = 220;
const MAX_POINT = 390;

export default function Tomarket({ tomarket }) {
  const query = useTomarketBalanceQuery();
  const process = useProcessLock("tomarket.game");
  const [countdown, setCountdown] = useState(null);
  const [desiredPoint, setDesiredPoint, dispatchAndSetDesiredPoint] =
    useSocketState("tomarket.game.desired-point", INITIAL_POINT);

  const tickets = query.data?.["play_passes"] || 0;
  const points = useMemo(
    () => Math.max(MIN_POINT, Math.min(MAX_POINT, desiredPoint)),
    [desiredPoint]
  );

  const startGameMutation = useTomarketStartGameMutation(tomarket?.drop);
  const claimGameMutation = useTomarketClaimGameMutation(
    tomarket?.drop,
    points
  );

  /** Countdown renderer */
  const countdownRenderer = useCallback(
    ({ seconds }) => <span className="text-xl font-bold">{seconds}</span>,
    []
  );

  /** Override Points */
  useEffect(() => {
    setDesiredPoint(points);
  }, [process.started]);

  /** Auto Play */
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
        const game = await startGameMutation.mutateAsync();

        /** Wait for countdown */
        setCountdown(Date.now() + GAME_DURATION);
        await delay(GAME_DURATION, true);

        /** Reset countdown */
        setCountdown(null);

        /** Claim Game */
        await claimGameMutation.mutateAsync(game["stars"]);

        /** Toast After Claiming Stars */
        if (game["stars"] > 0) {
          toast.success(`Tomarket Stars - ${game["stars"]}`);
        }
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
  }, [process, tickets]);

  /** Auto-Game */
  useFarmerAutoProcess("game", !query.isLoading, process);

  return (
    <div className="flex flex-col gap-2">
      {tickets > 0 ? (
        <>
          <TomarketInput
            disabled={process.started || tickets < 1}
            value={desiredPoint}
            onInput={(ev) => dispatchAndSetDesiredPoint(ev.target.value)}
            type="number"
            min={MIN_POINT}
            max={MAX_POINT}
            placeholder={`Range (${MIN_POINT} - ${MAX_POINT})`}
          />
          <p className="text-rose-100">
            Minimum Point (automatically adds extra 1-20 points.)
          </p>
        </>
      ) : null}

      {/* Start or Stop Button  */}
      <TomarketButton
        color={process.started ? "danger" : "primary"}
        disabled={tickets < 1}
        onClick={() => process.dispatchAndToggle(!process.started)}
      >
        {process.started ? "Stop" : "Start"}
      </TomarketButton>

      {process.started ? (
        <div className="flex flex-col gap-2 p-4 text-white bg-black rounded-lg">
          {/* Game Start */}
          {startGameMutation.isPending ? (
            <p className="font-bold text-yellow-500">Starting Game...</p>
          ) : startGameMutation.isError ? (
            <p className="font-bold text-red-700">Failed to start game...</p>
          ) : startGameMutation.isSuccess ? (
            <>
              <p className="font-bold text-green-500">
                ROUND ID: {startGameMutation.data?.["round_id"]}
              </p>
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
                  <span className="text-red-700">
                    Failed to claim points...
                  </span>
                ) : claimGameMutation.isSuccess ? (
                  <span className="font-bold text-green-500">
                    Points claimed. (Refreshing...)
                  </span>
                ) : null}
              </p>
            </>
          ) : (
            <p className="text-rose-100">Loading...</p>
          )}
        </div>
      ) : null}
    </div>
  );
}
