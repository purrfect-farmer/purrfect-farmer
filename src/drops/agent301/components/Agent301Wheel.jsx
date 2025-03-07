import useFarmerAutoProcess from "@/hooks/useFarmerAutoProcess";
import useProcessLock from "@/hooks/useProcessLock";
import { cn, delay } from "@/lib/utils";
import { formatRelative } from "date-fns";
import { memo } from "react";
import { useCallback } from "react";
import { useEffect } from "react";
import { useMemo } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";

import useAgent301CompleteWheelTaskMutation from "../hooks/useAgent301CompleteWheelTaskMutation";
import useAgent301WheelQuery from "../hooks/useAgent301WheelQuery";

export default memo(function Agent301Wheel() {
  const client = useQueryClient();
  const wheelQuery = useAgent301WheelQuery();

  const result = wheelQuery.data?.result;
  const tasks = result?.tasks;

  const daily = tasks?.daily;
  const hourly = tasks?.hour;

  const otherTasks = useMemo(
    () =>
      Object.fromEntries(
        Object.entries(tasks || {}).filter(
          ([k, v]) => !["hour", "daily"].includes(k) && !v
        )
      ),
    [tasks]
  );

  const completeWheelTaskMutation = useAgent301CompleteWheelTaskMutation();

  const process = useProcessLock("agent301.wheel");
  const [taskOffset, setTaskOffset] = useState(null);
  const [action, setAction] = useState(null);

  const reset = useCallback(() => {
    setAction(null);
    setTaskOffset(null);
  }, [setAction, setTaskOffset]);

  /** Reset */
  useEffect(reset, [process.started, reset]);

  /** Run Process */
  useEffect(() => {
    if (!process.canExecute) {
      return;
    }

    process.execute(async function () {
      /** Beginning of Hourly Task */
      if (Date.now() >= hourly["timestamp"] * 1000) {
        setAction("hourly");
        for (let i = hourly["count"]; i < 5; i++) {
          if (process.controller.signal.aborted) return;
          setTaskOffset(i);
          try {
            await completeWheelTaskMutation.mutateAsync({
              type: "hour",
            });
          } catch {}

          /** Delay */
          await delay(15_000);
        }
        reset();
      }

      /** Daily */
      if (Date.now() >= daily * 1000) {
        setAction("daily");
        try {
          await completeWheelTaskMutation.mutateAsync({
            type: "daily",
          });
        } catch {}

        /** Delay */
        await delay(10_000);

        reset();
      }

      /* Other Tasks */
      for (let k of Object.keys(otherTasks)) {
        if (process.controller.signal.aborted) return;

        setAction(k);
        try {
          await completeWheelTaskMutation.mutateAsync({
            type: k,
          });
        } catch {}

        /** Delay */
        await delay(10_000);
      }

      reset();

      try {
        await wheelQuery.refetch();
        await client.refetchQueries({
          queryKey: ["agent301", "balance"],
        });
      } catch {}

      /** Stop */
      return true;
    });
  }, [process]);

  /** Auto-Complete */
  useFarmerAutoProcess("wheel", !wheelQuery.isLoading, process);

  return (
    <div className="p-4">
      {wheelQuery.isPending ? (
        <div className="flex justify-center">Loading...</div>
      ) : // Error
      wheelQuery.isError ? (
        <div className="flex justify-center text-red-500">
          Failed to fetch tasks...
        </div>
      ) : (
        // Success
        <div className="flex flex-col gap-2">
          <div className="flex flex-col p-2 text-black bg-white rounded-lg">
            <p>
              <span className="font-bold text-purple-500">Hourly</span>:{" "}
              <span className="font-bold">{hourly["count"]}</span> /{" "}
              <span className="font-bold">{5}</span>
            </p>
            <p>
              <span className="font-bold text-blue-500">Daily</span>:{" "}
              <span className="font-bold">
                {formatRelative(new Date(daily * 1000), new Date())}
              </span>
            </p>
            <p>
              <span className="font-bold text-green-500">Others</span>:{" "}
              <span className="font-bold">
                {Object.keys(otherTasks).length}
              </span>
            </p>
          </div>
          <button
            onClick={() => process.dispatchAndToggle(!process.started)}
            className={cn(
              "p-2 rounded-lg disabled:opacity-50",
              process.started ? "bg-red-500 text-black" : "bg-white text-black"
            )}
          >
            {process.started ? "Stop" : "Start"}
          </button>

          {process.started && action ? (
            <div className="flex flex-col gap-2 p-4 rounded-lg bg-neutral-800">
              <h4 className="font-bold">
                Current Mode:{" "}
                <span className="text-yellow-500 capitalize">
                  {action} {taskOffset !== null ? +taskOffset + 1 : null}
                </span>
              </h4>
              <p
                className={cn(
                  "capitalize",
                  {
                    success: "text-green-500",
                    error: "text-red-500",
                  }[completeWheelTaskMutation.status]
                )}
              >
                {completeWheelTaskMutation.status}
              </p>
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
});
