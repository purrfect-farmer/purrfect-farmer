import useFarmerAutoProcess from "@/hooks/useFarmerAutoProcess";
import useFarmerContext from "@/hooks/useFarmerContext";
import useProcessLock from "@/hooks/useProcessLock";
import { canJoinTelegramLink, cn, delay } from "@/lib/utils";
import { memo } from "react";
import { useCallback } from "react";
import { useEffect } from "react";
import { useMemo } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";

import useBattleBullsClaimTaskMutation from "../hooks/useBattleBullsClaimTaskMutation";
import useBattleBullsTasksQuery from "../hooks/useBattleBullsTasksQuery";
import useBattleBullsUserQuery from "../hooks/useBattleBullsUserQuery";

export default memo(function BattleBullsTasks() {
  const { joinTelegramLink } = useFarmerContext();
  const queryClient = useQueryClient();
  const process = useProcessLock("battle-bulls.tasks");

  const userQuery = useBattleBullsUserQuery();
  const tasksQuery = useBattleBullsTasksQuery();

  const blockchain = userQuery.data?.blockchainId;

  const tasks = useMemo(
    () =>
      tasksQuery.data?.filter(
        (item) =>
          !["streak_days"].includes(item.id) &&
          /** Validate Friends */
          (item.friendsMinimalCount === null ||
            item.friendsCount >= item.friendsMinimalCount) &&
          /** Validate Blockchain */
          (item.id !== "select_blockchain" || blockchain !== null)
      ) || [],
    [tasksQuery.data, blockchain]
  );

  const completedTasks = useMemo(
    () => tasks.filter((item) => item["completedAt"]),
    [tasks]
  );

  const uncompletedTasks = useMemo(
    () => tasks.filter((item) => !item["completedAt"]),
    [tasks]
  );

  const [currentTask, setCurrentTask] = useState(null);
  const [taskOffset, setTaskOffset] = useState(null);

  const claimTaskMutation = useBattleBullsClaimTaskMutation();

  const reset = useCallback(() => {
    setCurrentTask(null);
    setTaskOffset(null);
  }, [setCurrentTask, setTaskOffset]);

  /** Reset */
  useEffect(reset, [process.started, reset]);

  /** Run Process */
  useEffect(() => {
    if (!process.canExecute) {
      return;
    }

    /** Execute the Process */
    process.execute(async function () {
      for (let [index, task] of Object.entries(uncompletedTasks)) {
        if (process.controller.signal.aborted) return;
        setTaskOffset(index);
        setCurrentTask(task);
        try {
          if (canJoinTelegramLink(task.link)) {
            await joinTelegramLink(task.link);
          }
          const result = await claimTaskMutation.mutateAsync(task.id);
          const user = result.user;
          const {
            taskId,
            competedAt: completedAt,
            ...taskUpdate
          } = result.completedTask;

          /** Update User */
          queryClient.setQueryData(["battle-bulls", "user"], (prev) => ({
            ...prev,
            ...user,
          }));

          /** Update Tasks */
          queryClient.setQueryData(["battle-bulls", "tasks"], (prev) =>
            prev.map((item) =>
              item.id === taskId
                ? { ...item, ...taskUpdate, completedAt }
                : item
            )
          );
        } catch {}

        /** Delay */
        await delay(5_000);
      }

      /** Stop */
      return true;
    });
  }, [process, joinTelegramLink]);

  /** Auto-Complete Tasks */
  useFarmerAutoProcess("tasks", process, [tasksQuery.isLoading === false]);

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
          <div className="flex flex-col p-2 text-blue-900 bg-blue-100 rounded-lg">
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
              process.started ? "bg-red-500" : "bg-blue-500"
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
              <h5 className="font-bold">{currentTask.id.toUpperCase()}</h5>
              <p
                className={cn(
                  "capitalize",
                  {
                    success: "text-green-500",
                    error: "text-red-500",
                  }[claimTaskMutation.status]
                )}
              >
                {claimTaskMutation.status}
              </p>
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
});
