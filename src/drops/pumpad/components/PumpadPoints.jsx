import useFarmerAutoProcess from "@/hooks/useFarmerAutoProcess";
import useFarmerContext from "@/hooks/useFarmerContext";
import useProcessLock from "@/hooks/useProcessLock";
import { cn, delay } from "@/lib/utils";
import { memo } from "react";
import { useCallback } from "react";
import { useEffect } from "react";
import { useMemo } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";

import usePumpadPointTasksQuery from "../hooks/usePumpadPointTasksQuery";
import usePumpadExposureMutation from "../hooks/usePumpadExposureMutation";
import usePumpadCompletePointTaskMutation from "../hooks/usePumpadCompletePointTaskMutation";

export default memo(function PumpadPoints() {
  const { joinTelegramLink } = useFarmerContext();
  const queryClient = useQueryClient();
  const pointsQuery = usePumpadPointTasksQuery();
  const points = useMemo(
    () =>
      pointsQuery.data
        ? pointsQuery.data.tasks
            .map((item) => ({
              ...item,
              source: {
                ["Onclicka"]: "ON_CLICKA",
                ["OpenAD"]: "OPEN_AD",
                ["Monetag"]: "MONETAG",
              }[item["ad_platform"]],
            }))
            .filter(
              (item) =>
                ["ON_CLICKA", "OPEN_AD", "MONETAG"].includes(item["source"]) &&
                item["rest_completions"] > 0
            )
            .sort((a, b) => a["interval_time"] - b["interval_time"])
        : [],
    [pointsQuery.data]
  );

  const process = useProcessLock("pumpad.points");

  const exposureMutation = usePumpadExposureMutation();
  const completePointTaskMutation = usePumpadCompletePointTaskMutation();

  const [currentPoint, setCurrentPoint] = useState(null);
  const [pointOffset, setPointOffset] = useState(null);

  const reset = useCallback(() => {
    setCurrentPoint(null);
    setPointOffset(null);
  }, [setCurrentPoint, setPointOffset]);

  /** Reset */
  useEffect(reset, [process.started, reset]);

  /** Run Process */
  useEffect(() => {
    if (!process.canExecute) {
      return;
    }

    (async function () {
      /** Lock the Process */
      process.lock();

      for (const point of points) {
        for (let i = 0; i < point["rest_completions"]; i++) {
          if (process.controller.signal.aborted) return;
          try {
            setPointOffset(i);
            setCurrentPoint(point);

            /** Reset Mutations */
            exposureMutation.reset();
            completePointTaskMutation.reset();

            await exposureMutation.mutateAsync({
              event: "VIDEO_AD_BEGIN",
              source: point.source,
            });

            await delay(10_000);

            await exposureMutation.mutateAsync({
              event: "VIDEO_AD_END",
              source: point.source,
            });

            /** Complete Task */
            await completePointTaskMutation.mutateAsync(point["task_id"]);

            /** Delay */
            await delay(point["interval_time"] * 1000);
          } catch {
            break;
          }
        }
      }

      /** Refetch Queries */
      try {
        await queryClient.refetchQueries({
          queryKey: ["pumpad"],
        });
      } catch {}

      /** Stop the Process */
      process.stop();
    })();
  }, [process, joinTelegramLink]);

  /** Auto-Complete Points */
  useFarmerAutoProcess("points", !pointsQuery.isLoading, process);

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
              <h4 className="font-bold">
                <span className="text-yellow-500">
                  Running Point {pointOffset !== null ? +pointOffset + 1 : null}
                </span>
              </h4>
              <h5 className="font-bold">{currentPoint["task_name"]}</h5>
              <p
                className={cn(
                  "capitalize",
                  {
                    success: "text-green-500",
                    error: "text-red-500",
                  }[completePointTaskMutation.status]
                )}
              >
                {completePointTaskMutation.status}
              </p>
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
});
