import useFarmerAutoProcess from "@/hooks/useFarmerAutoProcess";
import useFarmerContext from "@/hooks/useFarmerContext";
import useProcessLock from "@/hooks/useProcessLock";
import { canJoinTelegramLink, cn, customLogger, delay } from "@/lib/utils";
import { memo } from "react";
import { useCallback } from "react";
import { useEffect } from "react";
import { useMemo } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";

import useSpaceAdventureClaimTaskMutation from "../hooks/useSpaceAdventureClaimTaskMutation";
import useSpaceAdventureStartTaskMutation from "../hooks/useSpaceAdventureStartTaskMutation";
import useSpaceAdventureUserQuery from "../hooks/useSpaceAdventureUserQuery";
import {
  TASK_CATEGORIES,
  useSpaceAdventureAllTasksQueries,
} from "../hooks/useSpaceAdventureTasksQuery";

export default memo(function SpaceAdventureTasks() {
  const { joinTelegramLink } = useFarmerContext();
  const process = useProcessLock("space-adventure.tasks");

  const queryClient = useQueryClient();
  const userQuery = useSpaceAdventureUserQuery();
  const allTasksQuery = useSpaceAdventureAllTasksQueries();

  /** All Tasks */
  const allTasks = useMemo(
    () =>
      allTasksQuery.isSuccess
        ? allTasksQuery.data.reduce(
            (result, current, index) =>
              result.concat(
                current.listActive.map((item) => ({
                  ...item,
                  ["task_category"]: Object.keys(TASK_CATEGORIES)[index],
                }))
              ),
            []
          )
        : [],
    [allTasksQuery.data]
  );

  /** Tasks */
  const tasks = useMemo(
    () =>
      allTasks.filter((item) => item.title.includes("Watch 3 ads") === false),
    [allTasks]
  );

  /** Pending Tasks */
  const pendingTasks = useMemo(
    () => tasks.filter((item) => item.status === "not_completed"),
    [tasks]
  );

  /** Unclaimed Tasks */
  const unclaimedTasks = useMemo(
    () => tasks.filter((item) => item.status === "proccess"),
    [tasks]
  );

  const [currentTask, setCurrentTask] = useState(null);
  const [taskOffset, setTaskOffset] = useState(null);
  const [action, setAction] = useState(null);

  const startTaskMutation = useSpaceAdventureStartTaskMutation();
  const claimTaskMutation = useSpaceAdventureClaimTaskMutation();

  /** Reset Task */
  const resetTask = useCallback(() => {
    setCurrentTask(null);
    setTaskOffset(null);
  }, [setCurrentTask, setTaskOffset]);

  /** Reset */
  const reset = useCallback(() => {
    resetTask();
    setAction(null);
  }, [resetTask, setAction]);

  /** Log Tasks */
  useEffect(() => {
    customLogger("SPACE ADVENTURE TASKS", tasks);
    customLogger("SPACE ADVENTURE PENDING TASKS", pendingTasks);
    customLogger("SPACE ADVENTURE UNCLAIMED TASKS", unclaimedTasks);
  }, [tasks, pendingTasks, unclaimedTasks]);

  /** Reset */
  useEffect(reset, [process.started, reset]);

  /** Run Tasks */
  useEffect(() => {
    if (!process.canExecute) {
      return;
    }

    /** Execute the process */
    process.execute(async function () {
      const refetch = async () => {
        try {
          await queryClient.refetchQueries({
            queryKey: ["space-adventure"],
          });
        } catch (e) {
          console.error(e);
        }
      };

      /** Beginning of Start Action */
      setAction("start");
      for (let [index, task] of Object.entries(pendingTasks)) {
        if (process.controller.signal.aborted) return;

        setTaskOffset(index);
        setCurrentTask(task);

        if (task.type === "subscribe" && canJoinTelegramLink(task.link)) {
          await joinTelegramLink(task.link);
        }

        try {
          await startTaskMutation.mutateAsync(task.id);
        } catch (e) {
          console.error(e);
        }

        /** Delay */
        await delay(1000, true);
      }

      /** Claim */
      setAction("claim");
      for (let [index, task] of Object.entries(pendingTasks)) {
        if (process.controller.signal.aborted) return;
        setTaskOffset(index);
        setCurrentTask(task);
        try {
          await claimTaskMutation.mutateAsync(task.id);
        } catch (e) {
          console.error(e);
        }

        /** Delay */
        await delay(1000, true);
      }

      await refetch();
      await resetTask();

      /** Stop */
      return true;
    });
  }, [process, joinTelegramLink]);

  /** Auto-Complete Tasks */
  useFarmerAutoProcess("tasks", process, [allTasksQuery.isLoading === false]);

  return (
    <div className="flex flex-col gap-2 p-4">
      <div className="flex flex-col">
        {allTasksQuery.isPending ? (
          <h4 className="font-bold">Fetching tasks...</h4>
        ) : allTasksQuery.isError ? (
          <h4 className="font-bold text-red-500">Failed to fetch tasks...</h4>
        ) : (
          <>
            {/* Tasks Info */}
            <h4 className="font-bold">Total Tasks: {tasks.length}</h4>
            <h4 className="font-bold text-yellow-500">
              Pending Tasks: {pendingTasks.length}
            </h4>

            <h4 className="font-bold text-purple-500">
              Unclaimed Tasks: {unclaimedTasks.length}
            </h4>

            <div className="flex flex-col gap-2 py-2">
              {/* Start Button */}
              <button
                className={cn(
                  "font-bold p-2 rounded-lg text-white",
                  process.started ? "bg-red-500" : "bg-purple-500"
                )}
                onClick={() => process.dispatchAndToggle(!process.started)}
                disabled={
                  pendingTasks.length === 0 && unclaimedTasks.length === 0
                }
              >
                {process.started ? "Stop" : "Start"}
              </button>

              {process.started && currentTask ? (
                <div className="flex flex-col gap-2 p-4 text-white rounded-lg bg-black">
                  <h4 className="font-bold">
                    Current Mode:{" "}
                    <span
                      className={
                        action === "start"
                          ? "text-yellow-500"
                          : "text-green-500"
                      }
                    >
                      {action === "start" ? "Starting Task" : "Claiming Task"}{" "}
                      {+taskOffset + 1}
                    </span>
                  </h4>
                  <h5 className="font-bold text-purple-500">
                    {currentTask.title}
                  </h5>
                  <p
                    className={cn(
                      "capitalize",
                      {
                        success: "text-green-500",
                        error: "text-red-500",
                      }[
                        action === "start"
                          ? startTaskMutation.status
                          : claimTaskMutation.status
                      ]
                    )}
                  >
                    {action === "start"
                      ? startTaskMutation.status
                      : claimTaskMutation.status}
                  </p>
                </div>
              ) : null}
            </div>
          </>
        )}
      </div>
    </div>
  );
});
