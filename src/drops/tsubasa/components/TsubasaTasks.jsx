import useFarmerAutoProcess from "@/hooks/useFarmerAutoProcess";
import useFarmerContext from "@/hooks/useFarmerContext";
import useProcessLock from "@/hooks/useProcessLock";
import { canJoinTelegramLink, cn, delay, logNicely } from "@/lib/utils";
import { memo } from "react";
import { useCallback } from "react";
import { useEffect } from "react";
import { useMemo } from "react";
import { useState } from "react";

import useTsubasaClaimTaskMutation from "../hooks/useTsubasaClaimTaskMutation";
import useTsubasaExecuteTaskMutation from "../hooks/useTsubasaExecuteTaskMutation";

export default memo(function TsubasaTasks() {
  const { authQuery, joinTelegramLink } = useFarmerContext();

  /** All Tasks */
  const allTasks = useMemo(() => authQuery.data["task_info"], [authQuery.data]);

  /** Available Tasks */
  const availableTasks = useMemo(
    () =>
      allTasks.filter(
        (task) =>
          task["event_type"] === 1 &&
          ["FRIENDS", "WALLET"].includes(task["title"].toUpperCase()) === false
      ),
    [allTasks]
  );

  /** Pending Tasks */
  const pendingTasks = useMemo(
    () => availableTasks.filter((item) => item["status"] === 0),
    [availableTasks]
  );

  /** Unclaimed Tasks */
  const unclaimedTasks = useMemo(
    () => availableTasks.filter((item) => item["status"] === 1),
    [availableTasks]
  );

  /** Finished Tasks */
  const finishedTasks = useMemo(
    () => availableTasks.filter((item) => item["status"] === 2),
    [availableTasks]
  );

  const process = useProcessLock("tsubasa.tasks");

  const [currentTask, setCurrentTask] = useState(null);
  const [taskOffset, setTaskOffset] = useState(null);
  const [action, setAction] = useState(null);

  const startTaskMutation = useTsubasaExecuteTaskMutation();
  const claimTaskMutation = useTsubasaClaimTaskMutation();

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

  /** Log All Tasks */
  useEffect(() => {
    logNicely("TSUBASA ALL TASKS", allTasks);
    logNicely("TSUBASA AVAILABLE TASKS", availableTasks);
    logNicely("TSUBASA PENDING TASKS", pendingTasks);
    logNicely("TSUBASA UNCLAIMED TASKS", unclaimedTasks);
    logNicely("TSUBASA FINISHED TASKS", finishedTasks);
  }, [allTasks, availableTasks, pendingTasks, unclaimedTasks, finishedTasks]);

  /** Reset */
  useEffect(reset, [process.started, reset]);

  /** Run Tasks */
  useEffect(() => {
    if (!process.canExecute) {
      return;
    }

    (async function () {
      /** Lock the process */
      process.lock();

      if (!action) {
        setAction("start");
        return process.unlock();
      }
      switch (action) {
        case "start":
          /** Beginning of Start Action */
          setAction("start");
          for (let [index, task] of Object.entries(pendingTasks)) {
            if (process.controller.signal.aborted) return;

            setTaskOffset(index);
            setCurrentTask(task);

            if (task.url) {
              if (canJoinTelegramLink(task.url)) {
                await joinTelegramLink(task.url);
              }
            }

            try {
              await startTaskMutation.mutateAsync(task.id);
            } catch {}

            /** Delay */
            await delay(5_000);
          }

          // Set Next Action
          resetTask();
          setAction("claim");

          return process.unlock();

        case "claim":
          /** Claim */
          for (let [index, task] of Object.entries(unclaimedTasks)) {
            if (process.controller.signal.aborted) return;
            setTaskOffset(index);
            setCurrentTask(task);
            try {
              await claimTaskMutation.mutateAsync(task.id);
            } catch {}

            /** Delay */
            await delay(5_000);
          }
          break;
      }

      resetTask();
      process.stop();
    })();
  }, [process, action, joinTelegramLink]);

  /** Auto-Complete Tasks */
  useFarmerAutoProcess("tasks", true, process);

  return (
    <>
      <div className="flex flex-col p-4">
        <>
          {/* Tasks Info */}
          <h4 className="font-bold">
            Total Tasks: {availableTasks.length} / {allTasks.length}
          </h4>
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
                "px-4 py-2",
                "rounded-lg",
                "disabled:opacity-50",
                process.started
                  ? "bg-red-500 text-white"
                  : "bg-indigo-500 text-white"
              )}
              onClick={() => process.dispatchAndToggle(!process.started)}
              disabled={
                pendingTasks.length === 0 && unclaimedTasks.length === 0
              }
            >
              {process.started ? "Stop" : "Start"}
            </button>

            {process.started && currentTask ? (
              <div className="flex flex-col gap-2 p-4 text-white rounded-lg bg-neutral-900">
                <h4 className="font-bold">
                  Current Mode:{" "}
                  <span
                    className={
                      action === "start" ? "text-yellow-500" : "text-green-500"
                    }
                  >
                    {action === "start" ? "Starting Task" : "Claiming Task"}{" "}
                    {+taskOffset + 1}
                  </span>
                </h4>
                <h5 className="font-bold">{currentTask.title}</h5>
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
      </div>
    </>
  );
});
