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

import MatchQuestButton from "./MatchQuestButton";
import MatchQuestInput from "./MatchQuestInput";
import useMatchQuestClaimGameMutation from "../hooks/useMatchQuestClaimGameMutation";
import useMatchQuestGameRuleQuery from "../hooks/useMatchQuestGameRuleQuery";
import useMatchQuestStartGameMutation from "../hooks/useMatchQuestStartGameMutation";
import useMatchQuestUserQuery from "../hooks/useMatchQuestUserQuery";

const GAME_DURATION = 30_000;
const EXTRA_DELAY = 3_000;
const MIN_POINT = 90;
const INITIAL_POINT = 100;
const MAX_POINT = 120;

export default memo(function MatchQuestAutoGamer() {
  const { settings } = useAppContext();
  const gameRuleQuery = useMatchQuestGameRuleQuery();
  const userQuery = useMatchQuestUserQuery();
  const process = useProcessLock("matchquest.game");

  const [countdown, setCountdown] = useState(null);
  const [desiredPoint, setDesiredPoint, dispatchAndSetDesiredPoint] =
    useMirroredState("matchquest.game.desired-point", INITIAL_POINT);

  const tickets = gameRuleQuery.data?.["game_count"] || 0;
  const points = useMemo(
    () =>
      Math.max(
        MIN_POINT,
        Math.min(settings.uncappedPoints ? Infinity : MAX_POINT, desiredPoint)
      ),
    [desiredPoint, settings.uncappedPoints]
  );

  const startGameMutation = useMatchQuestStartGameMutation();
  const claimGameMutation = useMatchQuestClaimGameMutation(points);

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

    if (tickets < 1) {
      process.stop();
      return;
    }

    /** Execute the Process */
    process.execute(async function () {
      try {
        const game = await startGameMutation.mutateAsync();

        /** Wait for countdown */

        setCountdown(Date.now() + GAME_DURATION);
        await delay(GAME_DURATION, true);

        /** Reset countdown */
        setCountdown(null);

        /** Claim Game */
        await claimGameMutation.mutateAsync(game["game_id"]);
      } catch {}

      /** Add a little delay */
      await delay(EXTRA_DELAY);

      /** Reset Mutation */
      try {
        await gameRuleQuery.refetch();
        await userQuery.refetch();
      } catch {}
    });
  }, [tickets, process]);

  /** Auto-Game */
  useFarmerAutoProcess("game", !gameRuleQuery.isLoading, process);

  return (
    <div className="flex flex-col gap-2">
      {tickets > 0 ? (
        <>
          <MatchQuestInput
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
      <MatchQuestButton
        color={process.started ? "danger" : "primary"}
        disabled={tickets < 1}
        onClick={() => process.dispatchAndToggle(!process.started)}
      >
        {process.started ? "Stop" : "Start"}
      </MatchQuestButton>

      {process.started ? (
        <div className="flex flex-col gap-2 p-4 text-white rounded-lg bg-neutral-900">
          {/* Game Start */}
          {startGameMutation.isPending ? (
            <p className="font-bold text-yellow-500">Starting Game...</p>
          ) : startGameMutation.isError ? (
            <p className="font-bold text-red-500">Failed to start game...</p>
          ) : startGameMutation.isSuccess ? (
            <>
              <p className="font-bold text-orange-500">
                GAME ID: {startGameMutation.data?.["game_id"]}
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
                  <span className="text-red-500">
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
            <p className="text-neutral-400">Loading...</p>
          )}
        </div>
      ) : null}
    </div>
  );
});
