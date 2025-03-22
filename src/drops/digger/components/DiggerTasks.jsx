import useFarmerAutoProcess from "@/hooks/useFarmerAutoProcess";
import useFarmerContext from "@/hooks/useFarmerContext";
import useProcessLock from "@/hooks/useProcessLock";
import { cn, delay } from "@/lib/utils";
import { memo } from "react";
import { useCallback } from "react";
import { useEffect } from "react";
import { useMemo } from "react";
import { useState } from "react";

import useDiggerChannelStatusQuery from "../hooks/useDiggerChannelStatusQuery";
import useDiggerCheckTaskMutation from "../hooks/useDiggerCheckTaskMutation";
import useDiggerChestsQuery from "../hooks/useDiggerChestsQuery";
import useDiggerTasksQuery from "../hooks/useDiggerTasksQuery";
import useDiggerUpdateTaskMutation from "../hooks/useDiggerUpdateTaskMutation";
import useDiggerUserQuery from "../hooks/useDiggerUserQuery";

export default memo(function DiggerTasks() {
  const { joinTelegramLink } = useFarmerContext();
  const process = useProcessLock("digger.tasks");

  const userQuery = useDiggerUserQuery();
  const chestsQuery = useDiggerChestsQuery();
  const tasksQuery = useDiggerTasksQuery();
  const channelStatusQuery = useDiggerChannelStatusQuery();
  const subscribed = channelStatusQuery?.data?.["subscribe_to_channel"];

  /** All Tasks */
  const tasks = useMemo(() => tasksQuery.data || [], [tasksQuery.data]);

  /** Pending Tasks */
  const pendingTasks = useMemo(
    () => tasks.filter((item) => item.status === "progress"),
    [tasks]
  );

  /** Unclaimed Tasks */
  const unclaimedTasks = useMemo(
    () => tasks.filter((item) => item.status === "waiting_reward"),
    [tasks]
  );

  /** Finished Tasks */
  const finishedTasks = useMemo(
    () => tasks.filter((item) => item.status === "completed"),
    [tasks]
  );

  const [currentTask, setCurrentTask] = useState(null);
  const [taskOffset, setTaskOffset] = useState(null);
  const [action, setAction] = useState(null);

  const updateTaskMutation = useDiggerUpdateTaskMutation();
  const checkTaskMutation = useDiggerCheckTaskMutation();

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
          await userQuery.refetch();
          await chestsQuery.refetch();
          await tasksQuery.refetch();
        } catch {}
      };

      if (!action) {
        setAction("start");
        return;
      }
      switch (action) {
        case "start":
          /** Beginning of Start Action */
          setAction("start");
          for (let [index, task] of Object.entries(pendingTasks)) {
            if (process.controller.signal.aborted) return;

            setTaskOffset(index);
            setCurrentTask(task);

            try {
              await updateTaskMutation.mutateAsync(task.type);
            } catch {}

            /** Delay */
            await delay(5_000);
          }

          /** Set Next Action */
          try {
            await tasksQuery.refetch();
          } catch {}

          resetTask();
          setAction("claim");

          return;

        case "claim":
          /** Claim */
          for (let [index, task] of Object.entries(unclaimedTasks)) {
            if (process.controller.signal.aborted) return;
            setTaskOffset(index);
            setCurrentTask(task);
            try {
              await checkTaskMutation.mutateAsync(task.type);
            } catch {}

            /** Delay */
            await delay(5_000);
          }
          break;
      }

      await refetch();
      await resetTask();

      /** Stop */
      return true;
    });
  }, [process, action, joinTelegramLink]);

  /** Auto-Complete Tasks */
  useFarmerAutoProcess("tasks", !tasksQuery.isLoading, process);

  return (
    <div className="flex flex-col gap-2 p-4">
      <div className="flex flex-col">
        {tasksQuery.isPending ? (
          <h4 className="font-bold">Fetching tasks...</h4>
        ) : tasksQuery.isError ? (
          <h4 className="font-bold text-red-500">Failed to fetch tasks...</h4>
        ) : (
          <>
            {/* Tasks Info */}
            <h4 className="font-bold">Total Tasks: {tasks.length}</h4>
            <h4 className="font-bold text-green-500">
              Finished Tasks: {finishedTasks.length}
            </h4>
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
                  "font-bold p-2 rounded-lg",
                  process.started ? "bg-red-500" : "bg-green-500"
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
                    {currentTask["en_text"]}
                  </h5>
                  <p
                    className={cn(
                      "capitalize",
                      {
                        success: "text-green-500",
                        error: "text-red-500",
                      }[
                        action === "start"
                          ? updateTaskMutation.status
                          : checkTaskMutation.status
                      ]
                    )}
                  >
                    {action === "start"
                      ? updateTaskMutation.status
                      : checkTaskMutation.status}
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
