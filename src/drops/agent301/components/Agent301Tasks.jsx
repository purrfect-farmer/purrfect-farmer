import useFarmerAutoProcess from "@/hooks/useFarmerAutoProcess";
import useProcessLock from "@/hooks/useProcessLock";
import { cn, delay } from "@/lib/utils";
import { memo } from "react";
import { useCallback } from "react";
import { useEffect } from "react";
import { useMemo } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";

import useAgent301CompleteTaskMutation from "../hooks/useAgent301CompleteTaskMutation";
import useAgent301TasksQuery from "../hooks/useAgent301TasksQuery";

export default memo(function Agent301Tasks() {
  const client = useQueryClient();
  const tasksQuery = useAgent301TasksQuery();

  const tasks = useMemo(
    () => tasksQuery.data?.result?.data || [],
    [tasksQuery.data]
  );

  /** Daily Tasks */
  const dailyTasks = useMemo(
    () =>
      tasks.filter(
        (item) => item.category === "daily" && item.type !== "video"
      ),
    [tasks]
  );

  const claimedDailyTasks = useMemo(
    () => dailyTasks.filter((item) => item["is_claimed"]),
    [dailyTasks]
  );

  const unClaimedDailyTasks = useMemo(
    () => dailyTasks.filter((item) => !item["is_claimed"]),
    [dailyTasks]
  );

  /** Partner Tasks */
  const partnerTasks = useMemo(
    () => tasks.filter((item) => item.category === "partners"),
    [tasks]
  );

  const claimedPartnerTasks = useMemo(
    () => partnerTasks.filter((item) => item["is_claimed"]),
    [partnerTasks]
  );

  const unClaimedPartnerTasks = useMemo(
    () => partnerTasks.filter((item) => !item["is_claimed"]),
    [partnerTasks]
  );

  /** Video Task */
  const videoTask = useMemo(
    () => tasks.find((item) => item.type === "video"),
    [tasks]
  );

  /** In game */
  const inGameTasks = useMemo(
    () =>
      tasks.filter(
        (item) => item.category === "in-game" && item.type !== "video"
      ),
    [tasks]
  );

  const claimedInGameTasks = useMemo(
    () => inGameTasks.filter((item) => item["is_claimed"]),
    [inGameTasks]
  );

  const unClaimedInGameTasks = useMemo(
    () => inGameTasks.filter((item) => !item["is_claimed"]),
    [inGameTasks]
  );

  const completeTaskMutation = useAgent301CompleteTaskMutation();

  const process = useProcessLock("agent301.tasks");
  const [currentTask, setCurrentTask] = useState(null);
  const [taskOffset, setTaskOffset] = useState(null);
  const [action, setAction] = useState(null);

  const reset = useCallback(() => {
    setAction(null);
    setCurrentTask(null);
    setTaskOffset(null);
  }, [setAction, setCurrentTask, setTaskOffset]);

  /** Reset */
  useEffect(reset, [process.started, reset]);

  /** Run Process */
  useEffect(() => {
    if (!process.canExecute) {
      return;
    }

    /** Execute the Process */
    process.execute(async function () {
      /** Daily */
      setAction("daily");
      for (let [index, task] of Object.entries(unClaimedDailyTasks)) {
        if (process.controller.signal.aborted) return;

        setTaskOffset(index);
        setCurrentTask(task);
        try {
          await completeTaskMutation.mutateAsync({
            type: task["type"],
          });
        } catch {}

        /** Delay */
        await delay(10_000);
      }

      /** Beginning of Video Task */
      setAction("video");
      for (let i = videoTask["count"]; i < videoTask["max_count"]; i++) {
        if (process.controller.signal.aborted) return;

        setTaskOffset(i);
        setCurrentTask(videoTask);
        try {
          await completeTaskMutation.mutateAsync({
            type: videoTask["type"],
          });
        } catch {}

        /** Delay */
        await delay(15_000);
      }

      /** Reset */
      reset();

      /** Partners */
      setAction("partners");
      for (let [index, task] of Object.entries(unClaimedPartnerTasks)) {
        if (process.controller.signal.aborted) return;

        setTaskOffset(index);
        setCurrentTask(task);
        try {
          await completeTaskMutation.mutateAsync({
            type: task["type"],
          });
        } catch {}

        /** Delay */
        await delay(10_000);
      }

      /** Reset */
      reset();

      /** In Game */
      setAction("in-game");
      for (let [index, task] of Object.entries(unClaimedInGameTasks)) {
        if (process.controller.signal.aborted) return;

        setTaskOffset(index);
        setCurrentTask(task);
        try {
          await completeTaskMutation.mutateAsync({
            type: task["type"],
          });
        } catch {}

        /** Delay */
        await delay(10_000);
      }

      try {
        await client.refetchQueries({
          queryKey: ["agent301"],
        });
      } catch {}

      /** Reset */
      reset();

      /** Stop */
      return true;
    });
  }, [process]);

  /** Auto-Complete */
  useFarmerAutoProcess("tasks", !tasksQuery.isLoading, process);

  return (
    <div className="p-4">
      {tasksQuery.isPending ? (
        <div className="flex justify-center">Loading...</div>
      ) : // Error
      tasksQuery.isError ? (
        <div className="flex justify-center text-red-500">
          Failed to fetch tasks...
        </div>
      ) : (
        // Success
        <div className="flex flex-col gap-2">
          <div className="flex flex-col p-2 text-black bg-white rounded-lg">
            <p>
              <span className="font-bold text-orange-700">Daily Tasks</span>:{" "}
              <span className="font-bold">{claimedDailyTasks.length}</span> /{" "}
              <span className="font-bold">{dailyTasks.length}</span>
            </p>
            <p>
              <span className="font-bold text-purple-500">Video Tasks</span>:{" "}
              <span className="font-bold">{videoTask["count"]}</span> /{" "}
              <span className="font-bold">{videoTask["max_count"]}</span>
            </p>
            <p>
              <span className="font-bold text-blue-500">Partner Tasks</span>:{" "}
              <span className="font-bold">{claimedPartnerTasks.length}</span> /{" "}
              <span className="font-bold">{partnerTasks.length}</span>
            </p>
            <p>
              <span className="font-bold text-green-800">In-Game Tasks</span>:{" "}
              <span className="font-bold">{claimedInGameTasks.length}</span> /{" "}
              <span className="font-bold">{inGameTasks.length}</span>
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

          {process.started && currentTask ? (
            <div className="flex flex-col gap-2 p-4 rounded-lg bg-neutral-800">
              <h4 className="font-bold capitalize">
                Current Mode:{" "}
                <span
                  className={
                    action === "video" ? "text-yellow-500" : "text-green-500"
                  }
                >
                  {action} Tasks {taskOffset !== null ? +taskOffset + 1 : null}
                </span>
              </h4>
              <h5 className="font-bold">{currentTask.title}</h5>
              <p
                className={cn(
                  "capitalize",
                  {
                    success: "text-green-500",
                    error: "text-red-500",
                  }[completeTaskMutation.status]
                )}
              >
                {completeTaskMutation.status}
              </p>
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
});
