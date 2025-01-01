import useFarmerAutoProcess from "@/hooks/useFarmerAutoProcess";
import useProcessLock from "@/hooks/useProcessLock";
import { cn, delay, delayForSeconds } from "@/lib/utils";
import { memo } from "react";
import { useCallback } from "react";
import { useEffect } from "react";
import { useMemo } from "react";
import { useState } from "react";

import usePumpadPointTasksQuery from "../hooks/usePumpadPointTasksQuery";
import usePumpadExposureMutation from "../hooks/usePumpadExposureMutation";
import usePumpadCompletePointTaskMutation from "../hooks/usePumpadCompletePointTaskMutation";
import usePumpadRemainingAdsQuery from "../hooks/usePumpadRemainingAdsQuery";
import usePumpadAdIncrementMutation from "../hooks/usePumpadAdIncrementMutation";

export default memo(function PumpadPoints() {
  const pointsQuery = usePumpadPointTasksQuery();
  const remainingAdsQuery = usePumpadRemainingAdsQuery();
  const totalAdsCount = remainingAdsQuery.data?.["total_count"] || 0;
  const remainingAdsCount = remainingAdsQuery.data?.["remaining_count"] || 0;
  const points = useMemo(
    () =>
      [
        {
          ["task_name"]: "ADS",
          ["source"]: "ADSGRAM",
          ["interval_time"]: 30,
          ["max_completions"]: totalAdsCount,
          ["rest_completions"]: remainingAdsCount,
        },
      ]
        .concat(
          pointsQuery.data
            ? pointsQuery.data.tasks.map((item) => ({
                ...item,
                source: {
                  ["Onclicka"]: "ON_CLICKA",
                  ["OpenAD"]: "OPEN_AD",
                  ["Monetag"]: "MONETAG",
                }[item["ad_platform"]],
              }))
            : []
        )
        .filter((item) => item["source"] && item["rest_completions"] > 0)
        .sort((a, b) => a["interval_time"] - b["interval_time"]),
    [totalAdsCount, remainingAdsCount, pointsQuery.data]
  );

  const process = useProcessLock("pumpad.points");

  const exposureMutation = usePumpadExposureMutation();
  const completePointTaskMutation = usePumpadCompletePointTaskMutation();
  const adIncrementMutation = usePumpadAdIncrementMutation();

  const [currentPoint, setCurrentPoint] = useState(null);

  const mutationStatus =
    currentPoint?.["source"] === "ADSGRAM"
      ? adIncrementMutation.status
      : completePointTaskMutation.status;

  const reset = useCallback(() => {
    setCurrentPoint(null);
  }, [setCurrentPoint]);

  /** Reset */
  useEffect(reset, [process.started, reset]);

  /** Run Process */
  useEffect(() => {
    if (!process.canExecute) {
      return;
    }

    if (points.length < 1) {
      /** Stop the process */
      process.stop();
      return;
    }

    (async function () {
      /** Lock the Process */
      process.lock();

      /** Pick Point */
      const point = points[0];

      /** Set Point */
      setCurrentPoint(point);

      try {
        /** Reset Mutations */
        exposureMutation.reset();
        adIncrementMutation.reset();
        completePointTaskMutation.reset();

        if (point["source"] === "ADSGRAM") {
          /** Exposure */
          await exposureMutation.mutateAsync({
            event: "VIDEO_AD_BEGIN",
            page: "GET_RAFFLE_TICKETS",
            source: "ADSGRAM",
          });

          /** Increase AD */
          await adIncrementMutation.mutateAsync();

          /** Delay Ad */
          await delay(20_000);
        } else {
          /** Exposure */
          await exposureMutation.mutateAsync({
            event: "VIDEO_AD_BEGIN",
            page: "MEMBER_PAGE",
            source: point.source,
          });

          /** Delay Ad */
          await delay(10_000);

          /** Exposure */
          await exposureMutation.mutateAsync({
            event: "VIDEO_AD_END",
            page: "MEMBER_PAGE",
            source: point.source,
          });

          /** Complete Task */
          await completePointTaskMutation.mutateAsync(point["task_id"]);
        }
      } catch {}

      /** CoolDown */
      await delayForSeconds(point["interval_time"]);

      /** Refetch Queries */
      try {
        await remainingAdsQuery.refetch();
        await pointsQuery.refetch();
      } catch {}

      /** Unlock the Process */
      process.unlock();
    })();
  }, [process]);

  /** Auto-Complete Points */
  useFarmerAutoProcess(
    "points",
    [remainingAdsQuery.isLoading, pointsQuery.isLoading].every(
      (status) => status === false
    ),
    process
  );

  return (
    <div className="p-4">
      {pointsQuery.isPending ? (
        <div className="flex justify-center">Loading...</div>
      ) : // Error
      pointsQuery.isError ? (
        <div className="flex justify-center text-red-500">
          Failed to fetch points...
        </div>
      ) : (
        // Success
        <div className="flex flex-col gap-2">
          <div className="flex flex-col p-2 rounded-lg bg-neutral-100 dark:bg-neutral-700">
            <p>
              <span className="font-bold text-orange-700 dark:text-orange-500">
                Points
              </span>
              : <span className="font-bold">{points.length}</span>
            </p>
          </div>
          <button
            onClick={() => process.dispatchAndToggle(!process.started)}
            className={cn(
              "p-2 rounded-lg disabled:opacity-50",
              process.started
                ? "bg-red-500 text-black"
                : "bg-pumpad-green-500 text-black"
            )}
          >
            {process.started ? "Stop" : "Start"}
          </button>

          {process.started && currentPoint ? (
            <div className="flex flex-col gap-2 p-4 text-white rounded-lg bg-neutral-900">
              <h5 className="font-bold text-purple-500">
                {currentPoint["task_name"]}{" "}
                {currentPoint["max_completions"] -
                  currentPoint["rest_completions"]}
                /{currentPoint["max_completions"]}
              </h5>
              <p
                className={cn(
                  "capitalize",
                  {
                    success: "text-green-500",
                    error: "text-red-500",
                  }[mutationStatus]
                )}
              >
                {mutationStatus}{" "}
                {mutationStatus === "success" ? "(Delaying...)" : null}
              </p>
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
});
