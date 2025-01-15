import useFarmerAutoProcess from "@/hooks/useFarmerAutoProcess";
import useFarmerContext from "@/hooks/useFarmerContext";
import useProcessLock from "@/hooks/useProcessLock";
import { canJoinTelegramLink, cn, delay, logNicely } from "@/lib/utils";
import { memo } from "react";
import { useCallback } from "react";
import { useEffect } from "react";
import { useMemo } from "react";
import { useState } from "react";

import useCEXClaimTaskMutation from "../hooks/useCEXClaimTaskMutation";
import useCEXTasksQuery from "../hooks/useCEXTasksQuery";
import useCEXStartTaskMutation from "../hooks/useCEXStartTaskMutation";
import useCEXTasksConfigQuery from "../hooks/useCEXTasksConfigQuery";
import useCEXCheckTaskMutation from "../hooks/useCEXCheckTaskMutation";
import { isBefore, subMilliseconds } from "date-fns";
import useCEXChildrenQuery from "../hooks/useCEXChildrenQuery";

export default memo(function CEXTasks() {
  const configQuery = useCEXTasksConfigQuery();
  const childrenQuery = useCEXChildrenQuery();
  const tasksQuery = useCEXTasksQuery();

  const childrenCount = Number(childrenQuery.data?.childrenCount || 0);

  const { joinTelegramLink } = useFarmerContext();

  const validateReferralTask = useCallback(
    (task) =>
      task.type !== "referral" ||
      task.config?.taskDetails?.referralsLimit <= childrenCount,
    [childrenCount]
  );

  /** All Tasks */
  const allTasks = useMemo(
    () =>
      tasksQuery.data
        ? Object.entries(tasksQuery.data.tasks).map(([k, v]) => ({
            ...v,
            key: k,
            config: configQuery.data?.tasksConfig?.find(
              (item) => item.key === k || item.taskId === k
            ),
          }))
        : [],
    [tasksQuery.data, configQuery.data]
  );

  /** Available Tasks */
  const availableTasks = useMemo(
    () =>
      allTasks.filter(
        (item) =>
          ["boost_telegram"].includes(item.key) === false &&
          ["socialQuiz", "cexEvent"].includes(item.type) === false &&
          validateReferralTask(item)
      ),
    [allTasks, validateReferralTask]
  );

  /** Pending Tasks */
  const pendingTasks = useMemo(
    () => availableTasks.filter((item) => item.state === "NONE"),
    [availableTasks]
  );

  /** Unverified Tasks */
  const readyToCheckTasks = useMemo(
    () => availableTasks.filter((item) => item.state === "ReadyToCheck"),
    [availableTasks]
  );

  /** Unverified Tasks */
  const unverifiedTasks = useMemo(
    () =>
      readyToCheckTasks.filter((item) =>
        isBefore(
          new Date(item.startedAt),
          subMilliseconds(new Date(), Number(item.config?.delay || 0))
        )
      ),
    [readyToCheckTasks]
  );

  /** Unclaimed Tasks */
  const unclaimedTasks = useMemo(
    () => availableTasks.filter((item) => item.state === "ReadyToClaim"),
    [availableTasks]
  );

  /** Finished Tasks */
  const finishedTasks = useMemo(
    () => availableTasks.filter((item) => item.state === "Claimed"),
    [availableTasks]
  );

  const process = useProcessLock("cex.tasks");

  const [currentTask, setCurrentTask] = useState(null);
  const [taskOffset, setTaskOffset] = useState(null);
  const [action, setAction] = useState(null);

  const startTaskMutation = useCEXStartTaskMutation();
  const checkTaskMutation = useCEXCheckTaskMutation();
  const claimTaskMutation = useCEXClaimTaskMutation();

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

  /** Log Config */
  useEffect(() => {
    logNicely("CEX TASKS CONFIG", configQuery.data?.tasksConfig);
  }, [
    /** Config */
    configQuery.data?.tasksConfig,
  ]);

  /** Log All Tasks */
  useEffect(() => {
    logNicely("CEX ALL TASKS", allTasks);
    logNicely("CEX AVAILABLE TASKS", availableTasks);
    logNicely("CEX PENDING TASKS", pendingTasks);
    logNicely("CEX READY TO CHECK TASKS", readyToCheckTasks);
    logNicely("CEX UNVERIFIED TASKS", unverifiedTasks);
    logNicely("CEX UNCLAIMED TASKS", unclaimedTasks);
    logNicely("CEX FINISHED TASKS", finishedTasks);
  }, [
    /** Tasks */
    allTasks,
    availableTasks,
    pendingTasks,
    readyToCheckTasks,
    unverifiedTasks,
    unclaimedTasks,
    finishedTasks,
  ]);

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

            if (task["action_url"]) {
              if (canJoinTelegramLink(task["action_url"])) {
                await joinTelegramLink(task["action_url"]);
              }
            }

            /** Start Task */
            try {
              await startTaskMutation.mutateAsync(task.key);
            } catch {}

            /** Delay */
            await delay(2_000);
          }

          /** Refetch */
          try {
            await tasksQuery.refetch();
          } catch {}

          // Set Next Action
          resetTask();
          setAction("verify");

          return process.unlock();

        case "verify":
          /** Beginning of Start Action */
          setAction("verify");
          for (let [index, task] of Object.entries(unverifiedTasks)) {
            if (process.controller.signal.aborted) return;

            setTaskOffset(index);
            setCurrentTask(task);

            /** Verify Task */
            try {
              await checkTaskMutation.mutateAsync(task.key);
            } catch {}

            /** Delay */
            await delay(2_000);
          }

          /** Refetch */
          try {
            await tasksQuery.refetch();
          } catch {}

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
              await claimTaskMutation.mutateAsync(task.key);
            } catch {}

            /** Delay */
            await delay(2_000);
          }
          break;
      }

      /** Refetch */
      try {
        await tasksQuery.refetch();
      } catch {}

      resetTask();
      process.stop();
    })();
  }, [process, action, joinTelegramLink]);

  /** Auto-Complete Tasks */
  useFarmerAutoProcess(
    "tasks",
    [tasksQuery.isLoading, configQuery.isLoading].every(
      (status) => status === false
    ),
    process
  );

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

          <h4 className="font-bold text-sky-500">
            Unverified Tasks: {unverifiedTasks.length}
          </h4>

          <h4 className="font-bold text-orange-500">
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
                  : "bg-orange-500 text-white"
              )}
              onClick={() => process.dispatchAndToggle(!process.started)}
            >
              {process.started ? "Stop" : "Start"}
            </button>

            {process.started && currentTask ? (
              <div className="flex flex-col gap-2 p-4 rounded-lg bg-neutral-900">
                <h4 className="font-bold">
                  Current Mode:{" "}
                  <span
                    className={
                      action === "start" ? "text-yellow-500" : "text-green-500"
                    }
                  >
                    {action === "start"
                      ? "Starting Task"
                      : action === "verify"
                      ? "Verifying Task"
                      : "Claiming Task"}{" "}
                    {+taskOffset + 1}
                  </span>
                </h4>
                <h5 className="font-bold">
                  {currentTask.config?.actionDescription}
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
                        : action === "verify"
                        ? checkTaskMutation.status
                        : claimTaskMutation.status
                    ]
                  )}
                >
                  {action === "start"
                    ? startTaskMutation.status
                    : action === "verify"
                    ? checkTaskMutation.status
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
