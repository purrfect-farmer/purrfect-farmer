import useFarmerAutoProcess from "@/hooks/useFarmerAutoProcess";
import useFarmerContext from "@/hooks/useFarmerContext";
import useProcessLock from "@/hooks/useProcessLock";
import { canJoinTelegramLink, cn, delay } from "@/lib/utils";
import { isAfter } from "date-fns";
import { memo } from "react";
import { useCallback } from "react";
import { useEffect } from "react";
import { useMemo } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";

import MidasButton from "./MidasButton";
import useMidasClaimTaskMutation from "../hooks/useMidasClaimTaskMutation";
import useMidasStartTaskMutation from "../hooks/useMidasStartTaskMutation";
import useMidasTasksQuery from "../hooks/useMidasTasksQuery";

export default memo(function MidasAutoTasks() {
  const { joinTelegramLink } = useFarmerContext();
  const client = useQueryClient();
  const taskQuery = useMidasTasksQuery();

  /** All Tasks */
  const tasks = useMemo(
    () =>
      taskQuery.data
        ? taskQuery.data.filter(
            (item) =>
              /** Check Tasks */
              item.mechanic !== "CHECK_STATUS_CLAIM"
          )
        : [],
    [taskQuery.data]
  );

  /** Pending Tasks */
  const pendingTasks = useMemo(
    () => tasks.filter((item) => item.state === "WAITING"),
    [tasks]
  );

  /** Unclaimed Tasks */
  const unclaimedTasks = useMemo(
    () =>
      tasks.filter(
        (item) =>
          item.state === "CLAIMABLE" &&
          (item.canBeClaimedAt === null ||
            isAfter(new Date(), new Date(item.canBeClaimedAt)))
      ),
    [tasks]
  );

  /** Finished Tasks */
  const finishedTasks = useMemo(
    () => tasks.filter((item) => item.state === "COMPLETED"),
    [tasks]
  );

  const process = useProcessLock("midas.tasks");

  const [currentTask, setCurrentTask] = useState(null);
  const [taskOffset, setTaskOffset] = useState(null);
  const [action, setAction] = useState(null);

  const startTaskMutation = useMidasStartTaskMutation();
  const claimTaskMutation = useMidasClaimTaskMutation();

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

  /** Refetch Tasks */
  const refetchTasks = useCallback(
    () =>
      client.refetchQueries({
        queryKey: ["midas", "tasks"],
      }),
    [client]
  );

  /** Refetch Balance */
  const refetchBalance = useCallback(
    () =>
      client.refetchQueries({
        queryKey: ["midas", "user"],
      }),
    [client]
  );

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
          await refetchTasks();
          await refetchBalance();
        } catch (e) {
          console.error(e);
        }
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

            if (task.url && canJoinTelegramLink(task.url)) {
              await joinTelegramLink(task.url);
            }

            try {
              await startTaskMutation.mutateAsync(task.id);
            } catch (e) {
              console.error(e);
            }

            /** Delay */
            await delay(5_000);
          }

          // Set Next Action
          try {
            await refetchTasks();
          } catch (e) {
            console.error(e);
          }
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
              await claimTaskMutation.mutateAsync(task.id);
            } catch (e) {
              console.error(e);
            }

            /** Delay */
            await delay(5_000);
          }
          break;
      }

      await refetch();
      resetTask();

      /** Stop */
      return true;
    });
  }, [process, action, joinTelegramLink]);

  /** Auto-Complete Tasks */
  useFarmerAutoProcess("tasks", process, [taskQuery.isLoading === false]);

  return (
    <>
      <div className="flex flex-col py-2">
        {taskQuery.isPending ? (
          <h4 className="font-bold">Fetching tasks...</h4>
        ) : taskQuery.isError ? (
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
              <MidasButton
                color={process.started ? "danger" : "primary"}
                onClick={() => process.dispatchAndToggle(!process.started)}
                disabled={
                  pendingTasks.length === 0 && unclaimedTasks.length === 0
                }
              >
                {process.started ? "Stop" : "Start"}
              </MidasButton>

              {process.started && currentTask ? (
                <div className="flex flex-col gap-2 p-4 text-white rounded-lg bg-neutral-900">
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
                  <h5 className="font-bold">{currentTask.name}</h5>
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
    </>
  );
});
