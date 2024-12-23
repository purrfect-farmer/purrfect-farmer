import useFarmerAutoProcess from "@/hooks/useFarmerAutoProcess";
import useFarmerContext from "@/hooks/useFarmerContext";
import useProcessLock from "@/hooks/useProcessLock";
import { canJoinTelegramLink, cn, delay, logNicely } from "@/lib/utils";
import { memo } from "react";
import { useCallback } from "react";
import { useEffect } from "react";
import { useMemo } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";

import useDreamCoinClaimDailyFreeRewardMutation from "../hooks/useDreamCoinClaimDailyFreeRewardMutation";
import useDreamCoinClaimFreeRewardMutation from "../hooks/useDreamCoinClaimFreeRewardMutation";
import useDreamCoinFreeRewardQuery from "../hooks/useDreamCoinFreeRewardQuery";

export default memo(function DreamCoinRewards() {
  const { joinTelegramLink } = useFarmerContext();
  const process = useProcessLock("dreamcoin.rewards");
  const queryClient = useQueryClient();

  const rewardsQuery = useDreamCoinFreeRewardQuery();

  const tasks = useMemo(
    () =>
      rewardsQuery.data
        ? Object.entries(rewardsQuery.data).reduce(
            (result, [taskGroup, tasks]) =>
              result.concat(tasks.map((item) => ({ ...item, taskGroup }))),
            []
          )
        : [],
    [rewardsQuery.data]
  );

  const completedTasks = useMemo(
    () => tasks.filter((item) => item.isCompleted),
    [tasks]
  );

  const uncompletedTasks = useMemo(
    () => tasks.filter((item) => !item.isCompleted),
    [tasks]
  );

  const claimDailyTaskMutation = useDreamCoinClaimDailyFreeRewardMutation();
  const claimFreeRewardMutation = useDreamCoinClaimFreeRewardMutation();

  const [currentTask, setCurrentTask] = useState(null);
  const [taskOffset, setTaskOffset] = useState(null);

  const reset = useCallback(() => {
    setCurrentTask(null);
    setTaskOffset(null);
  }, [setCurrentTask, setTaskOffset]);

  /** LogIt */
  useEffect(() => {
    logNicely("DREAMCOIN TASKS", tasks);
  }, [tasks]);

  /** Reset */
  useEffect(reset, [process.started, reset]);

  /** Run Process */
  useEffect(() => {
    if (!process.canExecute) {
      return;
    }

    (async function () {
      /** Lock the process */
      process.lock();

      for (let [index, task] of Object.entries(uncompletedTasks)) {
        if (process.controller.signal.aborted) return;
        setTaskOffset(index);
        setCurrentTask(task);
        try {
          if (canJoinTelegramLink(task.actionUrl)) {
            await joinTelegramLink(task.actionUrl);
          }

          if (task.taskGroup === "dailyFreeRewards") {
            await claimDailyTaskMutation.mutateAsync(task.id);
          } else {
            await claimFreeRewardMutation.mutateAsync(task.id);
          }
        } catch (error) {}

        /** Delay */
        await delay(5_000);
      }

      try {
        await queryClient.refetchQueries({
          queryKey: ["dreamcoin"],
        });
      } catch {}

      process.stop();
    })();
  }, [process, joinTelegramLink]);

  /** Auto-Complete Quests */
  useFarmerAutoProcess("rewards", !rewardsQuery.isLoading, process);

  return (
    <div className="p-4">
      {rewardsQuery.isPending ? (
        <div className="flex justify-center">Loading...</div>
      ) : // Error
      rewardsQuery.isError ? (
        <div className="flex justify-center text-red-500">
          Failed to fetch tasks...
        </div>
      ) : (
        // Success
        <div className="flex flex-col gap-2">
          <div className="flex flex-col p-2 text-pink-900 bg-pink-100 rounded-lg">
            <p>
              <span className="font-bold text-orange-700">Tasks</span>:{" "}
              <span className="font-bold">{completedTasks.length}</span> /{" "}
              <span className="font-bold">{tasks.length}</span>
            </p>
          </div>
          <button
            onClick={() => process.dispatchAndToggle(!process.started)}
            className={cn(
              "p-2 text-white rounded-lg disabled:opacity-50",
              process.started ? "bg-red-500" : "bg-pink-500"
            )}
          >
            {process.started ? "Stop" : "Start"}
          </button>

          {process.started && currentTask ? (
            <div className="flex flex-col gap-2 p-4 text-white rounded-lg bg-neutral-900">
              <h4 className="font-bold">
                <span className="text-yellow-500">
                  Running Task {taskOffset !== null ? +taskOffset + 1 : null}
                </span>
              </h4>
              <h5 className="font-bold">
                {currentTask.description || currentTask.type}
              </h5>
              <p
                className={cn(
                  "capitalize",
                  {
                    success: "text-green-500",
                    error: "text-red-500",
                  }[
                    currentTask.taskGroup === "dailyFreeRewards"
                      ? claimDailyTaskMutation.status
                      : claimFreeRewardMutation.status
                  ]
                )}
              >
                {currentTask.taskGroup === "dailyFreeRewards"
                  ? claimDailyTaskMutation.status
                  : claimFreeRewardMutation.status}
              </p>
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
});
