import Countdown from "react-countdown";
import useAppContext from "@/hooks/useAppContext";
import useFarmerAutoProcess from "@/hooks/useFarmerAutoProcess";
import useMirroredState from "@/hooks/useMirroredState";
import useProcessLock from "@/hooks/useProcessLock";
import { delay } from "@/lib/utils";
import { memo } from "react";
import { useCallback } from "react";
import { useEffect } from "react";
import { useMemo } from "react";
import { useState } from "react";

import WontonButton from "./WontonButton";
import WontonInput from "./WontonInput";
import useWontonClaimGameMutation from "../hooks/useWontonClaimGameMutation";
import useWontonShopQuery from "../hooks/useWontonShopQuery";
import useWontonStartGameMutation from "../hooks/useWontonStartGameMutation";
import useWontonUserQuery from "../hooks/useWontonUserQuery";

const GAME_DURATION = 15_000;
const EXTRA_DELAY = 3_000;
const MIN_POINT = 70;
const INITIAL_POINT = 100;
const MAX_POINT = 120;

export default memo(function Wonton() {
  const { settings } = useAppContext();
  const query = useWontonUserQuery();
  const shopQuery = useWontonShopQuery();

  const selectedItem = useMemo(
    () =>
      shopQuery.data
        ? shopQuery.data.shopItems.find((item) => item.inUse)
        : null,
    [shopQuery.data]
  );

  const perItem = useMemo(
    () => (selectedItem ? Math.max(...selectedItem.stats.map(Number)) : 0),
    [selectedItem]
  );

  const process = useProcessLock("wonton.game");

  const [countdown, setCountdown] = useState(null);
  const [desiredPoint, setDesiredPoint, dispatchAndSetDesiredPoint] =
    useMirroredState("wonton.game.desired-point", INITIAL_POINT);

  const tickets = query.data?.ticketCount || 0;
  const points = useMemo(
    () =>
      Math.max(
        MIN_POINT,
        Math.min(settings.uncappedPoints ? Infinity : MAX_POINT, desiredPoint)
      ),
    [desiredPoint, settings.uncappedPoints]
  );

  const startGameMutation = useWontonStartGameMutation();
  const claimGameMutation = useWontonClaimGameMutation(points, perItem);

  /** Countdown renderer */
  const countdownRenderer = useCallback(
    ({ seconds }) => <span className="text-xl font-bold">{seconds}</span>,
    []
  );

  /** Reset Desired Points */
  useEffect(() => {
    setDesiredPoint(points);
  }, [process.started]);

  /** Run Process */
  useEffect(() => {
    if (!process.canExecute) {
      return;
    }

    if (tickets < 1 || perItem < 1) {
      process.stop();
      return;
    }

    /** Execute the Process */
    process.execute(async function () {
      try {
        const { bonusRound } = await startGameMutation.mutateAsync();

        /** Wait for countdown */
        const stopTime = GAME_DURATION + Math.floor(Math.random() * 5);

        setCountdown(Date.now() + stopTime);
        await delay(stopTime, true);

        /** Reset countdown */
        setCountdown(null);

        /** Claim Game */
        await claimGameMutation.mutateAsync({ bonusRound });
      } catch {}

      /** Add a little delay */
      await delay(EXTRA_DELAY);

      /** Reset Mutation */
      try {
        await query.refetch();
      } catch {}
    });
  }, [tickets, perItem, process]);

  /** Auto-Game */
  useFarmerAutoProcess(
    "game",
    [query.isLoading, shopQuery.isLoading].every((status) => !status),
    process
  );

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
          <p className="text-center text-neutral-400">
            Minimum Point (+extra points.)
          </p>
        </>
      ) : null}

      {/* Start or Stop Button  */}
      <WontonButton
        color={process.started ? "danger" : "primary"}
        disabled={tickets < 1 || perItem < 1}
        onClick={() => process.dispatchAndToggle(!process.started)}
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
            <p className="text-neutral-400">Loading...</p>
          )}
        </div>
      ) : null}
    </div>
  );
});
