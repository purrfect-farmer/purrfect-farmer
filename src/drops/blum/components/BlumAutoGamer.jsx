import Countdown from "react-countdown";
import toast from "react-hot-toast";
import useFarmerAutoProcess from "@/hooks/useFarmerAutoProcess";
import useProcessLock from "@/hooks/useProcessLock";
import useSocketState from "@/hooks/useSocketState";
import { delay, logNicely, uuid } from "@/lib/utils";
import { memo } from "react";
import { useCallback } from "react";
import { useEffect } from "react";
import { useMemo } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";

import BlumButton from "./BlumButton";
import BlumInput from "./BlumInput";
import useBlumBalanceQuery from "../hooks/useBlumBalanceQuery";
import useBlumClaimGameMutation from "../hooks/useBlumClaimGameMutation";
import useBlumDogsDropEligibilityQuery from "../hooks/useBlumDogsDropEligibilityQuery";
import useBlumStartGameMutation from "../hooks/useBlumStartGameMutation";
import useAppContext from "@/hooks/useAppContext";

const GAME_DURATION = 30_000;
const EXTRA_DELAY = 3_000;
const MIN_POINT = 100;
const INITIAL_POINT = 180;
const MAX_POINT = 280;

export default memo(function BlumAutoGamer({ workerRef }) {
  const { settings } = useAppContext();

  const query = useBlumBalanceQuery();
  const dogsDropEligibilityQuery = useBlumDogsDropEligibilityQuery();
  const client = useQueryClient();

  const process = useProcessLock("blum.game");

  const [countdown, setCountdown] = useState(null);
  const [desiredPoint, setDesiredPoint, dispatchAndSetDesiredPoint] =
    useSocketState("blum.game.desired-point", INITIAL_POINT);

  const tickets = query.data?.playPasses || 0;
  const points = useMemo(
    () =>
      Math.max(
        MIN_POINT,
        Math.min(settings.uncappedPoints ? Infinity : MAX_POINT, desiredPoint)
      ),
    [desiredPoint, settings.uncappedPoints]
  );

  const startGameMutation = useBlumStartGameMutation();
  const claimGameMutation = useBlumClaimGameMutation();

  /** Countdown renderer */
  const countdownRenderer = useCallback(
    ({ seconds }) => <span className="text-xl font-bold">{seconds}</span>,
    []
  );

  const postWorkerMessage = useCallback(
    (data) => {
      return new Promise((resolve) => {
        /** @type {Worker} */
        const worker = workerRef.current;

        const respond = (ev) => {
          worker.removeEventListener("message", respond);
          resolve(ev.data);
        };

        worker.addEventListener("message", respond);
        worker.postMessage(data);
      });
    },
    [workerRef]
  );

  /** Auto-Play Games */
  useFarmerAutoProcess("game", !query.isLoading, process);

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
      /** Stop the process */
      process.stop();
      return;
    }

    (async function () {
      /** Lock Process */
      process.lock();

      try {
        const game = await startGameMutation.mutateAsync();
        const assets = game.assets;

        /** Log */
        logNicely("BLUM GAME", game);

        /** Calculate */
        const finalPoints = points + Math.floor(Math.random() * 20);
        const bombsClicked = Math.floor(Math.random() * 3);
        const freezeClicked = Math.floor(Math.random() * 3);

        const otherAssets = Object.fromEntries(
          Object.entries(assets).filter(
            ([k]) => !["BOMB", "FREEZE", "CLOVER"].includes(k)
          )
        );

        const otherAssetsPercent = Math.floor(Math.random() * 20) + 20;
        const maxOtherAssetsPoints = Math.floor(
          (otherAssetsPercent * finalPoints) / 100
        );

        let otherAssetsPoints = 0;
        let otherAssetsClicks = {};

        for (const name in otherAssets) {
          const probability = otherAssets[name]["probability"];
          const perClick = otherAssets[name]["perClick"];

          const clicks = Math.floor(Math.random() * 100 * probability);
          const totalPoints = clicks * perClick;
          const newOtherAssetsPoints = otherAssetsPoints + totalPoints;

          if (newOtherAssetsPoints <= maxOtherAssetsPoints) {
            otherAssetsPoints = newOtherAssetsPoints;
            otherAssetsClicks[name] = clicks;
          } else {
            otherAssetsClicks[name] = 0;
          }
        }

        const extraCloverPoints = bombsClicked
          ? 10 + Math.floor(Math.random() * 10)
          : 0;

        const cloverPoints =
          finalPoints - otherAssetsPoints + extraCloverPoints;

        const getClicks = (name) => {
          switch (name) {
            case "BOMB":
              return bombsClicked;
            case "FREEZE":
              return freezeClicked;

            case "CLOVER":
              return cloverPoints;

            default:
              return otherAssetsClicks[name];
          }
        };

        /** Wait for countdown */
        setCountdown(Date.now() + GAME_DURATION);
        await delay(GAME_DURATION, true);

        /** Reset countdown */
        setCountdown(null);

        const challenge = await postWorkerMessage({
          id: uuid(),
          method: "proof",
          payload: game.gameId,
        });

        const payload = {
          gameId: game.gameId,
          challenge,
          assetClicks: Object.fromEntries(
            Object.entries(assets).map(([k, v]) => [
              k,
              { clicks: getClicks(k) },
            ])
          ),
          earnedPoints: {
            BP: {
              amount: finalPoints,
            },
          },
        };

        const pack = await postWorkerMessage({
          id: uuid(),
          method: "pack",
          payload,
        });

        /** Log */
        logNicely("BLUM GAME PAYLOAD", payload);

        /** Claim Game */
        await claimGameMutation.mutateAsync(pack.hash);

        /** Show Success */
        toast.success(`+${finalPoints} - Blum Points`);
      } catch {}

      /** Add a little delay */
      await delay(EXTRA_DELAY);

      /** Reset Mutation */
      try {
        await client.refetchQueries({
          queryKey: ["blum", "balance"],
        });
      } catch (e) {
        /** Log it */
        logNicely("BLUM ERROR", e);
      }

      /** Release Lock */
      process.unlock();
    })();
  }, [tickets, process, points, postWorkerMessage]);

  /** Toast Dogs Eligibility */
  useEffect(() => {
    if (dogsDropEligibilityQuery.status === "success") {
      const data = dogsDropEligibilityQuery.data;

      if (data.eligible) {
        toast.success("You are eligible for Blum Dogs Bonus!");
      }
    }
  }, [dogsDropEligibilityQuery.status]);

  return (
    <div className="flex flex-col gap-2">
      {tickets > 0 ? (
        <>
          <BlumInput
            disabled={process.started || tickets < 1}
            value={desiredPoint}
            onInput={(ev) => dispatchAndSetDesiredPoint(ev.target.value)}
            type="number"
            min={MIN_POINT}
            max={MAX_POINT}
            placeholder={`Range (${MIN_POINT} - ${MAX_POINT})`}
          />
          <p className="text-neutral-400">
            Minimum Point (automatically adds extra 1-20 points.)
          </p>
        </>
      ) : null}

      {/* Start or Stop Button  */}
      <BlumButton
        color={process.started ? "danger" : "primary"}
        disabled={tickets < 1}
        onClick={() => process.dispatchAndToggle(!process.started)}
      >
        {process.started ? "Stop" : "Start"}
      </BlumButton>

      {process.started ? (
        <div className="flex flex-col gap-2 p-4 rounded-lg bg-neutral-800">
          {/* Game Start */}
          {startGameMutation.isPending ? (
            <p className="font-bold text-yellow-500">Starting Game...</p>
          ) : startGameMutation.isError ? (
            <p className="font-bold text-red-500">Failed to start game...</p>
          ) : startGameMutation.isSuccess ? (
            <>
              <p className="font-bold text-blum-green-500">
                GAME ID: {startGameMutation.data?.gameId}
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
                  <span className="font-bold text-blum-green-500">
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
